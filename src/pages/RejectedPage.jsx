import { useMemo, useState } from "react";
import { PackageX, ListFilter, TriangleAlert } from "lucide-react";
import { AppShell } from "../components/layout/AppShell.jsx";
import { EventsTable } from "../components/overview/EventsTable.jsx";
import { EventsFilterBar } from "../components/overview/EventsFilterBar.jsx";
import { StatCard } from "../components/ui/StatCard.jsx";
import { HeroKpi } from "../components/ui/HeroKpi.jsx";
import { useSystem } from "../context/SystemProvider.jsx";
import { filterEventsByDate, eventsToCsv, downloadCsv } from "../lib/eventsExport.js";
import { useCountUp } from "../lib/useCountUp.js";

export default function RejectedPage() {
  const { events, stats } = useSystem();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    const byDate = filterEventsByDate(events, dateFrom, dateTo);
    return byDate.filter((ev) => ev.result === "rejected");
  }, [events, dateFrom, dateTo]);

  const rejected = stats?.today?.rejected ?? 0;
  const rejectRate = stats?.today?.rejectRate ?? 0;
  const trend = stats?.trend ?? [];
  const animatedFiltered = useCountUp(filtered.length);

  return (
    <AppShell title="Limones rechazados" subtitle="Limones marcados como defectuosos por el modelo de inspección activo">
      {/* Misma tarjeta hero que "Limones rechazados hoy" en Resumen en vivo
          (componente compartido HeroKpi) -- esta página muestra exactamente
          esa misma métrica, así que reusa el tratamiento en vez de quedar en
          una caja blanca chica al lado de una pantalla que ya la trata como
          la más importante del día. */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <HeroKpi
          span="sm:col-span-2"
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
        <StatCard icon={ListFilter} label="En el rango filtrado" tone="terracotta">
          <p className="text-2xl font-semibold text-ink tnum">{Math.round(animatedFiltered)}</p>
          <p className="text-xs text-ink-faint mt-1">según las fechas elegidas abajo</p>
        </StatCard>
      </div>

      <EventsFilterBar
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        exportDisabled={filtered.length === 0}
        onExport={() => downloadCsv(eventsToCsv(filtered), "limones-rechazados.csv")}
      />

      <EventsTable
        events={filtered}
        limit={100}
        showDate
        title="Limones rechazados"
        subtitle="El servo de rechazo se activó en cada uno de estos limones"
        emptyMessage="No se han rechazado limones todavía en el rango seleccionado."
      />
    </AppShell>
  );
}
