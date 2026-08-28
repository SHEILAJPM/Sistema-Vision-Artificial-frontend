// Filtro de rango de fechas y exportación a CSV para las tablas de eventos.
// Ambos operan sobre los eventos ya cargados en memoria (src/context/SystemProvider.jsx):
// el backend no expone parámetros de rango de fechas en GET /api/events, así
// que esto es lo que se puede ofrecer sin tocar el contrato con el backend.

export function filterEventsByDate(events, dateFrom, dateTo) {
  if (!dateFrom && !dateTo) return events;
  const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
  const to = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;
  return events.filter((ev) => {
    const t = new Date(ev.timestamp);
    if (from && t < from) return false;
    if (to && t > to) return false;
    return true;
  });
}

const CSV_COLUMNS = [
  ["id", (ev) => ev.id],
  ["fecha_hora", (ev) => ev.timestamp],
  ["resultado", (ev) => (ev.result === "ok" ? "OK" : "Rechazado")],
  ["modelo", (ev) => ev.model ?? ""],
  ["accion", (ev) => ev.action ?? ""],
  ["confianza", (ev) => (ev.confidence != null ? Math.round(ev.confidence * 100) : "")],
];

function csvEscape(value) {
  const str = String(value ?? "");
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function eventsToCsv(events) {
  const header = CSV_COLUMNS.map(([name]) => name).join(",");
  const rows = events.map((ev) => CSV_COLUMNS.map(([, get]) => csvEscape(get(ev))).join(","));
  return [header, ...rows].join("\n");
}

export function downloadCsv(csv, filename) {
  const BOM = "\uFEFF"; // fuerza UTF-8 en Excel para que no rompa los acentos
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
