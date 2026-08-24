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
} from "../lib/api.js";
import { useWebSocket } from "../lib/useWebSocket.js";
import { mockStatus, mockStats, mockEvents, mockSettings, mockDetections } from "../data/mockData.js";

const SystemContext = createContext(null);

const EMPTY_STATS = { today: { inspected: 0, rejected: 0, rejectRate: 0 }, trend: [], distribution: { ok: 0, defectuosos: 0 } };

export function SystemProvider({ children }) {
  const [status, setStatus] = useState(USE_MOCK_DATA ? mockStatus : null);
  const [stats, setStats] = useState(USE_MOCK_DATA ? mockStats : EMPTY_STATS);
  const [events, setEvents] = useState(USE_MOCK_DATA ? mockEvents : []);
  const [settings, setSettings] = useState(USE_MOCK_DATA ? mockSettings : null);
  const [detections, setDetections] = useState(
    USE_MOCK_DATA ? mockDetections : { boxes: [], frame_w: 0, frame_h: 0 }
  ); // cajas YOLOv8 del frame actual
  const [backendReachable, setBackendReachable] = useState(USE_MOCK_DATA);
  const [lastError, setLastError] = useState(null);

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

  // --- Acciones ---
  const sendCommand = useCallback(
    async (command, payload) => {
      if (USE_MOCK_DATA) {
        setStatus((prev) => applyOptimisticStatus(prev, command));
        return { ok: true, mock: true };
      }
      try {
        const res = await postControl(command, payload);
        await refreshAll();
        return { ok: true, res };
      } catch (err) {
        setLastError(err.message);
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
    events,
    settings,
    detections,
    wsConnected,
    backendReachable,
    connectionOk,
    lastError,
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
