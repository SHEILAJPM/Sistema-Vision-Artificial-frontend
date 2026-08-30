import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  WS_URL,
  POLL_INTERVAL_MS,
  USE_MOCK_DATA,
  getStoredToken,
  getStatus,
  getStats,
  getEvents,
  getSettings,
  postControl,
  postSettings,
  getModelStatus,
  getModelComparison,
  postModelSelect,
  resolveMediaUrl,
} from "../lib/api.js";
import { useWebSocket } from "../lib/useWebSocket.js";
import {
  mockStatus,
  mockStats,
  mockEvents,
  mockSettings,
  mockDetections,
  mockModelStatus,
  mockModelComparison,
} from "../data/mockData.js";

const SystemContext = createContext(null);

const EMPTY_STATS = { today: { inspected: 0, rejected: 0, rejectRate: 0 }, trend: [], distribution: { ok: 0, defectuosos: 0 } };
const MODEL_POLL_MS = 4000;
const EMPTY_CAMERA_DETECTIONS = { boxes: [], frame_w: 0, frame_h: 0 };
// Rig de 3 cámaras fijas (mismo punto de la banda, mismo instante -- ver
// backend app/camera_manager.py), así que `detections` se indexa por id de
// cámara en vez de ser un único objeto.
const EMPTY_DETECTIONS = { "1": EMPTY_CAMERA_DETECTIONS, "2": EMPTY_CAMERA_DETECTIONS, "3": EMPTY_CAMERA_DETECTIONS };

// Las miniaturas de la galería por cámara de un evento llegan igual que la
// principal: path relativo, hay que resolverlas contra la URL base (ver
// resolveMediaUrl más abajo) tanto si vienen por WS como por REST.
const resolveEventCameras = (cameras) =>
  (cameras ?? []).map((c) => ({ ...c, thumbnail: resolveMediaUrl(c.thumbnail) }));

