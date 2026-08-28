import { useState } from "react";
import { Placeholder } from "react-bootstrap";
import { Play, Square, Lightbulb, ScanLine, PackageX, TriangleAlert } from "lucide-react";
import { Button } from "../ui/Button.jsx";
import { StatDot } from "../ui/StatDot.jsx";
import { StatCard } from "../ui/StatCard.jsx";
import { HeroKpi } from "../ui/HeroKpi.jsx";
import { useSystem } from "../../context/SystemProvider.jsx";

// Mismo tamano/span que las tarjetas reales para que no haya salto de layout
// cuando `statsLoaded` pasa a true -- sin esto, KpiCards mostraba "0" real
// desde el primer render, indistinguible de un dia que de verdad arranco en
// cero (hallazgo de /impeccable critique).
function KpiTileSkeleton({ span }) {
  return (
    <div className={`panel-card p-5 flex flex-col gap-3.5 ${span}`}>
      <Placeholder as="div" animation="glow">
        <Placeholder xs={6} size="sm" style={{ height: 9, borderRadius: 6 }} />
      </Placeholder>
      <Placeholder as="div" animation="glow">
        <Placeholder xs={5} style={{ height: 26, borderRadius: 8 }} />
      </Placeholder>
    </div>
  );
}

export function KpiCards() {
  const { status, stats, statsLoaded, sendCommand } = useSystem();
  // Mismo hallazgo que ControlPanel.jsx: estos botones tambien llaman a
  // sendCommand sin mirar el resultado (hallazgo P1 de /impeccable critique).
  const [error, setError] = useState(null);

  const bandaRunning = status?.banda === "running";
  const luzOn = status?.luz === "on";
  const inspected = stats?.today?.inspected ?? 0;
  const rejected = stats?.today?.rejected ?? 0;
  const rejectRate = stats?.today?.rejectRate ?? 0;
  const trend = stats?.trend ?? [];

  const run = async (command) => {
    const res = await sendCommand(command);
    setError(res.ok ? null : res.error ?? "El comando no se pudo ejecutar.");
  };

  if (!statsLoaded) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-12 gap-4">
        <KpiTileSkeleton span="sm:col-span-2 xl:col-span-4" />
        <KpiTileSkeleton span="xl:col-span-3" />
        <KpiTileSkeleton span="xl:col-span-2" />
        <KpiTileSkeleton span="sm:col-span-2 xl:col-span-3" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-terracotta-100 bg-terracotta-50 px-3.5 py-2.5 text-xs text-terracotta-600">
          <TriangleAlert size={14} strokeWidth={2} className="shrink-0" />
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-12 gap-4">
        <HeroKpi
          span="sm:col-span-2 xl:col-span-4"
          tone="green"
          icon={ScanLine}
          label="Limones inspeccionados hoy"
          value={inspected}
          caption="procesados por el modelo desde medianoche"
          trendKey="inspeccionadas"
          trend={trend}
        />

        <StatCard icon={ScanLine} label="Banda transportadora" tone={bandaRunning ? "green" : "idle"} span="xl:col-span-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-ink tnum">{bandaRunning ? "En marcha" : "Detenida"}</p>
              <StatDot tone={bandaRunning ? "ok" : "idle"} pulse={bandaRunning} label={bandaRunning ? "Activa" : "En reposo"} />
            </div>
            <Button
              size="sm"
              variant={bandaRunning ? "danger" : "primary"}
              icon={bandaRunning ? Square : Play}
              onClick={() => run(bandaRunning ? "STOP" : "START")}
            >
              {bandaRunning ? "Detener" : "Iniciar"}
            </Button>
          </div>
        </StatCard>

        <StatCard icon={Lightbulb} label="Iluminación (relé)" tone={luzOn ? "gold" : "idle"} span="xl:col-span-2">
          <div className="flex flex-col gap-2.5">
            <div>
              <p className="text-lg font-semibold text-ink tnum">{luzOn ? "Encendida" : "Apagada"}</p>
              {/* "Auto-ON" describe el modo de firmware del rele (se activa
                  solo al iniciar el sistema, ver Ayuda), no un segundo
                  estado -- mostrarlo tambien con la luz apagada leia como
                  contradictorio bajo "Apagada" (hallazgo P2 de
                  /impeccable critique). */}
              <StatDot tone={luzOn ? "gold" : "idle"} label={luzOn ? "Auto-ON" : undefined} />
            </div>
            <Button
              size="sm"
              variant="soft"
              className="self-start"
              onClick={() => run(luzOn ? "LIGHT_OFF" : "LIGHT_ON")}
            >
              {luzOn ? "Apagar" : "Encender"}
            </Button>
          </div>
        </StatCard>

        <HeroKpi
          span="sm:col-span-2 xl:col-span-3"
          tone="terracotta"
          icon={PackageX}
          label="Limones rechazados hoy"
          value={rejected}
          pill={
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium text-white/90">
              <TriangleAlert size={11} strokeWidth={2.5} />
              {rejectRate.toFixed(1)}% rechazo
            </span>
          }
          trendKey="rechazadas"
          trend={trend}
        />
      </div>
    </div>
  );
}
