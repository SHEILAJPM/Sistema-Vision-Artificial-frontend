import { useEffect, useRef, useState, useCallback } from "react";

// WebSocket con reintento exponencial acotado. Expone el último mensaje
// parseado y el estado de la conexión; onMessage se invoca por cada frame
// para que el consumidor decida cómo fusionarlo a su estado.
export function useWebSocket(url, { onMessage, enabled = true } = {}) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const retryRef = useRef(0);
  const timeoutRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (!enabled || !url) return;
    try {
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        retryRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessageRef.current?.(data);
        } catch {
          // Frame no-JSON (p. ej. ping de texto plano): se ignora.
        }
      };

      ws.onerror = () => ws.close();

      ws.onclose = () => {
        setConnected(false);
        socketRef.current = null;
        const delay = Math.min(1000 * 2 ** retryRef.current, 15000);
        retryRef.current += 1;
        timeoutRef.current = setTimeout(connect, delay);
      };
    } catch {
      setConnected(false);
    }
  }, [url, enabled]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(timeoutRef.current);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [connect]);

  const send = useCallback((payload) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(typeof payload === "string" ? payload : JSON.stringify(payload));
      return true;
    }
    return false;
  }, []);

  return { connected, send };
}
