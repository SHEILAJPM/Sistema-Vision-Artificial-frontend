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

export function SystemProvider({ children }) {
  const [status, setStatus] = useState(USE_MOCK_DATA ? mockStatus : null);
  const [stats, setStats] = useState(USE_MOCK_DATA ? mockStats : EMPTY_STATS);
  const [events, setEvents] = useState(USE_MOCK_DATA ? mockEvents : []);
  const [settings, setSettings] = useState(USE_MOCK_DATA ? mockSettings : null);
  const [detections, setDetections] = useState(
    USE_MOCK_DATA ? mockDetections : { boxes: [], frame_w: 0, frame_h: 0 }
  ); // cajas YOLOv8 del frame actual
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
        setEvents((prev) => [msg.data, ...prev].slice(0, 100));
        break;
      case "detections":
        // { boxes: [{x,y,w,h,label,confidence}], frame_w, frame_h }
        setDetections({ boxes: [], frame_w: 0, frame_h: 0, ...msg.data });
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
      setEvents(ev);
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
  if (command === "RECONNECT_ARDUINO") next.arduino = "connected";
  return next;
}

export function useSystem() {
  const ctx = useContext(SystemContext);
  if (!ctx) throw new Error("useSystem debe usarse dentro de <SystemProvider>");
  return ctx;
}
