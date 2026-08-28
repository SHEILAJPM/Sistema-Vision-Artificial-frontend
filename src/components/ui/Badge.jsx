// "ok" y "rejected" son el par de identidad validado (azul/coral) para datos
// que pueden aparecer lado a lado (tablas, leyendas): distinguible incluso
// con daltonismo. "info" (teal) queda solo para estados unicos que nunca se
// muestran junto a "rejected" en la misma vista (ver notas de paleta).
const TONES = {
  ok: "bg-green-50 text-green-700 border-green-100",
  rejected: "bg-terracotta-50 text-terracotta-600 border-terracotta-100",
  neutral: "bg-panel-alt text-ink-soft border-line",
  info: "bg-teal-50 text-teal-600 border-teal-100",
  warn: "bg-gold-50 text-gold-600 border-gold-100",
};

export function Badge({ tone = "neutral", children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
