import { Card } from "./Card.jsx";

// Mismo mapeo de tono que StatDot (teal = "bueno"/activo, azul = info/neutro
// primario, coral = rechazo): la franja superior + el chip del ícono dejan
// leer el estado de una tarjeta de un vistazo, sin depender solo del texto.
// Nace en KpiCards.jsx (Resumen en vivo); se comparte acá para que
// Historial/Rechazados no vuelvan al patrón genérico "caja blanca + número".
//
// Sin shimmer ni ping en la franja/ícono: el color ya distingue el estado
// (teal/blue vs. gris idle) y el StatDot de al lado ya pulsa para "en vivo"
// -- una segunda señal de movimiento acá era ruido, no información nueva
// (hallazgo P0 de /impeccable critique: "ambient-motion overload").
export const STAT_TONE = {
  teal: { chip: "bg-teal-50 text-teal-600", bar: "bg-teal-500" },
  blue: { chip: "bg-blue-50 text-blue-600", bar: "bg-blue-400" },
  green: { chip: "bg-green-50 text-green-600", bar: "bg-green-500" },
  gold: { chip: "bg-gold-50 text-gold-600", bar: "bg-gold-500" },
  coral: { chip: "bg-coral-50 text-coral-500", bar: "bg-coral-500" },
  terracotta: { chip: "bg-terracotta-50 text-terracotta-500", bar: "bg-terracotta-500" },
  idle: { chip: "bg-panel-alt text-ink-faint", bar: "bg-line-strong" },
};

export function StatCard({ icon: Icon, label, children, tone = "idle", span = "" }) {
  const t = STAT_TONE[tone];
  return (
    <Card className={`relative overflow-hidden flex flex-col gap-3 ${span}`}>
      <span className={`absolute inset-x-0 top-0 h-1 ${t.bar}`} />
      <div className="flex items-center gap-2.5">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${t.chip}`}>
          <Icon size={15} strokeWidth={2} />
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</span>
      </div>
      {children}
    </Card>
  );
}
