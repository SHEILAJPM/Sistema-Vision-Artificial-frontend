import { useState } from "react";
import PropTypes from "prop-types";
import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react";

// Panel colapsable con el JSON crudo de una respuesta -- equivalente al
// "Ver Respuesta JSON (Payload de API REST)" del sistema de referencia.
// Sin librería de resaltado de sintaxis nueva: <pre> monoespaciado alcanza
// para un payload de inspección de este tamaño.
export function JsonViewer({ data, title = "Ver respuesta JSON" }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const text = JSON.stringify(data, null, 2);

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard no disponible (ej. contexto no seguro) -- sin fallback, no es crítico
    }
  };

  return (
    <div className="rounded-xl border border-line overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="focus-ring flex w-full items-center justify-between gap-3 bg-panel-alt px-4 py-2.5 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-ink">
          {open ? <ChevronDown size={15} strokeWidth={2} /> : <ChevronRight size={15} strokeWidth={2} />}
          {title}
        </span>
        {open && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleCopy}
            className="focus-ring flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-ink-faint hover:bg-line hover:text-ink"
          >
            {copied ? <Check size={13} strokeWidth={2} /> : <Copy size={13} strokeWidth={2} />}
            {copied ? "Copiado" : "Copiar"}
          </span>
        )}
      </button>
      {open && (
        <pre className="max-h-96 overflow-auto bg-ink px-4 py-3 text-xs leading-relaxed text-green-300">
          {text}
        </pre>
      )}
    </div>
  );
}

JsonViewer.propTypes = {
  data: PropTypes.any,
  title: PropTypes.string,
};
