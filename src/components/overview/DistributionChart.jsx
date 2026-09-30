import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ProgressBar, Placeholder } from "react-bootstrap";
import { Card, CardHeader } from "../ui/Card.jsx";
import { useSystem } from "../../context/SystemProvider.jsx";
import { useCountUp } from "../../lib/useCountUp.js";

// Verde/terracota -- mismo par que TrendChart y las tarjetas hero, ver su
// comentario: antes usaba el azul/coral congelado de LiveFeed, que quedaba
// inconsistente al lado de todo lo demás ya migrado a la paleta de marca.
const COLOR_OK = "#2F5233";
const COLOR_DEFECT = "#A6532E";

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
  const { stats, statsLoaded } = useSystem();
  const ok = stats?.distribution?.ok ?? 0;
  const defectuosos = stats?.distribution?.defectuosos ?? 0;
  const total = ok + defectuosos;
  const data = [
    { name: "OK", value: ok, fill: COLOR_OK },
    { name: "Defectuosos", value: defectuosos, fill: COLOR_DEFECT },
  ];
  const okPct = total ? Math.round((ok / total) * 100) : 0;
  const animatedOkPct = useCountUp(okPct);

  if (!statsLoaded) {
    return (
      <Card>
        <Placeholder as="p" animation="glow" className="mb-4">
          <Placeholder xs={5} size="sm" style={{ height: 10, borderRadius: 6 }} />
        </Placeholder>
        <div className="flex h-64 items-center justify-center">
          <Placeholder as="div" animation="glow">
            <Placeholder xs={12} style={{ height: 176, width: 176, borderRadius: "50%" }} />
          </Placeholder>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Distribución de limones" subtitle="Proporción OK vs. defectuosos" />
      {/* Dona más grande + número central a escala Display (antes text-2xl):
          era el mismo "queda callado al lado de la fila de KPIs" que
          TrendChart -- mismo vocabulario del sistema (el número grande que
          ya usa HeroKpi), no uno nuevo. `/impeccable bolder`. */}
      <div className="relative h-72" style={{ filter: "drop-shadow(0 10px 20px rgba(47, 82, 51, 0.2))" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={72}
              outerRadius={106}
              paddingAngle={3}
              cornerRadius={5}
              stroke="#FCFAF4"
              strokeWidth={3}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.fill} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-4xl font-semibold text-ink tnum tracking-tight leading-none">
            {total ? `${Math.round(animatedOkPct)}%` : "--"}
          </p>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint mt-1.5">limones OK</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-center gap-3">
        <LegendPill color={COLOR_OK} label="OK" value={ok} />
        <LegendPill color={COLOR_DEFECT} label="Defectuosos" value={defectuosos} />
      </div>

      {/* Misma proporción en formato de barra apilada -- lectura rápida sin
          tener que interpretar el ángulo de la dona. Color forzado por
          `style` en vez de `variant`: react-bootstrap genera clases
          bg-primary/bg-danger que solo existen en utilities.scss, y ese
          partial está excluido a propósito (ver bootstrap-custom.scss) --
          la variante no pintaría nada sin esto. Usa COLOR_OK/COLOR_DEFECT
          para quedar igual que la dona de arriba. */}
      <ProgressBar className="mt-4" style={{ height: 8 }}>
        <ProgressBar now={total ? (ok / total) * 100 : 0} key="ok" style={{ backgroundColor: COLOR_OK }} />
        <ProgressBar now={total ? (defectuosos / total) * 100 : 0} key="def" style={{ backgroundColor: COLOR_DEFECT }} />
      </ProgressBar>
    </Card>
  );
}

function LegendPill({ color, label, value }) {
  return (
    <div
      className="flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs"
      style={{ borderColor: `${color}33`, backgroundColor: `${color}14` }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-ink-soft">{label}</span>
      <span className="font-medium text-ink tnum">{value}</span>
    </div>
  );
}
