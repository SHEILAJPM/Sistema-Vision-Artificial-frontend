// Cliente REST hacia el backend (Flask/FastAPI). Centraliza la URL base, el
// token de sesión y el manejo de errores de red para que el resto de la app
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
    throw new Error("Sesión inválida o expirada");
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${options.method || "GET"} ${path} -> HTTP ${res.status} ${body}`);
  }
  const contentType = res.headers.get("content-type") || "";
  return contentType.includes("application/json") ? res.json() : res.text();
}

// Igual que request(), pero para multipart/form-data (subida de imágenes):
// no fija Content-Type (el navegador arma el boundary solo) y no serializa
// el body a JSON.
async function requestForm(path, formData) {
  const token = getStoredToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (res.status === 401) {
    unauthorizedHandler?.();
    throw new Error("Sesión inválida o expirada");
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`POST ${path} -> HTTP ${res.status} ${body}`);
  }
  return res.json();
}

// POST /api/auth/login  body: { username, password } -> { token, user: { name, role } }
export const postLogin = (username, password) =>
  request("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });

// GET /api/auth/me -> { name, role }  (valida el token guardado al recargar la app)
export const getMe = () => request("/api/auth/me");

// POST /api/auth/logout -- best effort, invalida el token en el backend
export const postLogout = () => request("/api/auth/logout", { method: "POST" });

// GET /api/status -> { banda, luz, esp32, backend, esp32Host, esp32Port }
export const getStatus = () => request("/api/status");

// POST /api/control  body: { command: "START" | "STOP" | "LIGHT_ON" | "LIGHT_OFF" | "TEST_SERVO" | "RECONNECT_ESP32" }
export const postControl = (command, payload = {}) =>
  request("/api/control", { method: "POST", body: JSON.stringify({ command, ...payload }) });

// GET /api/stats -> { today, trend, distribution }
export const getStats = () => request("/api/stats");

// GET /api/events?limit=50 ->
//   [{ id, timestamp, result, action, confidence, thumbnail, cameraId, model?, cameras }]
// `model` ("A" | "B" | "ambos") es opcional -- si el backend lo manda, la
// tabla de eventos muestra qué modelo decidió cada pieza; si no, oculta la columna.
// `cameras` trae la miniatura + confianza de cada una de las 3 cámaras del
// rig que participó en esa pieza (ver EventDetailModal.jsx).
export const getEvents = (limit = 50) => request(`/api/events?limit=${limit}`);

// POST /api/events/purge body: { before: "YYYY-MM-DD", confirm } (solo Admin)
// confirm=false -> vista previa ({ eventos_a_eliminar }), confirm=true -> borra de verdad
// ({ eventos_eliminados, miniaturas_eliminadas }). Borra también las miniaturas en disco.
export const postPurgeEvents = (before, confirm = false) =>
  request("/api/events/purge", { method: "POST", body: JSON.stringify({ before, confirm }) });

// GET /api/settings ->
//   { pwmSpeed, confidenceThreshold, camera1, camera2, camera3, camerasAvailable, esp32Host, esp32Port }
export const getSettings = () => request("/api/settings");

// POST /api/settings  body: partial settings object
export const postSettings = (settings) =>
  request("/api/settings", { method: "POST", body: JSON.stringify(settings) });

// GET /api/model/status -> { seleccion_activa, modelo_decision, modelo_a_cargado,
//   modelo_b_cargado, modo_respaldo_heuristico, errores_carga }
export const getModelStatus = () => request("/api/model/status");

// POST /api/model/select  body: { modelo: "A" | "B" | "ambos" }
export const postModelSelect = (modelo) =>
  request("/api/model/select", { method: "POST", body: JSON.stringify({ modelo }) });

// GET /api/model/comparacion -> { por_modelo, comparacion_directa, modelo_activo }
export const getModelComparison = () => request("/api/model/comparacion");

// GET /api/reports/summary?start=YYYY-MM-DD&end=YYYY-MM-DD ->
//   { range, totals: {inspected, ok, rejected, rejectRate}, dailySeries, byModel, defects }
export const getReportSummary = (start, end) => request(`/api/reports/summary?start=${start}&end=${end}`);

// GET /api/reports/export?start=...&end=... -> descarga el PDF del reporte del rango dado.
// No puede ser un <a href> plano: el endpoint exige el header Authorization, así que se
// trae como blob autenticado y se dispara la descarga manualmente.
export async function downloadReportPdf(start, end) {
  const token = getStoredToken();
  const res = await fetch(`${API_BASE_URL}/api/reports/export?start=${start}&end=${end}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (res.status === 401) {
    unauthorizedHandler?.();
    throw new Error("Sesión inválida o expirada");
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GET /api/reports/export -> HTTP ${res.status} ${body}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `reporte_inspeccion_${start}_a_${end}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// GET /api/users -> [{ id, username, name, role, active }]  (solo Admin)
export const getUsers = () => request("/api/users");

// POST /api/users  body: { username, password, name, role } -> usuario creado (solo Admin)
export const postUser = (user) => request("/api/users", { method: "POST", body: JSON.stringify(user) });

// PUT /api/users/:id  body: { name?, role? } -> usuario actualizado (solo Admin)
export const putUser = (id, patch) => request(`/api/users/${id}`, { method: "PUT", body: JSON.stringify(patch) });

// DELETE /api/users/:id -- solo Admin; falla si es el propio usuario o el último Admin
export const deleteUser = (id) => request(`/api/users/${id}`, { method: "DELETE" });

// POST /api/inspect/image (multipart) -> { image_w, image_h, latencia_total_ms, conteo, cajas, modelos }
// Inspección manual de una imagen suelta: no toca inspection_events ni las
// stats de la línea, ver README backend sección "Inspección Manual".
export async function postInspectImage(file, { conf, iou } = {}) {
  const form = new FormData();
  form.append("file", file);
  if (conf != null) form.append("conf", conf);
  if (iou != null) form.append("iou", iou);
  return requestForm("/api/inspect/image", form);
}

// --- Dataset (banco de imágenes para reentrenar el Modelo A) ---

// GET /api/dataset/classes -> { clases: [...] (Modelo A, cajas), clases_imagen_completa: [...] (Modelo B) }
export const getDatasetClasses = () => request("/api/dataset/classes");

// PUT /api/dataset/images/:id/class body: { class_label } -> clasifica la imagen completa;
// sirve a la vez para el Modelo A (class_label) y el B (copia el archivo a raw/<clase>/).
export const putImageClass = (id, classLabel) =>
  request(`/api/dataset/images/${id}/class`, { method: "PUT", body: JSON.stringify({ class_label: classLabel }) });

// GET /api/dataset/stats -> { total_imagenes, anotadas, por_clase }
export const getDatasetStats = () => request("/api/dataset/stats");

// GET /api/dataset/images?class_label=&limit=&offset= -> { total, items: [...] }
export const getDatasetImages = (params = {}) => {
  const qs = new URLSearchParams();
  if (params.classLabel) qs.set("class_label", params.classLabel);
  qs.set("limit", params.limit ?? 60);
  qs.set("offset", params.offset ?? 0);
  return request(`/api/dataset/images?${qs.toString()}`);
};

// GET /api/dataset/images/:id -> { id, url, source, class_label, width, height, created_at }
export const getDatasetImage = (id) => request(`/api/dataset/images/${id}`);

// POST /api/dataset/images (multipart, uno o varios archivos) -> { creadas, errores }
export async function postDatasetImages(files, classLabel) {
  const form = new FormData();
  for (const f of files) form.append("files", f);
  if (classLabel) form.append("class_label", classLabel);
  return requestForm("/api/dataset/images", form);
}

// DELETE /api/dataset/images/:id
export const deleteDatasetImage = (id) => request(`/api/dataset/images/${id}`, { method: "DELETE" });

// GET /api/dataset/images/:id/annotations -> { boxes: [{id, class_label, x1, y1, x2, y2}] }
export const getAnnotations = (imageId) => request(`/api/dataset/images/${imageId}/annotations`);

// PUT /api/dataset/images/:id/annotations  body: { boxes: [{class_label, x1, y1, x2, y2}] }
export const putAnnotations = (imageId, boxes) =>
  request(`/api/dataset/images/${imageId}/annotations`, { method: "PUT", body: JSON.stringify({ boxes }) });

// POST /api/dataset/export-yolo -> { export_dir, imagenes_train, imagenes_val, clases }
export const postExportYolo = () => request("/api/dataset/export-yolo", { method: "POST" });

export const datasetImageUrl = (path) => resolveMediaUrl(path);

// --- Entrenamiento (Modelo A/B en background) ---

// POST /api/train/start body: { target: "A"|"B", epochs, batch_size, lr?, imgsz? } -> { run_id }
export const postTrainStart = (payload) =>
  request("/api/train/start", { method: "POST", body: JSON.stringify(payload) });

// GET /api/train/runs?limit=20 -> [ {id, target, status, epoch_actual, epoch_total, ...} ]
export const getTrainRuns = (limit = 20) => request(`/api/train/runs?limit=${limit}`);

// GET /api/train/runs/:id -> detalle de un run
export const getTrainRun = (id) => request(`/api/train/runs/${id}`);

// POST /api/train/runs/:id/cancel -- best-effort
export const postTrainCancel = (id) => request(`/api/train/runs/${id}/cancel`, { method: "POST" });

// POST /api/train/runs/:id/promote -- copia el checkpoint a producción y recarga el modelo en caliente
export const postTrainPromote = (id) => request(`/api/train/runs/${id}/promote`, { method: "POST" });

// cameraId: "1" | "2" | "3" (rig de 3 cámaras, ver LiveFeed.jsx). Sin
// argumento apunta a la cámara "1" (mismo alias de compat que expone el
// backend en /api/video_feed, ver app/api/stream.py).
export const videoFeedUrl = (cameraId = "1") => `${API_BASE_URL}${VIDEO_FEED_PATH}/${cameraId}`;

// Las miniaturas de eventos llegan como path relativo (ej. "/media/thumbnails/x.jpg")
// tanto por REST (getEvents) como por WS ({type:"event"}); hay que anteponerles la
// URL base del backend para poder usarlas directo como src de <img>.
export const resolveMediaUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE_URL}${path}`;
};
