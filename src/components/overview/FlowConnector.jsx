// Franja decorativa entre la fila de KPIs y la zona de inspección: sugiere
// que los datos de cada tarjeta "fluyen" hacia el instrumento central, no
// solo se listan arriba. Puramente ambiental (aria-hidden, pointer-events
// none) -- las líneas parten de la posición aproximada de cada tarjeta KPI
// (según su span en la grilla de 12 columnas de KpiCards) y convergen en el
// centro de LiveFeed (columna izquierda de la fila siguiente, que ocupa 2/3
// del ancho). Oculto por debajo de `md` porque en ese punto KpiCards ya dejó
// de ser una fila horizontal (pasa a 1-2 columnas), así que la métafora de
// "línea que baja" ya no aplica.
const SOURCES = [
  { x: 166, color: "#2F5233" }, // hero (inspeccionados) -- verde marca
  { x: 458, color: "#4C8A4E" }, // banda -- verde estado
  { x: 667, color: "#C6952A" }, // iluminacion -- dorado
  { x: 875, color: "#A6532E" }, // rechazados -- terracota
];
const TARGET_X = 333; // centro aproximado de LiveFeed (2/3 izquierdos de la fila siguiente)

export function FlowConnector() {
  return (
    <div className="pointer-events-none -my-3 hidden md:block" aria-hidden="true">
      <svg viewBox="0 0 1000 56" preserveAspectRatio="none" className="h-10 w-full">
        <defs>
          {SOURCES.map((s, i) => (
            <linearGradient key={i} id={`flow-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.85" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0.25" />
            </linearGradient>
          ))}
        </defs>
        {SOURCES.map((s, i) => (
          <path
            key={i}
            d={`M${s.x},0 C${s.x},30 ${TARGET_X},20 ${TARGET_X},56`}
            fill="none"
            stroke={`url(#flow-${i})`}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="5 7"
            className="animate-flow-dash"
          />
        ))}
      </svg>
    </div>
  );
}
