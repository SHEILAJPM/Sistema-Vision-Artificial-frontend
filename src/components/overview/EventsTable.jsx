import { ImageOff } from "lucide-react";
import { Card, CardHeader } from "../ui/Card.jsx";
import { Badge } from "../ui/Badge.jsx";
import { useSystem } from "../../context/SystemProvider.jsx";

const timeFormatter = new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const dateFormatter = new Intl.DateTimeFormat("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export function EventsTable({
  limit = 10,
  filterResult, // "ok" | "rejected" | undefined (todas)
  title = "Eventos recientes",
  subtitle = "Últimos limones procesados por la línea",
  showDate = false,
  emptyMessage = "Aún no hay eventos registrados.",
}) {
  const { events } = useSystem();
  const filtered = filterResult ? events.filter((ev) => ev.result === filterResult) : events;
  const rows = filtered.slice(0, limit);
  const formatTime = showDate ? dateFormatter : timeFormatter;

  return (
    <Card padded={false}>
      <div className="px-5 pt-5">
        <CardHeader title={title} subtitle={subtitle} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-line text-left text-xs uppercase tracking-wide text-ink-faint">
              <th className="px-5 py-2.5 font-medium">Miniatura</th>
              <th className="px-3 py-2.5 font-medium">{showDate ? "Fecha y hora" : "Hora"}</th>
              <th className="px-3 py-2.5 font-medium">Resultado</th>
              <th className="px-3 py-2.5 font-medium">Acción tomada</th>
              <th className="px-3 py-2.5 font-medium text-right pr-5">Confianza</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm text-ink-faint">
                  {emptyMessage}
                </td>
              </tr>
            )}
            {rows.map((ev) => {
              const isOk = ev.result === "ok";
              return (
                <tr key={ev.id} className="border-b border-line last:border-0 hover:bg-panel/60">
                  <td className="px-5 py-2.5">
                    {ev.thumbnail ? (
                      <img src={ev.thumbnail} alt="" className="h-9 w-9 rounded-md object-cover border border-line" />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-md border border-line bg-panel-alt text-ink-faint">
                        <ImageOff size={14} strokeWidth={1.5} />
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-ink-soft tnum">{formatTime.format(new Date(ev.timestamp))}</td>
                  <td className="px-3 py-2.5">
                    <Badge tone={isOk ? "ok" : "rejected"}>{isOk ? "OK" : "Rechazado"}</Badge>
                  </td>
                  <td className="px-3 py-2.5 text-ink-soft">{ev.action}</td>
                  <td className="px-3 py-2.5 pr-5 text-right text-ink-soft tnum">
                    {ev.confidence != null ? `${Math.round(ev.confidence * 100)}%` : "--"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
