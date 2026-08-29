// Datos de ejemplo usados solo cuando VITE_USE_MOCK_DATA=true, para poder
// revisar el diseño del dashboard sin backend/Arduino conectados.

export const mockStatus = {
  banda: "running", // "running" | "stopped"
  luz: "on", // "on" | "off"
  arduino: "connected", // "connected" | "disconnected"
  backend: "connected",
  serialPort: "COM4",
  baudrate: 115200,
};

const hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];
export const mockTrend = hours.map((hour, i) => ({
  hour,
  inspeccionadas: [42, 58, 51, 63, 47, 55, 60, 38][i],
  rechazadas: [3, 5, 4, 7, 3, 6, 5, 2][i],
}));

export const mockDistribution = { ok: 812, defectuosos: 63 };

export const mockStats = {
  today: {
    inspected: 875,
    rejected: 63,
    rejectRate: 7.2,
  },
  trend: mockTrend,
  distribution: mockDistribution,
};

const MODEL_CYCLE = ["A", "B", "ambos"];
export const mockEvents = Array.from({ length: 14 }).map((_, i) => {
  const isRejected = i % 5 === 0;
  const minutesAgo = i * 3;
  const d = new Date(Date.now() - minutesAgo * 60000);
  return {
    id: `EVT-${1000 + i}`,
    timestamp: d.toISOString(),
    result: isRejected ? "rejected" : "ok",
    action: isRejected ? "Servo activado" : "Sin acción",
    confidence: isRejected ? 0.88 + (i % 3) * 0.02 : 0.95 + (i % 4) * 0.01,
    thumbnail: null,
    model: MODEL_CYCLE[i % MODEL_CYCLE.length],
  };
});

export const mockDetections = {
  frame_w: 1280,
  frame_h: 720,
  boxes: [
    { x: 120, y: 70, w: 240, h: 200, label: "OK", confidence: 0.97 },
    { x: 900, y: 90, w: 210, h: 180, label: "defectuoso", confidence: 0.89 },
  ],
};

export const mockSettings = {
  pwmSpeed: 65,
  confidenceThreshold: 0.75,
  camera: "cam0",
  cameras: [
    { id: "cam0", label: "Cámara 1 - Zona de inspección" },
    { id: "cam1", label: "Cámara 2 - Salida de banda" },
  ],
  serialPort: "COM4",
  baudrate: 115200,
  ports: ["COM3", "COM4", "COM5"],
  baudrates: [9600, 19200, 38400, 57600, 115200],
};

export const mockModelStatus = {
  seleccion_activa: "ambos",
  modelo_decision: "A",
  modelo_a_cargado: true,
  modelo_b_cargado: true,
  modo_respaldo_heuristico: false,
  errores_carga: {},
};

export const mockReport = {
  range: { start: "2026-08-18", end: "2026-08-24" },
  totals: { inspected: 3210, ok: 2985, rejected: 225, rejectRate: 7.0 },
  dailySeries: [
    { date: "2026-08-18", inspeccionadas: 450, rechazadas: 30 },
    { date: "2026-08-19", inspeccionadas: 480, rechazadas: 35 },
    { date: "2026-08-20", inspeccionadas: 460, rechazadas: 28 },
    { date: "2026-08-21", inspeccionadas: 470, rechazadas: 33 },
    { date: "2026-08-22", inspeccionadas: 440, rechazadas: 31 },
    { date: "2026-08-23", inspeccionadas: 455, rechazadas: 34 },
    { date: "2026-08-24", inspeccionadas: 455, rechazadas: 34 },
  ],
  byModel: [
    { model: "A", inspeccionadas: 1605, rechazadas: 118, rejectRate: 7.4 },
    { model: "B", inspeccionadas: 1605, rechazadas: 107, rejectRate: 6.7 },
  ],
  defects: [
    { defect: "mancha", count: 96 },
    { defect: "podrido", count: 62 },
    { defect: "deformacion", count: 41 },
    { defect: "color_irregular", count: 26 },
  ],
};

export const mockUsers = [
  { id: 1, username: "operador", name: "Operador demo", role: "Admin", active: true },
  { id: 2, username: "jrodriguez", name: "Jose Rodriguez", role: "Operador", active: true },
];

export const mockModelComparison = {
  por_modelo: {
    A: { inspecciones: 428, confianza_promedio: 0.93, latencia_promedio_ms: 38, defectuosos_detectados: 31 },
    B: { inspecciones: 428, confianza_promedio: 0.89, latencia_promedio_ms: 21, defectuosos_detectados: 27 },
  },
  comparacion_directa: {
    piezas_evaluadas_por_ambos: 428,
    coincidencias: 401,
    discrepancias: 27,
    porcentaje_acuerdo: 93.7,
  },
  modelo_activo: "ambos",
};
