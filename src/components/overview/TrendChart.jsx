import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardHeader } from "../ui/Card.jsx";
import { useSystem } from "../../context/SystemProvider.jsx";

// Colores de la paleta validada (ver documento de diseno): azul = OK /
// inspeccionadas, coral = rechazadas. Es el unico par usado para identidad
// de datos porque es el que separa con seguridad bajo daltonismo.
const COLOR_INSPECTED = "#4273B0";
const COLOR_REJECTED = "#CA5551";

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
  const { stats } = useSystem();
  const data = stats?.trend?.length
    ? stats.trend
    : [{ hour: "--:--", inspeccionadas: 0, rechazadas: 0 }];

  return (
    <Card>
      <CardHeader title="Inspeccionadas vs. rechazadas" subtitle="Ultimas horas de operacion" />
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#E6E4DD" />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 11, fill: "#8B9096" }}
              axisLine={{ stroke: "#E6E4DD" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#8B9096" }}
              axisLine={false}
              tickLine={false}
              width={36}
              allowDecimals={false}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#D6D3C8", strokeWidth: 1 }} />
            <Legend
              verticalAlign="top"
              align="right"
              height={28}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, color: "#5B6167" }}
            />
            <Line
              type="monotone"
              dataKey="inspeccionadas"
              name="Inspeccionadas"
              stroke={COLOR_INSPECTED}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
            />
            <Line
              type="monotone"
              dataKey="rechazadas"
              name="Rechazadas"
              stroke={COLOR_REJECTED}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
