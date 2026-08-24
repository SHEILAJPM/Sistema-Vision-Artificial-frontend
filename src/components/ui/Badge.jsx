// "ok" y "rejected" son el par de identidad validado (azul/coral) para datos
// que pueden aparecer lado a lado (tablas, leyendas): distinguible incluso
// con daltonismo. "info" (teal) queda solo para estados unicos que nunca se
// muestran junto a "rejected" en la misma vista (ver notas de paleta).
const TONES = {
  ok: "bg-blue-50 text-blue-700 border-blue-100",
  rejected: "bg-coral-50 text-coral-600 border-coral-100",
  neutral: "bg-panel-alt text-ink-soft border-line",
  info: "bg-teal-50 text-teal-600 border-teal-100",
  warn: "bg-beige-50 text-beige-600 border-beige-100",
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
