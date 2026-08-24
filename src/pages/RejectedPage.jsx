import { AppShell } from "../components/layout/AppShell.jsx";
import { EventsTable } from "../components/overview/EventsTable.jsx";
import { Card } from "../components/ui/Card.jsx";
import { useSystem } from "../context/SystemProvider.jsx";

export default function RejectedPage() {
  const { stats } = useSystem();

  return (
    <AppShell title="Piezas rechazadas" subtitle="Piezas marcadas como defectuosas por el modelo YOLOv8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <p className="text-xs uppercase tracking-wide text-ink-faint mb-1">Rechazadas hoy</p>
          <p className="text-2xl font-semibold text-ink tnum">{stats?.today?.rejected ?? 0}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-ink-faint mb-1">% de rechazo</p>
          <p className="text-2xl font-semibold text-ink tnum">{(stats?.today?.rejectRate ?? 0).toFixed(1)}%</p>
        </Card>
      </div>

      <EventsTable
        limit={100}
        showDate
        filterResult="rejected"
        title="Piezas rechazadas"
        subtitle="El servo de rechazo se activo en cada una de estas piezas"
        emptyMessage="No se han rechazado piezas todavia."
      />
    </AppShell>
  );
}
