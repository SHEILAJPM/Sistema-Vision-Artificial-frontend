import { useState } from "react";
import PropTypes from "prop-types";
import { AnimatePresence, motion } from "motion/react";
import { ImageOff, Radio, ChevronLeft, ChevronRight } from "lucide-react";
import { Placeholder } from "react-bootstrap";
import { Card, CardHeader } from "../ui/Card.jsx";
import { Badge } from "../ui/Badge.jsx";
import { Button } from "../ui/Button.jsx";
import { EventDetailModal } from "./EventDetailModal.jsx";
import { useSystem } from "../../context/SystemProvider.jsx";

const timeFormatter = new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const dateFormatter = new Intl.DateTimeFormat("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

// Antes de que llegue el primer `events` (statsLoaded=false), la tabla
// mostraba directo el emptyMessage ("Aun no hay eventos") -- indistinguible
// de una linea que de verdad no proceso nada todavia. Filas placeholder en
// vez de eso, mismo numero de columnas que el header real.
// Misma idea que la barra de "Confianza prom." de ModelComparisonPanel --
// reusa ese motivo en vez de inventar uno nuevo para esta tabla (así ambas
// vistas de confianza se leen como el mismo dato). Color por resultado, no
// por magnitud: un 92% rechazado sigue siendo terracota, no un verde
// engañoso -- el color acá es identidad (OK/Rechazado), no una escala de
// "qué tan bueno es el número".
function ConfidenceBar({ value, isOk }) {
  if (value == null) return <span className="text-ink-faint">--</span>;
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center justify-end gap-2">
      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-panel-alt">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: isOk ? "#2F5233" : "#A6532E" }}
        />
      </div>
      <span className="tnum">{pct}%</span>
    </div>
  );
}

// Números de página a mostrar: siempre primera, última, la actual y sus
// vecinas inmediatas -- el resto colapsa en "…" para que la barra no crezca
// sin límite cuando hay muchas páginas.
function getPageNumbers(current, total) {
  const keep = [...new Set([1, total, current - 1, current, current + 1])]
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b);

  const pages = [];
  let prev = 0;
  for (const n of keep) {
    if (prev && n - prev > 1) pages.push("…");
    pages.push(n);
    prev = n;
  }
  return pages;
}

function Pagination({ page, totalPages, total, pageSize, onChange }) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3">
      <p className="text-xs text-ink-faint">
        Mostrando <span className="tnum">{from}</span>–<span className="tnum">{to}</span> de <span className="tnum">{total}</span>
      </p>
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm" icon={ChevronLeft} disabled={page === 1} onClick={() => onChange(page - 1)}>
          Anterior
        </Button>
        {getPageNumbers(page, totalPages).map((n, i) =>
          n === "…" ? (
            <span key={`ellipsis-${i}`} className="px-1.5 text-xs text-ink-faint">
              …
            </span>
          ) : (
            <button
              key={n}
              onClick={() => onChange(n)}
              aria-current={n === page ? "page" : undefined}
              className={`focus-ring h-8 w-8 rounded-lg text-xs font-medium transition-colors ${
                n === page ? "bg-green-500 text-white" : "text-ink-soft hover:bg-panel-alt"
              }`}
            >
              {n}
            </button>
          )
        )}
        <Button
          variant="outline"
          size="sm"
          icon={ChevronRight}
          className="flex-row-reverse"
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}

function EventRowSkeleton({ columns }) {
  return (
    <tr className="border-b border-l-2 border-line border-l-transparent last:border-0">
      <td className="px-5 py-2.5">
        <Placeholder as="div" animation="glow">
          <Placeholder xs={12} style={{ display: "block", height: 36, width: 36, borderRadius: 8 }} />
        </Placeholder>
      </td>
      {Array.from({ length: columns - 1 }).map((_, i) => (
        <td key={i} className="px-3 py-2.5">
          <Placeholder as="div" animation="glow">
            <Placeholder xs={6} size="sm" style={{ height: 10, borderRadius: 6 }} />
          </Placeholder>
        </td>
      ))}
    </tr>
  );
}

