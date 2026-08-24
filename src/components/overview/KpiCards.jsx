import { Play, Square, Lightbulb, ScanLine, PackageX } from "lucide-react";
import { Card } from "../ui/Card.jsx";
import { Button } from "../ui/Button.jsx";
import { StatDot } from "../ui/StatDot.jsx";
import { Badge } from "../ui/Badge.jsx";
import { useSystem } from "../../context/SystemProvider.jsx";

function KpiShell({ icon: Icon, label, children, accent = "text-ink-faint" }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className={`flex items-center gap-2 ${accent}`}>
        <Icon size={15} strokeWidth={2} />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      {children}
    </Card>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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

      <KpiShell icon={Lightbulb} label="Iluminacion (rele)">
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

      <KpiShell icon={ScanLine} label="Inspeccionadas hoy">
        <p className="text-3xl font-semibold text-ink tnum">{inspected.toLocaleString("es")}</p>
        <p className="text-xs text-ink-faint">piezas procesadas por el modelo</p>
      </KpiShell>

      <KpiShell icon={PackageX} label="Rechazadas hoy" accent="text-coral-500">
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-semibold text-ink tnum">{rejected.toLocaleString("es")}</p>
          <Badge tone="rejected">{rejectRate.toFixed(1)}% rechazo</Badge>
        </div>
        <p className="text-xs text-ink-faint">porcentaje de rechazo del dia</p>
      </KpiShell>
    </div>
  );
}
