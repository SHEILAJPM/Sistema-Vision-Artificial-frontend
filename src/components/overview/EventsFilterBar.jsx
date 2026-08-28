import { Fade } from "react-bootstrap";
import { Download } from "lucide-react";
import { Button } from "../ui/Button.jsx";

const inputClass =
  "focus-ring rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink";

// Filtro de rango de fechas (sobre los eventos ya cargados en el cliente) +
// exportación a CSV. Vive junto a EventsTable en Historial y Rechazados.
export function EventsFilterBar({ dateFrom, dateTo, onDateFromChange, onDateToChange, onExport, exportDisabled }) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-canvas px-4 py-3.5">
      <div>
        <label className="block text-xs font-medium text-ink-faint mb-1" htmlFor="events-date-from">
          Desde
        </label>
        <input
          id="events-date-from"
          type="date"
          value={dateFrom}
          max={dateTo || undefined}
          onChange={(e) => onDateFromChange(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-ink-faint mb-1" htmlFor="events-date-to">
          Hasta
        </label>
        <input
          id="events-date-to"
          type="date"
          value={dateTo}
          min={dateFrom || undefined}
          onChange={(e) => onDateToChange(e.target.value)}
          className={inputClass}
        />
      </div>
      <Fade in={!!(dateFrom || dateTo)} unmountOnExit>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onDateFromChange("");
            onDateToChange("");
          }}
        >
          Limpiar
        </Button>
      </Fade>
      <Button variant="soft" size="sm" icon={Download} onClick={onExport} disabled={exportDisabled} className="ml-auto">
        Exportar CSV
      </Button>
    </div>
  );
}
