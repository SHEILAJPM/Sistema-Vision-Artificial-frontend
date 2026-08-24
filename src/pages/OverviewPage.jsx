import { AppShell } from "../components/layout/AppShell.jsx";
import { KpiCards } from "../components/overview/KpiCards.jsx";
import { LiveFeed } from "../components/overview/LiveFeed.jsx";
import { TrendChart } from "../components/overview/TrendChart.jsx";
import { DistributionChart } from "../components/overview/DistributionChart.jsx";
import { EventsTable } from "../components/overview/EventsTable.jsx";
import { ControlPanel } from "../components/control/ControlPanel.jsx";

export default function OverviewPage() {
  return (
    <AppShell title="Resumen en vivo" subtitle="Estado actual de la linea de inspeccion">
      <KpiCards />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <LiveFeed />
        </div>
        <ControlPanel />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <TrendChart />
        </div>
        <DistributionChart />
      </div>

      <EventsTable />
    </AppShell>
  );
}
