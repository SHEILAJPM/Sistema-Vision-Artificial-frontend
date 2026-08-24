import { motion } from "motion/react";
import { Play, Square, Lightbulb, ScanLine, PackageX } from "lucide-react";
import { Card } from "../ui/Card.jsx";
import { Button } from "../ui/Button.jsx";
import { StatDot } from "../ui/StatDot.jsx";
import { Badge } from "../ui/Badge.jsx";
import { AnimatedNumber } from "../ui/AnimatedNumber.jsx";
import { useSystem } from "../../context/SystemProvider.jsx";

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

function KpiShell({ icon: Icon, label, children, accent = "text-ink-faint" }) {
  return (
    <motion.div variants={cardVariants}>
      <Card className="flex flex-col gap-3">
        <div className={`flex items-center gap-2 ${accent}`}>
          <Icon size={15} strokeWidth={2} />
          <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
        </div>
        {children}
      </Card>
    </motion.div>
  );
}

export function KpiCards() {
  const { status, stats, sendCommand } = useSystem();

  const bandaRunning = status?.banda === "running";
  const luzOn = status?.luz === "on";
  const inspected = stats?.today?.inspected ?? 0;
  const rejected = stats?.today?.rejected ?? 0;
  const rejectRate = stats?.today?.rejectRate ?? 0;

  return (
    <motion.div
      variants={gridVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
    >
      <KpiShell icon={ScanLine} label="Banda transportadora">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-ink tnum">{bandaRunning ? "En marcha" : "Detenida"}</p>
            <StatDot tone={bandaRunning ? "ok" : "idle"} pulse={bandaRunning} label={bandaRunning ? "Activa" : "En reposo"} />
          </div>
          <Button
            size="sm"
            variant={bandaRunning ? "danger" : "primary"}
            icon={bandaRunning ? Square : Play}
            onClick={() => sendCommand(bandaRunning ? "STOP" : "START")}
          >
            {bandaRunning ? "Detener" : "Iniciar"}
          </Button>
        </div>
      </KpiShell>

      <KpiShell icon={Lightbulb} label="Iluminación (relé)">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-ink tnum">{luzOn ? "Encendida" : "Apagada"}</p>
            <StatDot tone={luzOn ? "info" : "idle"} label="Auto-ON al iniciar sistema" />
          </div>
          <Button
            size="sm"
            variant="soft"
            onClick={() => sendCommand(luzOn ? "LIGHT_OFF" : "LIGHT_ON")}
          >
            {luzOn ? "Apagar" : "Encender"}
          </Button>
        </div>
      </KpiShell>

      <KpiShell icon={ScanLine} label="Limones inspeccionados hoy">
        <p className="text-3xl font-semibold text-ink">
          <AnimatedNumber value={inspected} />
        </p>
        <p className="text-xs text-ink-faint">limones procesados por el modelo</p>
      </KpiShell>

      <KpiShell icon={PackageX} label="Limones rechazados hoy" accent="text-coral-500">
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-semibold text-ink">
            <AnimatedNumber value={rejected} />
          </p>
          <Badge tone="rejected">
            <AnimatedNumber value={rejectRate} format={(n) => `${n.toFixed(1)}%`} /> rechazo
          </Badge>
        </div>
        <p className="text-xs text-ink-faint">porcentaje de rechazo del día</p>
      </KpiShell>
    </motion.div>
  );
}
