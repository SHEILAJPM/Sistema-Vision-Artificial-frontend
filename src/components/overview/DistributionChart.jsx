import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardHeader } from "../ui/Card.jsx";
import { useSystem } from "../../context/SystemProvider.jsx";

const COLOR_OK = "#4273B0";
const COLOR_DEFECT = "#CA5551";

function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-lg border border-line bg-canvas px-3 py-2 shadow-card-hover">
      <div className="flex items-center gap-2 text-xs">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.payload.fill }} />
        <span className="text-ink-soft">{p.name}</span>
        <span className="ml-auto font-medium text-ink tnum">{p.value}</span>
      </div>
    </div>
  );
}

export function DistributionChart() {
  const { stats } = useSystem();
  const ok = stats?.distribution?.ok ?? 0;
  const defectuosos = stats?.distribution?.defectuosos ?? 0;
  const total = ok + defectuosos;
  const data = [
    { name: "OK", value: ok, fill: COLOR_OK },
    { name: "Defectuosos", value: defectuosos, fill: COLOR_DEFECT },
  ];
  const okPct = total ? Math.round((ok / total) * 100) : 0;

  return (
    <Card>
      <CardHeader title="Distribución de limones" subtitle="Proporción OK vs. defectuosos" />
      <div className="relative h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={92}
              paddingAngle={3}
              cornerRadius={4}
              stroke="#FFFFFF"
              strokeWidth={2}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.fill} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-semibold text-ink tnum">{total ? `${okPct}%` : "--"}</p>
          <p className="text-xs text-ink-faint">limones OK</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-center gap-6">
        <LegendDot color={COLOR_OK} label="OK" value={ok} />
        <LegendDot color={COLOR_DEFECT} label="Defectuosos" value={defectuosos} />
      </div>
    </Card>
  );
}

function LegendDot({ color, label, value }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-ink-soft">{label}</span>
      <span className="font-medium text-ink tnum">{value}</span>
    </div>
  );
}
