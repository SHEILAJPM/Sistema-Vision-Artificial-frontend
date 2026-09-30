import { useState } from "react";
import { Trash2, TriangleAlert, Check } from "lucide-react";
import { Card, CardHeader } from "../ui/Card.jsx";
import { Button } from "../ui/Button.jsx";
import { postPurgeEvents, USE_MOCK_DATA } from "../../lib/api.js";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

// Solo Admin (HistoryPage la renderiza condicionalmente). Flujo de dos
// pasos -- primero vista previa (confirm=false, solo cuenta), recien al
// confirmar se borra de verdad -- para no eliminar historial por accidente
// con un click. Borra tanto las filas de inspection_events como sus
// miniaturas en disco (ver POST /api/events/purge).
export function PurgeEventsCard() {
  const [before, setBefore] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePreview = async () => {
    if (USE_MOCK_DATA) {
      setError("La purga no está disponible en modo demo.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setPreview(await postPurgeEvents(before, false));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      setResult(await postPurgeEvents(before, true));
      setPreview(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader
        icon={Trash2}
        title="Purgar historial antiguo"
        subtitle="Elimina eventos de inspección (y sus miniaturas) anteriores a una fecha -- no se puede deshacer"
      />
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="block text-xs text-ink-faint mb-1">Eliminar todo lo anterior a</span>
          <input
            type="date"
            value={before}
            max={todayIso()}
            onChange={(e) => {
              setBefore(e.target.value);
              setPreview(null);
              setResult(null);
            }}
            className="focus-ring rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink"
          />
        </label>
        <Button variant="soft" size="sm" onClick={handlePreview} disabled={loading}>
          {loading && !preview ? "Calculando..." : "Ver cuántos se eliminarían"}
        </Button>
      </div>

      {preview && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-gold-100 bg-gold-50 px-3.5 py-2.5 text-sm text-gold-700">
          <TriangleAlert size={14} strokeWidth={2} className="shrink-0" />
          Se eliminarían <strong className="tnum">{preview.eventos_a_eliminar}</strong> eventos anteriores al{" "}
          {before}. Esta acción no se puede deshacer.
          <Button variant="danger" size="sm" onClick={handleConfirm} disabled={loading || preview.eventos_a_eliminar === 0} className="ml-auto">
            {loading ? "Eliminando..." : "Confirmar y eliminar"}
          </Button>
        </div>
      )}

      {result && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-green-100 bg-green-50 px-3.5 py-2.5 text-xs text-green-700">
          <Check size={14} strokeWidth={2} className="shrink-0" />
          Se eliminaron {result.eventos_eliminados} eventos y {result.miniaturas_eliminadas} miniaturas.
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-coral-100 bg-coral-50 px-3.5 py-2.5 text-xs text-coral-600">
          <TriangleAlert size={14} strokeWidth={2} className="shrink-0" />
          {error}
        </div>
      )}
    </Card>
  );
}
