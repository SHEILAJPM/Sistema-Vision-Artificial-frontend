import { useMemo, useState } from "react";
import { History, CheckCircle2, PackageX } from "lucide-react";
import { AppShell } from "../components/layout/AppShell.jsx";
import { EventsTable } from "../components/overview/EventsTable.jsx";
import { EventsFilterBar } from "../components/overview/EventsFilterBar.jsx";
import { PurgeEventsCard } from "../components/overview/PurgeEventsCard.jsx";
import { StatCard } from "../components/ui/StatCard.jsx";
import { HeroKpi } from "../components/ui/HeroKpi.jsx";
import { useSystem } from "../context/SystemProvider.jsx";
import { useAuth } from "../context/AuthProvider.jsx";
import { filterEventsByDate, eventsToCsv, downloadCsv } from "../lib/eventsExport.js";
import { useCountUp } from "../lib/useCountUp.js";

export default function HistoryPage() {
  const { events, stats } = useSystem();
  const { user } = useAuth();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => filterEventsByDate(events, dateFrom, dateTo), [events, dateFrom, dateTo]);
  const total = filtered.length;
  const ok = filtered.filter((e) => e.result === "ok").length;
  const rejectRate = stats?.today?.rejectRate ?? 0;

  const animatedOk = useCountUp(ok);
  const animatedRejectRate = useCountUp(rejectRate);
  // Sin filtro de fecha, esta lista sigue creciendo con cada evento nuevo que
  // llega por WebSocket (mismo `events` que consume Resumen en vivo). La
  // línea de tendencia del hero solo se muestra en ese caso -- con un rango
  // fijo elegido a mano, el sparkline de "hoy por hora" ya no describiría el
  // número que se está mostrando, y eso sería mentir sobre los datos.
  const isLiveView = !dateFrom && !dateTo;
  const trend = stats?.trend ?? [];
  const volumeTrend = trend.map((t) => ({ total: (t.inspeccionadas ?? 0) + (t.rechazadas ?? 0) }));

  return (
    <AppShell title="Historial de inspecciones" subtitle="Registro completo de limones procesados por el sistema">
      {/* 3 tarjetas del mismo ancho era el layout mas generico posible para
          este resumen -- "Eventos en pantalla" pasa a hero (mismo componente
          que ya usan Resumen en vivo y Rechazados) porque es la cifra que
          resume a las otras dos, no una mas del montón. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <HeroKpi
          span="sm:col-span-2"
          tone="green"
          icon={History}
          label="Eventos en pantalla"
          value={total}
          caption={isLiveView ? "se actualiza con cada evento nuevo" : "según el rango de fechas elegido"}
          trendKey="total"
          trend={isLiveView ? volumeTrend : []}
        />
        <StatCard icon={CheckCircle2} label="OK" tone="green">
          <p className="text-2xl font-semibold text-ink tnum">{Math.round(animatedOk)}</p>
        </StatCard>
        <StatCard icon={PackageX} label="Rechazo acumulado hoy" tone="terracotta">
          <p className="text-2xl font-semibold text-ink tnum">{animatedRejectRate.toFixed(1)}%</p>
        </StatCard>
      </div>

      <EventsFilterBar
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        exportDisabled={filtered.length === 0}
        onExport={() => downloadCsv(eventsToCsv(filtered), "historial-inspecciones.csv")}
      />

      <EventsTable
        key={`${dateFrom}|${dateTo}`}
        events={filtered}
        paginate
        pageSize={10}
        showDate
        title="Todos los eventos"
        subtitle="Limones inspeccionados, más recientes primero"
        emptyMessage="Ningún evento en el rango de fechas seleccionado."
      />

      {user?.role === "Admin" && <PurgeEventsCard />}
    </AppShell>
  );
}