export function EventsTable({
  limit = 10,
  filterResult, // "ok" | "rejected" | undefined (todas)
  events: eventsProp, // opcional: override de src/context/SystemProvider.jsx (p. ej. ya filtrado por fecha)
  title = "Eventos recientes",
  subtitle = "Últimos limones procesados por la línea",
  showDate = false,
  emptyMessage = "Aún no hay eventos registrados.",
  // Solo Resumen en vivo pasa esto: Historial/Rechazados muestran un
  // registro paginado, no un feed en vivo, así que el badge quedaría
  // engañoso ahí -- mismo criterio que `badge`/`headerRight` en AppShell.
  live = false,
  // Historial/Rechazados: listas largas con paginación en vez del corte
  // silencioso en `limit` (que escondía cualquier evento más allá del
  // primer bloque sin dar forma de llegar al resto).
  paginate = false,
  pageSize = 10,
}) {
  const { events: contextEvents, statsLoaded } = useSystem();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [page, setPage] = useState(1);
  const events = eventsProp ?? contextEvents;
  const filtered = filterResult ? events.filter((ev) => ev.result === filterResult) : events;

  // En vista en vivo (sin filtro de fecha) `events` cambia de referencia en
  // cada evento nuevo por WebSocket -- resetear la página en un efecto atado
  // a esa referencia mandaría al usuario de vuelta a la página 1 cada vez que
  // entra un limón. El padre (Historial/Rechazados) remonta este componente
  // con una `key` cuando el rango de fechas de verdad cambia; acá solo hace
  // falta no quedar apuntando a una página que ya no existe.
  const totalPages = paginate ? Math.max(1, Math.ceil(filtered.length / pageSize)) : 1;
  const currentPage = Math.min(page, totalPages);
  const rows = paginate
    ? filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : filtered.slice(0, limit);
  const formatTime = showDate ? dateFormatter : timeFormatter;
  // El campo `model` es opcional: solo aparece si el backend ya lo manda en
  // /api/events (util cuando corren A y B en paralelo y hay que saber quien
  // decidio cada pieza). Si ningun evento lo trae, la columna no se muestra.
  const showModelColumn = rows.some((ev) => ev.model);
  const columnCount = showModelColumn ? 6 : 5;

  return (
    <Card padded={false}>
      <div className="px-5 pt-5">
        <CardHeader
          title={title}
          subtitle={subtitle}
          action={
            live && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-green-100 bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-green-700">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse-soft" />
                </span>
                <Radio size={11} strokeWidth={2.5} />
                En vivo
              </span>
            )
          }
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-line text-left text-xs uppercase tracking-wide text-ink-faint">
              <th className="px-5 py-2.5 font-medium">Miniatura</th>
              <th className="px-3 py-2.5 font-medium">{showDate ? "Fecha y hora" : "Hora"}</th>
              <th className="px-3 py-2.5 font-medium">Resultado</th>
              {showModelColumn && <th className="px-3 py-2.5 font-medium">Modelo</th>}
              <th className="px-3 py-2.5 font-medium">Acción tomada</th>
              <th className="px-3 py-2.5 font-medium text-right pr-5">Confianza</th>
            </tr>
          </thead>
          <tbody>
            {!statsLoaded &&
              Array.from({ length: Math.min(limit, 5) }).map((_, i) => (
                <EventRowSkeleton key={i} columns={columnCount} />
              ))}
            {statsLoaded && rows.length === 0 && (
              <tr>
                <td colSpan={columnCount} className="px-5 py-8 text-center text-sm text-ink-faint">
                  {emptyMessage}
                </td>
              </tr>
            )}
            {/* Entrada/salida con motion (aporte de Sheila): un flash de color
                tenue que se desvanece al montar, y las filas ahora salen con
                fade en vez de desaparecer de golpe cuando el limit las corta.
                El resto de la fila (chip de miniatura por color, columna de
                modelo, barra de confianza) es contenido propio, no se pierde
                al sumar la animación. */}
            <AnimatePresence initial={false}>
              {statsLoaded &&
                rows.map((ev) => {
                  const isOk = ev.result === "ok";
                  return (
                    <motion.tr
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      initial={{ opacity: 0, y: -10, backgroundColor: isOk ? "rgba(47,82,51,0.12)" : "rgba(166,83,46,0.12)" }}
                      animate={{ opacity: 1, y: 0, backgroundColor: "rgba(0,0,0,0)" }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.45, ease: "easeOut" }}
                      className={`cursor-pointer border-b border-l-2 border-line last:border-0 hover:bg-panel/60 ${
                        isOk ? "border-l-transparent" : "border-l-terracotta-300"
                      }`}
                    >
                      <td className="px-5 py-2.5">
                        {ev.thumbnail ? (
                          <img src={ev.thumbnail} alt="" className="h-9 w-9 rounded-md object-cover border border-line" />
                        ) : (
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-md border ${
                              isOk ? "border-green-100 bg-green-50 text-green-500" : "border-terracotta-100 bg-terracotta-50 text-terracotta-500"
                            }`}
                          >
                            <ImageOff size={14} strokeWidth={1.5} />
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-ink-soft tnum">{formatTime.format(new Date(ev.timestamp))}</td>
                      <td className="px-3 py-2.5">
                        <Badge tone={isOk ? "ok" : "rejected"}>{isOk ? "OK" : "Rechazado"}</Badge>
                      </td>
                      {showModelColumn && (
                        <td className="px-3 py-2.5">
                          {ev.model ? (
                            <Badge tone="neutral">{ev.model === "ambos" ? "A + B" : `Modelo ${ev.model}`}</Badge>
                          ) : (
                            <span className="text-ink-faint">--</span>
                          )}
                        </td>
                      )}
                      <td className="px-3 py-2.5 text-ink-soft">{ev.action}</td>
                      <td className="px-3 py-2.5 pr-5 text-right text-ink-soft">
                        <ConfidenceBar value={ev.confidence} isOk={isOk} />
                      </td>
                    </motion.tr>
                  );
                })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      {paginate && statsLoaded && (
        <Pagination page={currentPage} totalPages={totalPages} total={filtered.length} pageSize={pageSize} onChange={setPage} />
      )}
      <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </Card>
  );
}

EventsTable.propTypes = {
  limit: PropTypes.number,
  filterResult: PropTypes.oneOf(["ok", "rejected"]),
  events: PropTypes.arrayOf(PropTypes.object),
  title: PropTypes.string,
  subtitle: PropTypes.string,
  showDate: PropTypes.bool,
  emptyMessage: PropTypes.string,
  live: PropTypes.bool,
  paginate: PropTypes.bool,
  pageSize: PropTypes.number,
};
