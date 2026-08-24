// Cliente REST hacia el backend (Flask/FastAPI). Centraliza la URL base, el
// token de sesion y el manejo de errores de red para que el resto de la app
// no repita fetch/try-catch.

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
export const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws";
export const VIDEO_FEED_PATH = import.meta.env.VITE_VIDEO_FEED_PATH || "/api/video_feed";
export const POLL_INTERVAL_MS = Number(import.meta.env.VITE_POLL_INTERVAL_MS) || 1500;
export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === "true";

export const AUTH_TOKEN_KEY = "inspectaline_token";
export const getStoredToken = () => localStorage.getItem(AUTH_TOKEN_KEY);
export const setStoredToken = (token) => {
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
  else localStorage.removeItem(AUTH_TOKEN_KEY);
};

// AuthProvider se registra aca para poder reaccionar a un 401 de cualquier
// endpoint (token vencido/revocado) sin que este archivo dependa de React.
let unauthorizedHandler = null;
export const setUnauthorizedHandler = (fn) => {
  unauthorizedHandler = fn;
};

async function request(path, options = {}) {
  const token = getStoredToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (res.status === 401) {
    unauthorizedHandler?.();
    throw new Error("Sesion invalida o expirada");
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${options.method || "GET"} ${path} -> HTTP ${res.status} ${body}`);
  }
  const contentType = res.headers.get("content-type") || "";
  return contentType.includes("application/json") ? res.json() : res.text();
}

// POST /api/auth/login  body: { username, password } -> { token, user: { name, role } }
export const postLogin = (username, password) =>
  request("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });

// GET /api/auth/me -> { name, role }  (valida el token guardado al recargar la app)
export const getMe = () => request("/api/auth/me");

// POST /api/auth/logout -- best effort, invalida el token en el backend
export const postLogout = () => request("/api/auth/logout", { method: "POST" });

// GET /api/status -> { banda, luz, arduino, backend }
export const getStatus = () => request("/api/status");

// POST /api/control  body: { command: "START" | "STOP" | "LIGHT_ON" | "LIGHT_OFF" | "TEST_SERVO" | "RECONNECT_ARDUINO" }
export const postControl = (command, payload = {}) =>
  request("/api/control", { method: "POST", body: JSON.stringify({ command, ...payload }) });

// GET /api/stats -> { today, trend, distribution }
export const getStats = () => request("/api/stats");

// GET /api/events?limit=50 -> [{ id, timestamp, result, action, thumbnail }]
export const getEvents = (limit = 50) => request(`/api/events?limit=${limit}`);

// GET /api/settings -> { pwmSpeed, confidenceThreshold, camera, cameras, serialPort, baudrate, ports }
export const getSettings = () => request("/api/settings");

// POST /api/settings  body: partial settings object
export const postSettings = (settings) =>
  request("/api/settings", { method: "POST", body: JSON.stringify(settings) });

export const videoFeedUrl = () => `${API_BASE_URL}${VIDEO_FEED_PATH}`;
