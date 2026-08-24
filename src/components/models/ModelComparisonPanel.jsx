import { useCallback, useEffect, useState } from "react";
import { Cpu, GitCompare, Layers, Check, TriangleAlert } from "lucide-react";
import { Card, CardHeader } from "../ui/Card.jsx";
import { StatDot } from "../ui/StatDot.jsx";
import { getModelStatus, postModelSelect, getModelComparison, USE_MOCK_DATA } from "../../lib/api.js";
import { mockModelStatus, mockModelComparison } from "../../data/mockData.js";

const POLL_MS = 4000;

const MODEL_OPTIONS = [
  { value: "A", label: "Modelo A", hint: "YOLOv8 - detección y localización" },
  { value: "B", label: "Modelo B", hint: "Clasificador ResNet18" },
  { value: "ambos", label: "Comparar ambos", hint: "Ejecuta A y B en cada limon" },
];

// Página "Modelos de IA": permite elegir cuál modelo evalúa cada limón (o
// correr los dos en paralelo) y muestra métricas comparativas calculadas por
// el backend a partir del historial de inspecciones. Se mantiene con su
// propio polling en vez de vivir en SystemProvider porque no es parte del
// estado "en vivo" que necesita el resto del dashboard.
export function ModelComparisonPanel() {
  const [modelStatus, setModelStatus] = useState(USE_MOCK_DATA ? mockModelStatus : null);
  const [comparison, setComparison] = useState(USE_MOCK_DATA ? mockModelComparison : null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (USE_MOCK_DATA) return;
    try {
      const [st, cmp] = await Promise.all([getModelStatus(), getModelComparison()]);
      setModelStatus(st);
      setComparison(cmp);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    if (USE_MOCK_DATA) return undefined;
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const handleSelect = async (modelo) => {
    if (USE_MOCK_DATA) {
      setModelStatus((prev) => ({ ...prev, seleccion_activa: modelo }));
      return;
    }
    setPending(true);
    try {
      await postModelSelect(modelo);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  };

  const activo = modelStatus?.seleccion_activa;
  const porModelo = comparison?.por_modelo ?? {};
  const acuerdo = comparison?.comparacion_directa;

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-coral-100 bg-coral-50 px-3.5 py-2.5 text-xs text-coral-600">
          <TriangleAlert size={14} strokeWidth={2} className="shrink-0" />
          {error}
        </div>
      )}

      {modelStatus?.modo_respaldo_heuristico && (
        <div className="flex items-center gap-2 rounded-lg border border-beige-100 bg-beige-50 px-3.5 py-2.5 text-xs text-beige-600">
          <TriangleAlert size={14} strokeWidth={2} className="shrink-0" />
          Ningún modelo entrenado está cargado; el sistema está usando el modelo heurístico de
          respaldo (sin pesos) para poder seguir probando banda, luz y servo.
        </div>
      )}

      <Card>
        <CardHeader
          icon={Cpu}
          title="Modelo activo"
          subtitle="Elige qué modelo evalúa cada limón, o compara ambos en paralelo"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {MODEL_OPTIONS.map((opt) => {
            const isActive = activo === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={pending}
                onClick={() => handleSelect(opt.value)}
                className={`focus-ring rounded-xl border px-4 py-3.5 text-left transition-colors duration-150 disabled:opacity-40 ${
                  isActive ? "border-blue-500 bg-blue-50" : "border-line bg-canvas hover:border-line-strong"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${isActive ? "text-blue-700" : "text-ink"}`}>
                    {opt.label}
                  </span>
                  {isActive && <Check size={15} className="text-blue-600" strokeWidth={2.5} />}
                </div>
                <p className="text-xs text-ink-faint mt-1">{opt.hint}</p>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ModelStatusCard
          label="Modelo A"
          hint="YOLOv8 (ultralytics)"
          loaded={modelStatus?.modelo_a_cargado}
          error={modelStatus?.errores_carga?.A}
        />
        <ModelStatusCard
          label="Modelo B"
          hint="Clasificador (ResNet18)"
          loaded={modelStatus?.modelo_b_cargado}
          error={modelStatus?.errores_carga?.B}
        />
      </div>

      <Card padded={false}>
        <div className="px-5 pt-5">
          <CardHeader
            icon={Layers}
            title="Comparación por modelo"
            subtitle="Calculado sobre el historial de inspecciones"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-line text-left text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-5 py-2.5 font-medium">Modelo</th>
                <th className="px-3 py-2.5 font-medium text-right">Inspecciones</th>
                <th className="px-3 py-2.5 font-medium text-right">Confianza prom.</th>
                <th className="px-3 py-2.5 font-medium text-right">Latencia prom.</th>
                <th className="px-3 py-2.5 font-medium text-right pr-5">Defectuosos</th>
              </tr>
            </thead>
            <tbody>
              {["A", "B"].map((key) => {
                const row = porModelo[key];
                return (
                  <tr key={key} className="border-b border-line last:border-0">
                    <td className="px-5 py-2.5 font-medium text-ink">Modelo {key}</td>
                    <td className="px-3 py-2.5 text-right text-ink-soft tnum">{row?.inspecciones ?? "--"}</td>
                    <td className="px-3 py-2.5 text-right text-ink-soft tnum">
                      {row ? `${Math.round(row.confianza_promedio * 100)}%` : "--"}
                    </td>
                    <td className="px-3 py-2.5 text-right text-ink-soft tnum">
                      {row ? `${row.latencia_promedio_ms.toFixed(0)} ms` : "--"}
                    </td>
                    <td className="px-3 py-2.5 pr-5 text-right text-ink-soft tnum">
                      {row?.defectuosos_detectados ?? "--"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader
          icon={GitCompare}
          title="Acuerdo entre A y B"
          subtitle="Solo cuenta limones evaluados por ambos modelos"
        />
        {acuerdo && acuerdo.piezas_evaluadas_por_ambos > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat label="Limones comparados" value={acuerdo.piezas_evaluadas_por_ambos} />
            <Stat label="Coincidencias" value={acuerdo.coincidencias} />
            <Stat label="Discrepancias" value={acuerdo.discrepancias} accent="text-coral-500" />
            <Stat label="% de acuerdo" value={`${acuerdo.porcentaje_acuerdo}%`} />
          </div>
        ) : (
          <p className="text-sm text-ink-faint">
            Selecciona "Comparar ambos" y deja pasar algunos limones para ver métricas de acuerdo.
          </p>
        )}
      </Card>
    </div>
  );
}

function ModelStatusCard({ label, hint, loaded, error }) {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">{label}</p>
          <p className="text-xs text-ink-faint">{hint}</p>
        </div>
        <StatDot tone={loaded ? "ok" : "idle"} pulse={loaded} label={loaded ? "Cargado" : "No cargado"} />
      </div>
      {error && <p className="text-xs text-coral-500 mt-1">{error}</p>}
    </Card>
  );
}

function Stat({ label, value, accent = "text-ink" }) {
  return (
    <div>
      <p className={`text-2xl font-semibold tnum ${accent}`}>{value}</p>
      <p className="text-xs text-ink-faint mt-0.5">{label}</p>
    </div>
  );
}
