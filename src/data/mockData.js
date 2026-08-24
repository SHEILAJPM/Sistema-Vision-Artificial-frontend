// Datos de ejemplo usados solo cuando VITE_USE_MOCK_DATA=true, para poder
// revisar el diseno del dashboard sin backend/Arduino conectados.

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

export const mockDistribution = { ok: 812, defectuosas: 63 };

export const mockStats = {
  today: {
    inspected: 875,
    rejected: 63,
    rejectRate: 7.2,
  },
  trend: mockTrend,
  distribution: mockDistribution,
};

export const mockEvents = Array.from({ length: 14 }).map((_, i) => {
  const isRejected = i % 5 === 0;
  const minutesAgo = i * 3;
  const d = new Date(Date.now() - minutesAgo * 60000);
  return {
    id: `EVT-${1000 + i}`,
    timestamp: d.toISOString(),
    result: isRejected ? "rejected" : "ok",
    action: isRejected ? "Servo activado" : "Sin accion",
    confidence: isRejected ? 0.88 + (i % 3) * 0.02 : 0.95 + (i % 4) * 0.01,
    thumbnail: null,
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
    { id: "cam0", label: "Camara 1 - Zona de inspeccion" },
    { id: "cam1", label: "Camara 2 - Salida de banda" },
  ],
  serialPort: "COM4",
  baudrate: 115200,
  ports: ["COM3", "COM4", "COM5"],
  baudrates: [9600, 19200, 38400, 57600, 115200],
};
