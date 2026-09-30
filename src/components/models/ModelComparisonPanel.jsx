import { useState } from "react";
import { Fade, Spinner, ProgressBar, Placeholder } from "react-bootstrap";
import { Cpu, GitCompare, Layers, Check, TriangleAlert } from "lucide-react";
import { Card, CardHeader } from "../ui/Card.jsx";
import { StatDot } from "../ui/StatDot.jsx";
import { useSystem } from "../../context/SystemProvider.jsx";
import { useCountUp } from "../../lib/useCountUp.js";

// Antes del primer refreshModel(), porModelo esta vacio y cada celda mostraba
// "--" -- igual que un modelo que de verdad nunca proceso nada. Filas
// placeholder mientras carga, "--" real solo despues (cuando ya sabemos que
// ese modelo no tiene datos).
function ModelRowSkeleton({ label }) {
  return (
    <tr className="border-b border-line last:border-0">
      <td className="px-5 py-2.5 font-medium text-ink">{label}</td>
      {Array.from({ length: 4 }).map((_, i) => (
        <td key={i} className="px-3 py-2.5 text-right">
          <Placeholder as="div" animation="glow" className="flex justify-end">
            <Placeholder xs={4} size="sm" style={{ height: 10, borderRadius: 6 }} />
          </Placeholder>
        </td>
      ))}
    </tr>
  );
}

// hint también se reusa como subtítulo de ModelStatusCard más abajo, y la
// letra (value) como sufijo de la clave modelo_<letra>_cargado en
// modelStatus (ver app/models/registry.py -> status()).
const MODEL_OPTIONS = [
  { value: "A", label: "Modelo A", hint: "YOLOv8 - detección y localización" },
  { value: "B", label: "Modelo B", hint: "Clasificador ResNet18" },
  { value: "D", label: "Modelo D", hint: "YOLOv12 - detección y localización" },
  { value: "E", label: "Modelo E", hint: "YOLO26 - detección y localización" },
  { value: "F", label: "Modelo F", hint: "Clasificador MobileNetV3-Small" },
  { value: "G", label: "Modelo G", hint: "Clasificador MobileNetV3-Large" },
  { value: "H", label: "Modelo H", hint: "Clasificador ShuffleNetV2" },
  { value: "I", label: "Modelo I", hint: "Clasificador EfficientNet-B0" },
  { value: "ambos", label: "Comparar ambos", hint: "Ejecuta A y B en cada limon" },
];

const STATUS_CARDS = MODEL_OPTIONS.filter((opt) => opt.value !== "ambos");
const COMPARISON_KEYS = STATUS_CARDS.map((opt) => opt.value);

