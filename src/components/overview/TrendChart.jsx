import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Placeholder } from "react-bootstrap";
import { Card, CardHeader } from "../ui/Card.jsx";
import { useSystem } from "../../context/SystemProvider.jsx";
import { useCountUp } from "../../lib/useCountUp.js";

// Verde/terracota -- mismo par de marca que las tarjetas hero de KpiCards,
// para que este gráfico se lea como parte del mismo sistema (antes usaba el
// azul/coral congelado de las cajas de detección de LiveFeed, que quedaba
// inconsistente al lado de todo lo demás ya migrado). Ese par azul/coral
// sigue vivo, pero acotado solo al overlay de detección en vivo.
const COLOR_INSPECTED = "#2F5233";
const COLOR_REJECTED = "#A6532E";

// Punto pulsante tipo "en vivo" solo en el último dato de la serie principal
// (inspeccionados) -- una sola señal de "esto sigue actualizándose" por
// gráfico, no una por serie: dos pulsos lado a lado competían por atención
// sin agregar información nueva (hallazgo P0 de /impeccable critique).
//
// El anillo va en CSS (animate-radar-ping, definida en tailwind.config.js),
// no en SMIL (<animate>) como antes: SMIL es un sistema de animación
// separado del CSS, así que la regla global de prefers-reduced-motion en
// index.css (que solo apaga animation-duration) no lo alcanzaba -- alguien
// con esa preferencia seguía viendo el punto pulsar sin parar (hallazgo P1
// de /impeccable critique). transform-box:fill-box hace que el scale() se
// centre en el propio círculo sin tener que calcular su transform-origin.
function LiveDot({ cx, cy, index, dataLength, color }) {
  if (index !== dataLength - 1 || cx == null || cy == null) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={4} fill={color} stroke="#fff" strokeWidth={2} />
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill={color}
        opacity={0.55}
        className="animate-radar-ping"
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      />
    </g>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-canvas px-3 py-2 shadow-card-hover">
      <p className="text-xs font-medium text-ink-soft mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-ink-soft">{p.name}</span>
          <span className="ml-auto font-medium text-ink tnum">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function TrendChart() {
  const { stats, statsLoaded } = useSystem();
  const data = stats?.trend?.length
    ? stats.trend
    : [{ hour: "--:--", inspeccionadas: 0, rechazadas: 0 }];
  const totalInspected = data.reduce((acc, d) => acc + (d.inspeccionadas ?? 0), 0);
  const totalRejected = data.reduce((acc, d) => acc + (d.rechazadas ?? 0), 0);
  // Escala Display (misma que el número hero de KpiCards, ver DESIGN.md) --
  // antes estos totales eran texto chico (text-sm), la sección más "callada"
  // del dashboard justo al lado de tarjetas que ya gritan. `/impeccable
  // bolder`: amplificar con el propio vocabulario del sistema, no inventar
  // uno nuevo.
  const animatedInspected = useCountUp(totalInspected);
  const animatedRejected = useCountUp(totalRejected);

  if (!statsLoaded) {
    return (
      <Card>
        <Placeholder as="p" animation="glow" className="mb-4">
          <Placeholder xs={4} size="sm" style={{ height: 10, borderRadius: 6 }} />
        </Placeholder>
        <Placeholder as="div" animation="glow">
          <Placeholder xs={12} style={{ height: 256, borderRadius: 12 }} />
        </Placeholder>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
        <CardHeader title="Limones inspeccionados vs. rechazados" subtitle="Últimas horas de operación" />
        <div className="flex shrink-0 items-baseline gap-7">
          <div className="text-right">
            <p className="text-4xl font-semibold text-green-600 tnum tracking-tight leading-none">
              {Math.round(animatedInspected).toLocaleString("es")}
            </p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-ink-faint mt-1.5">Inspeccionados</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-semibold text-terracotta-500 tnum tracking-tight leading-none">
              {Math.round(animatedRejected).toLocaleString("es")}
            </p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-ink-faint mt-1.5">Rechazados</p>
          </div>
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              {/* Relleno más saturado (0.32->0.5) y trazo más grueso que antes
                  -- los totales de arriba ya cargan la jerarquía, pero el
                  trazo mismo también se quedaba tímido al lado de las
                  tarjetas hero. Un solo relleno se sube de intensidad; el
                  otro se queda más quieto (asimetría hero/soporte, mismo
                  patrón que la fila de KPIs). */}
              <linearGradient id="colorInspected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLOR_INSPECTED} stopOpacity={0.5} />
                <stop offset="95%" stopColor={COLOR_INSPECTED} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="colorRejected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLOR_REJECTED} stopOpacity={0.28} />
                <stop offset="95%" stopColor={COLOR_REJECTED} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#E3D9C0" />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 11, fill: "#655F4C" }}
              axisLine={{ stroke: "#E3D9C0" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#655F4C" }}
              axisLine={false}
              tickLine={false}
              width={36}
              allowDecimals={false}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#C9B98D", strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="inspeccionadas"
              name="Inspeccionados"
              stroke={COLOR_INSPECTED}
              strokeWidth={3.5}
              fill="url(#colorInspected)"
              dot={<LiveDot dataLength={data.length} color={COLOR_INSPECTED} />}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
            />
            <Area
              type="monotone"
              dataKey="rechazadas"
              name="Rechazados"
              stroke={COLOR_REJECTED}
              strokeWidth={2.5}
              fill="url(#colorRejected)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