export function SystemProvider({ children }) {
  const [status, setStatus] = useState(USE_MOCK_DATA ? mockStatus : null);
  const [stats, setStats] = useState(USE_MOCK_DATA ? mockStats : EMPTY_STATS);
  const [events, setEvents] = useState(USE_MOCK_DATA ? mockEvents : []);
  const [settings, setSettings] = useState(USE_MOCK_DATA ? mockSettings : null);
  const [detections, setDetections] = useState(USE_MOCK_DATA ? mockDetections : EMPTY_DETECTIONS); // cajas YOLOv8 por cámara
  const [backendReachable, setBackendReachable] = useState(USE_MOCK_DATA);
  // Distingue "todavia no llego el primer stats" de "hoy va con 0 limones":
  // KpiCards/TrendChart/DistributionChart arrancan en EMPTY_STATS antes de
  // esto, y sin esta bandera esa forma vacia se veia identica a un dia real
  // con cero throughput (hallazgo de /impeccable critique).
  const [statsLoaded, setStatsLoaded] = useState(USE_MOCK_DATA);
  const [lastError, setLastError] = useState(null);
  const [modelStatus, setModelStatus] = useState(USE_MOCK_DATA ? mockModelStatus : null);
  const [modelComparison, setModelComparison] = useState(USE_MOCK_DATA ? mockModelComparison : null);
  // Misma logica que statsLoaded: la tabla "Comparacion por modelo" mostraba
  // "--" en cada celda desde el primer render, igual que si el backend ya
  // hubiera contestado con historial vacio.
  const [modelLoaded, setModelLoaded] = useState(USE_MOCK_DATA);
  // Progreso en vivo del entrenamiento activo (mensajes "training_progress"
  // del WS, ver app/training_service.py). Solo lo consume TrainingPage, pero
  // vive acá para no abrir una segunda conexión WS solo para esa pantalla.
  const [trainingProgress, setTrainingProgress] = useState(null);

  // --- WebSocket: canal principal para estado/eventos/detecciones en vivo ---
  const handleMessage = useCallback((msg) => {
    if (!msg || typeof msg !== "object") return;
    switch (msg.type) {
      case "status":
        setStatus((prev) => ({ ...prev, ...msg.data }));
        setBackendReachable(true);
        break;
      case "stats":
        setStats((prev) => ({ ...prev, ...msg.data }));
        setStatsLoaded(true);
        break;
      case "event":
        setEvents((prev) =>
          [
            {
              ...msg.data,
              thumbnail: resolveMediaUrl(msg.data.thumbnail),
              cameras: resolveEventCameras(msg.data.cameras),
            },
            ...prev,
          ].slice(0, 100)
        );
        break;
      case "detections":
        // { cameras: { "1": {boxes,frame_w,frame_h}, "2": {...}, "3": {...} } }
        // Solo trae las cámaras que corrieron inferencia en este tick -- se
        // mergea sobre lo anterior en vez de pisarlo entero, para que una
        // cámara sin resultado nuevo conserve su último cuadro conocido.
        setDetections((prev) => {
          const camerasData = msg.data?.cameras ?? {};
          const next = { ...prev };
          for (const [cameraId, camDetections] of Object.entries(camerasData)) {
            next[cameraId] = { ...EMPTY_CAMERA_DETECTIONS, ...camDetections };
          }
          return next;
        });
        break;
      case "training_progress":
        // { run_id, target, epoch, epoch_total, loss, status }
        setTrainingProgress(msg.data);
        break;
      default:
        break;
    }
  }, []);

  // El navegador no permite headers custom en WebSocket, así que el token de
  // sesión va como query param -- el backend debe leerlo de ahí para
  // autenticar la conexión (en vez de un header Authorization).
  const token = getStoredToken();
  const wsUrl = USE_MOCK_DATA || !token ? null : `${WS_URL}?token=${encodeURIComponent(token)}`;
  const { connected: wsConnected } = useWebSocket(wsUrl, {
    onMessage: handleMessage,
    enabled: !USE_MOCK_DATA,
  });

  // --- Carga inicial + polling de respaldo si el WS no está activo ---
  const refreshAll = useCallback(async () => {
    try {
      const [s, st, ev] = await Promise.all([getStatus(), getStats(), getEvents(50)]);
      setStatus((prev) => ({ ...prev, ...s }));
      setStats((prev) => ({ ...prev, ...st }));
      setStatsLoaded(true);
      setEvents(
        ev.map((e) => ({ ...e, thumbnail: resolveMediaUrl(e.thumbnail), cameras: resolveEventCameras(e.cameras) }))
      );
      setBackendReachable(true);
      setLastError(null);
    } catch (err) {
      setBackendReachable(false);
      setLastError(err.message);
    }
  }, []);

  const pollRef = useRef(null);
  useEffect(() => {
    if (USE_MOCK_DATA) return undefined;

    refreshAll();
    getSettings().then(setSettings).catch(() => {});

    // El polling es solo respaldo: si el WS esta conectado, igual dejamos un
    // ciclo lento corriendo para no perder estado si algun mensaje se pierde.
    const intervalMs = wsConnected ? POLL_INTERVAL_MS * 4 : POLL_INTERVAL_MS;
    pollRef.current = setInterval(refreshAll, intervalMs);
    return () => clearInterval(pollRef.current);
  }, [refreshAll, wsConnected]);

  // --- Modelo activo: polling propio y mas lento, no viaja por WS ---
  const refreshModel = useCallback(async () => {
    if (USE_MOCK_DATA) return;
    try {
      const [st, cmp] = await Promise.all([getModelStatus(), getModelComparison()]);
      setModelStatus(st);
      setModelComparison(cmp);
      setModelLoaded(true);
    } catch {
      // el banner de conexion ya cubre backend caido; no pisamos lastError por esto
    }
  }, []);

  useEffect(() => {
    if (USE_MOCK_DATA) return undefined;
    refreshModel();
    const id = setInterval(refreshModel, MODEL_POLL_MS);
    return () => clearInterval(id);
  }, [refreshModel]);

  const selectModel = useCallback(
    async (modelo) => {
      if (USE_MOCK_DATA) {
        setModelStatus((prev) => ({ ...prev, seleccion_activa: modelo }));
        return { ok: true, mock: true };
      }
      try {
        await postModelSelect(modelo);
        await refreshModel();
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    },
    [refreshModel]
  );

  // --- Acciones ---
  const sendCommand = useCallback(
    async (command, payload) => {
      if (USE_MOCK_DATA) {
        setStatus((prev) => applyOptimisticStatus(prev, command));
        return { ok: true, mock: true };
      }
      // Mismo patch optimista que el modo mock, tambien en el backend real:
      // antes solo el demo se sentia instantaneo al tocar un tile (banda/luz),
      // y en produccion cada toggle esperaba el postControl + los 3 fetches
      // de refreshAll antes de reflejar nada -- una experiencia peor
      // justo en el ambiente real (hallazgo P2 de /impeccable critique).
      // Si el comando falla, el refreshAll del catch reconcilia contra el
      // estado real y pisa el patch optimista incorrecto.
      setStatus((prev) => applyOptimisticStatus(prev, command));
      try {
        const res = await postControl(command, payload);
        await refreshAll();
        return { ok: true, res };
      } catch (err) {
        setLastError(err.message);
        await refreshAll();
        return { ok: false, error: err.message };
      }
    },
    [refreshAll]
  );

  const saveSettings = useCallback(async (partial) => {
    if (USE_MOCK_DATA) {
      setSettings((prev) => ({ ...prev, ...partial }));
      return { ok: true, mock: true };
    }
    try {
      const res = await postSettings(partial);
      setSettings((prev) => ({ ...prev, ...partial, ...res }));
      return { ok: true };
    } catch (err) {
      setLastError(err.message);
      return { ok: false, error: err.message };
    }
  }, []);

  const connectionOk = USE_MOCK_DATA || wsConnected || backendReachable;

  const value = {
    status,
    stats,
    statsLoaded,
    events,
    settings,
    detections,
    wsConnected,
    backendReachable,
    connectionOk,
    lastError,
    modelStatus,
    modelComparison,
    modelLoaded,
    trainingProgress,
    selectModel,
    sendCommand,
    saveSettings,
    refreshAll,
  };

  return <SystemContext.Provider value={value}>{children}</SystemContext.Provider>;
}

function applyOptimisticStatus(prev, command) {
  const next = { ...prev };
  if (command === "START") next.banda = "running";
  if (command === "STOP") next.banda = "stopped";
  if (command === "LIGHT_ON") next.luz = "on";
  if (command === "LIGHT_OFF") next.luz = "off";
  if (command === "RECONNECT_ESP32") next.esp32 = "connected";
  return next;
}

export function useSystem() {
  const ctx = useContext(SystemContext);
  if (!ctx) throw new Error("useSystem debe usarse dentro de <SystemProvider>");
  return ctx;
}