// Página "Modelos de IA": permite elegir cuál modelo evalúa cada limón (o
// correr los dos en paralelo) y muestra métricas comparativas calculadas por
// el backend a partir del historial de inspecciones. El estado y el polling
// viven en SystemProvider (LiveFeed también los necesita para adaptar el
// overlay de detección al modelo activo), este componente solo lo consume.
export function ModelComparisonPanel() {
  const { modelStatus, modelComparison: comparison, modelLoaded, selectModel } = useSystem();
  const [pending, setPending] = useState(null); // valor del modelo que se está seleccionando, o null
  const [error, setError] = useState(null);

  const handleSelect = async (modelo) => {
    setPending(modelo);
    const res = await selectModel(modelo);
    if (!res.ok) setError(res.error);
    else setError(null);
    setPending(null);
  };

  const activo = modelStatus?.seleccion_activa;
  const porModelo = comparison?.por_modelo ?? {};
  const acuerdo = comparison?.comparacion_directa;

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-terracotta-100 bg-terracotta-50 px-3.5 py-2.5 text-xs text-terracotta-600">
          <TriangleAlert size={14} strokeWidth={2} className="shrink-0" />
          {error}
        </div>
      )}

      <Fade in={!!modelStatus?.modo_respaldo_heuristico} unmountOnExit>
        <div className="flex items-center gap-2 rounded-lg border border-gold-100 bg-gold-50 px-3.5 py-2.5 text-xs text-gold-600">
          <TriangleAlert size={14} strokeWidth={2} className="shrink-0" />
          Ningún modelo entrenado está cargado; el sistema está usando el modelo heurístico de
          respaldo (sin pesos) para poder seguir probando banda, luz y servo.
        </div>
      </Fade>

      <Card>
        <CardHeader
          icon={Cpu}
          title="Modelo activo"
          subtitle="Elige qué modelo evalúa cada limón, o compara ambos en paralelo"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {MODEL_OPTIONS.map((opt) => {
            const isActive = activo === opt.value;
            const isPending = pending === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={!!pending}
                onClick={() => handleSelect(opt.value)}
                className={`focus-ring rounded-xl border px-4 py-3.5 text-left transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97] disabled:opacity-40 ${
                  isActive ? "border-green-500 bg-green-50" : "border-line bg-canvas hover:border-line-strong"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${isActive ? "text-green-700" : "text-ink"}`}>
                    {opt.label}
                  </span>
                  {isPending ? (
                    <Spinner animation="border" size="sm" role="status" className="text-green-500" />
                  ) : (
                    isActive && <Check size={15} className="text-green-600" strokeWidth={2.5} />
                  )}
                </div>
                <p className="text-xs text-ink-faint mt-1">{opt.hint}</p>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {STATUS_CARDS.map((opt) => (
          <ModelStatusCard
            key={opt.value}
            label={opt.label}
            hint={opt.hint}
            loaded={modelStatus?.[`modelo_${opt.value.toLowerCase()}_cargado`]}
            error={modelStatus?.errores_carga?.[opt.value]}
          />
        ))}
      </div>

      <Card padded={false}>
        <div className="px-5 pt-5">
          <CardHeader
            icon={Layers}
            title="Comparación por modelo"
            subtitle="Calculado sobre el historial de inspecciones"
            action={
              // Honesto, no decorativo: refreshModel() en SystemProvider
              // repolla estos números cada 4s (MODEL_POLL_MS), así que esta
              // tabla de verdad se recalcula sola -- mismo motivo (y mismo
              // componente) que "En vivo" en EventsTable/LiveFeed.
              modelLoaded && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-green-100 bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-green-700">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse-soft" />
                  </span>
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
                <th className="px-5 py-2.5 font-medium">Modelo</th>
                <th className="px-3 py-2.5 font-medium text-right">Inspecciones</th>
                <th className="px-3 py-2.5 font-medium text-right">Confianza prom.</th>
                <th className="px-3 py-2.5 font-medium text-right">Latencia prom.</th>
                <th className="px-3 py-2.5 font-medium text-right pr-5">Defectuosos</th>
              </tr>
            </thead>
            <tbody>
              {!modelLoaded &&
                COMPARISON_KEYS.map((key) => <ModelRowSkeleton key={key} label={`Modelo ${key}`} />)}
              {modelLoaded && COMPARISON_KEYS.map((key) => {
                const row = porModelo[key];
                return (
                  <tr key={key} className="border-b border-line last:border-0">
                    <td className="px-5 py-2.5 font-medium text-ink">Modelo {key}</td>
                    <td className="px-3 py-2.5 text-right text-ink-soft tnum">{row?.inspecciones ?? "--"}</td>
                    <td className="px-3 py-2.5 text-right text-ink-soft tnum">
                      {row ? (
                        <div className="flex items-center justify-end gap-2">
                          {/* `variant` de react-bootstrap no sirve acá: genera
                              clases bg-primary/bg-danger que solo existen en
                              utilities.scss de Bootstrap, y ese partial está
                              excluido a propósito (colisiona con las
                              utilidades de Tailwind, ver bootstrap-custom.scss)
                              -- todas las barras caían al mismo color por
                              defecto sin importar la variante. Color explícito
                              en vez de eso; verde/dorado en vez de verde/
                              terracota porque esto compara Modelo A vs B, no
                              es la identidad OK-vs-Defectuoso (regla de los
                              Dos Pares, ver DESIGN.md) -- terracota ahí
                              insinuaría que el Modelo B es "malo". */}
                          <ProgressBar style={{ height: 5, width: 56 }}>
                            <ProgressBar
                              now={row.confianza_promedio * 100}
                              style={{ backgroundColor: key === "A" ? "#2F5233" : "#C6952A" }}
                            />
                          </ProgressBar>
                          <span>{Math.round(row.confianza_promedio * 100)}%</span>
                        </div>
                      ) : (
                        "--"
                      )}
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
          <div key="stats" className="space-y-5 animate-fade-up">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Stat label="Limones comparados" value={acuerdo.piezas_evaluadas_por_ambos} />
              <Stat label="Coincidencias" value={acuerdo.coincidencias} />
              <Stat label="Discrepancias" value={acuerdo.discrepancias} accent="text-terracotta-500" />
              <Stat label="% de acuerdo" value={acuerdo.porcentaje_acuerdo} suffix="%" />
            </div>
            <ProgressBar style={{ height: 8 }}>
              <ProgressBar now={acuerdo.porcentaje_acuerdo} animated style={{ backgroundColor: "#2F5233" }} />
            </ProgressBar>
          </div>
        ) : (
          <p key="placeholder" className="text-sm text-ink-faint animate-fade-up">
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
      {error && <p className="text-xs text-terracotta-500 mt-1">{error}</p>}
    </Card>
  );
}

function Stat({ label, value, suffix = "", accent = "text-ink" }) {
  const animated = useCountUp(value);
  return (
    <div>
      <p className={`text-2xl font-semibold tnum ${accent}`}>
        {Math.round(animated)}
        {suffix}
      </p>
      <p className="text-xs text-ink-faint mt-0.5">{label}</p>
    </div>
  );
}
