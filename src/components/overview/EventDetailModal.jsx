import { useEffect } from "react";
import PropTypes from "prop-types";
import { X, ImageOff } from "lucide-react";
import { Badge } from "../ui/Badge.jsx";

const dateTimeFormatter = new Intl.DateTimeFormat("es", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

// Mismas etiquetas que ya usa el resto del dashboard (Dataset/Anotacion) --
// texto legible para lo que el backend guarda como slug.
const DEFECT_LABELS = {
  mancha: "Mancha",
  deformacion: "Deformación",
  color_irregular: "Color irregular",
  podrido: "Podrido",
  defectuoso: "Defecto genérico",
};

const MODEL_LABELS = { A: "Modelo A (YOLOv8)", B: "Modelo B (clasificador)", C: "Heurístico de respaldo" };

// Detalle de un evento de la tabla (click en una fila): imagen mas grande +
// motivo especifico del rechazo, en vez de solo el badge OK/Rechazado.
// Modal propio (no react-bootstrap Modal) para no pelear con las clases de
// posicionamiento de Bootstrap que el proyecto no importa, ver comentario
// de ToastContainer en SettingsPanel.jsx.
export function EventDetailModal({ event, onClose }) {
  useEffect(() => {
    if (!event) return undefined;
    const handleKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [event, onClose]);

  if (!event) return null;

  const isOk = event.result === "ok";
  const defects = event.defects ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Detalle del evento"
        className="w-full max-w-md rounded-2xl bg-panel shadow-card-hover"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-semibold text-ink">{event.id}</h3>
            <Badge tone={isOk ? "ok" : "rejected"}>{isOk ? "OK" : "Rechazado"}</Badge>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="focus-ring rounded-lg p-1.5 text-ink-faint hover:bg-panel-alt hover:text-ink"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="overflow-hidden rounded-xl ring-1 ring-inset ring-line">
            {event.thumbnail ? (
              <img src={event.thumbnail} alt="" className="w-full max-h-72 object-contain bg-panel-alt" />
            ) : (
              <div className="flex h-40 items-center justify-center gap-2 bg-panel-alt text-ink-faint">
                <ImageOff size={18} strokeWidth={1.5} />
                Sin imagen
              </div>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-xs text-ink-faint">Fecha y hora</dt>
              <dd className="text-ink tnum">{dateTimeFormatter.format(new Date(event.timestamp))}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-faint">Confianza</dt>
              <dd className="text-ink tnum">{event.confidence != null ? `${Math.round(event.confidence * 100)}%` : "--"}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-faint">Acción tomada</dt>
              <dd className="text-ink">{event.action}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-faint">Modelo</dt>
              <dd className="text-ink">{event.model ? MODEL_LABELS[event.model] ?? event.model : "--"}</dd>
            </div>
          </dl>

          <div>
            <p className="text-xs text-ink-faint mb-1.5">Motivo</p>
            {isOk ? (
              <p className="text-sm text-ink-soft">No se detectó ningún defecto.</p>
            ) : defects.length === 0 ? (
              <p className="text-sm text-ink-soft">Rechazado por baja confianza general (sin defecto específico registrado).</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {defects.map((d) => (
                  <Badge key={d} tone="rejected">
                    {DEFECT_LABELS[d] ?? d}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

EventDetailModal.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.string,
    timestamp: PropTypes.string,
    result: PropTypes.oneOf(["ok", "rejected"]),
    action: PropTypes.string,
    confidence: PropTypes.number,
    thumbnail: PropTypes.string,
    model: PropTypes.string,
    defects: PropTypes.arrayOf(PropTypes.string),
  }),
  onClose: PropTypes.func.isRequired,
};
