import { AppShell } from "../components/layout/AppShell.jsx";
import { EventsTable } from "../components/overview/EventsTable.jsx";
import { Card } from "../components/ui/Card.jsx";
import { useSystem } from "../context/SystemProvider.jsx";

export default function HistoryPage() {
  const { events, stats } = useSystem();
  const total = events.length;
  const ok = events.filter((e) => e.result === "ok").length;

  return (
    <AppShell title="Historial de inspecciones" subtitle="Registro completo de limones procesados por el sistema">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-xs uppercase tracking-wide text-ink-faint mb-1">Eventos en pantalla</p>
          <p className="text-2xl font-semibold text-ink tnum">{total}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-ink-faint mb-1">OK</p>
          <p className="text-2xl font-semibold text-ink tnum">{ok}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-ink-faint mb-1">Rechazo acumulado hoy</p>
          <p className="text-2xl font-semibold text-ink tnum">{(stats?.today?.rejectRate ?? 0).toFixed(1)}%</p>
        </Card>
      </div>

      <EventsTable
        limit={100}
        showDate
        title="Todos los eventos"
        subtitle="Limones inspeccionados, más recientes primero"
      />
    </AppShell>
  );
}
