import { useEffect, useState } from "react";
import { Radio } from "lucide-react";
import { AppShell } from "../components/layout/AppShell.jsx";
import { KpiCards } from "../components/overview/KpiCards.jsx";
import { LiveFeed } from "../components/overview/LiveFeed.jsx";
import { FlowConnector } from "../components/overview/FlowConnector.jsx";
import { TrendChart } from "../components/overview/TrendChart.jsx";
import { DistributionChart } from "../components/overview/DistributionChart.jsx";
import { EventsTable } from "../components/overview/EventsTable.jsx";
import { ControlPanel } from "../components/control/ControlPanel.jsx";

const timeFormatter = new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

// Reloj puramente local (no depende del backend): confirma que la pantalla
// sigue viva incluso entre dos actualizaciones de datos reales.
function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <p className="text-xs text-ink-faint tnum">
      Última actualización <span className="font-mono">{timeFormatter.format(now)}</span>
    </p>
  );
}

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-green-100 bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-green-700">
      <span className="relative flex h-1.5 w-1.5">
        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse-soft" />
      </span>
      <Radio size={11} strokeWidth={2.5} />
      En vivo
    </span>
  );
}

export default function OverviewPage() {
  return (
    <AppShell
      title="Resumen en vivo"
      subtitle="Estado actual de la línea de inspección de limones"
      badge={<LiveBadge />}
      headerRight={<LiveClock />}
    >
      <KpiCards />

      <FlowConnector />

      {/* Rig de 3 cámaras mirando el mismo punto de la banda al mismo
          instante (ver backend app/camera_manager.py) -- 3 feeds en fila en
          vez de uno solo, el panel de control queda debajo para no competir
          por ancho con los 3 streams a la vez. */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="animate-fade-up [animation-delay:220ms]">
          <LiveFeed cameraId="1" title="Cámara 1" />
        </div>
        <div className="animate-fade-up [animation-delay:260ms]">
          <LiveFeed cameraId="2" title="Cámara 2" />
        </div>
        <div className="animate-fade-up [animation-delay:300ms]">
          <LiveFeed cameraId="3" title="Cámara 3" />
        </div>
      </div>

      <div className="animate-fade-up [animation-delay:340ms]">
        <ControlPanel />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 animate-fade-up [animation-delay:380ms]">
          <TrendChart />
        </div>
        <div className="animate-fade-up [animation-delay:440ms]">
          <DistributionChart />
        </div>
      </div>

      <div className="animate-fade-up [animation-delay:500ms]">
        <EventsTable live />
      </div>
    </AppShell>
  );
}
