import { MiniTrendLine } from "./MiniTrendLine.jsx";
import { useCountUp } from "../../lib/useCountUp.js";

// Tratamiento "hero" para la métrica que más importa de una pantalla --
// degradado oscuro (verde/terracota, nunca un tercer color, ver DESIGN.md),
// número a escala Display y una línea de tendencia que se dibuja sola,
// respira y pulsa en el último punto (MiniTrendLine). Nace en KpiCards.jsx
// (Resumen en vivo); se comparte acá para que cualquier pantalla que muestre
// la MISMA métrica que ya tiene tratamiento hero en Resumen en vivo (p. ej.
// "Limones rechazados hoy" en RejectedPage) reuse exactamente el mismo
// componente en vez de duplicar el patrón a mano.
export function HeroKpi({ span = "", tone, icon: Icon, label, value, caption, pill, trendKey, trend }) {
  const animatedValue = useCountUp(value);
  const from =
    tone === "green"
      ? "from-green-600 via-green-600 to-green-700 border-green-700"
      : "from-terracotta-600 via-terracotta-600 to-terracotta-700 border-terracotta-700";
  const lineColor = tone === "green" ? "#EAF3E6" : "#FBEEE6";
  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 shadow-card-hover flex flex-col justify-between ${from} ${span}`}>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle, #FFFFFF 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />
      <Icon size={96} strokeWidth={1} className="pointer-events-none absolute -right-4 -bottom-4 text-white/10" />

      <div className="relative flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white">
          <Icon size={15} strokeWidth={2} />
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-white/80">{label}</span>
      </div>

      <div className="relative mt-3">
        <div className="flex items-baseline gap-2.5 flex-wrap">
          <p className="text-4xl font-semibold text-white tnum tracking-tight">{Math.round(animatedValue).toLocaleString("es")}</p>
          {pill}
        </div>
        {caption && <p className="text-xs text-white/70 mt-1">{caption}</p>}
      </div>

      {trend.length > 1 && (
        <div className="relative mt-4 h-9">
          <MiniTrendLine data={trend.map((t) => t[trendKey] ?? 0)} color={lineColor} height={36} />
        </div>
      )}
    </div>
  );
}
