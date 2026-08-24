import { useEffect, useState } from "react";
import { CalendarRange, Download, ClipboardList, PackageX, ScanLine, Percent, TriangleAlert } from "lucide-react";
import { Card, CardHeader } from "../ui/Card.jsx";
import { Button } from "../ui/Button.jsx";
import { getReportSummary, downloadReportPdf, USE_MOCK_DATA } from "../../lib/api.js";
import { mockReport } from "../../data/mockData.js";

const MODEL_LABELS = { A: "Modelo A (YOLOv8)", B: "Modelo B (clasificador)", C: "Heurístico de respaldo" };

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  return { start: isoDate(start), end: isoDate(end) };
}

function StatCard({ icon: Icon, label, value, accent = "text-ink-faint" }) {
  return (
    <Card className="flex flex-col gap-2">
      <div className={`flex items-center gap-2 ${accent}`}>
        <Icon size={15} strokeWidth={2} />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-semibold text-ink tnum">{value}</p>
    </Card>
  );
}

// Página "Reportes": a diferencia del Historial (lista viva de eventos vía
// SystemProvider), esto genera un resumen agregado bajo demanda para un
// rango de fechas elegido, con opción de descargarlo como PDF. Por eso no
// vive en SystemProvider y mantiene su propio estado local.
export function ReportsPanel() {
  const [range, setRange] = useState(defaultRange);
  const [report, setReport] = useState(USE_MOCK_DATA ? mockReport : null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  const loadReport = async () => {
    if (USE_MOCK_DATA) {
      setReport(mockReport);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setReport(await getReportSummary(range.start, range.end));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
    // Solo al montar: carga el rango por defecto (últimos 7 días). Cambios
    // posteriores de fecha se aplican con el botón "Generar reporte".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownload = async () => {
    if (USE_MOCK_DATA) {
      setError("La descarga de PDF no está disponible en modo demo.");
      return;
    }
    setDownloading(true);
    setError(null);
    try {
      await downloadReportPdf(range.start, range.end);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  const totals = report?.totals;
  const maxDefect = report?.defects?.[0]?.count ?? 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader icon={CalendarRange} title="Periodo del reporte" subtitle="Elige el rango de fechas a resumir" />
        <div className="flex flex-wrap items-end gap-4">
          <label className="text-sm">
            <span className="block text-xs text-ink-faint mb-1">Desde</span>
            <input
              type="date"
              value={range.start}
              max={range.end}
              onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))}
              className="focus-ring rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink"
            />
          </label>
          <label className="text-sm">
            <span className="block text-xs text-ink-faint mb-1">Hasta</span>
            <input
              type="date"
              value={range.end}
              min={range.start}
              max={isoDate(new Date())}
              onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))}
              className="focus-ring rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink"
            />
          </label>
          <Button variant="primary" onClick={loadReport} disabled={loading}>
            {loading ? "Generando..." : "Generar reporte"}
          </Button>
          <Button variant="soft" icon={Download} onClick={handleDownload} disabled={downloading || !totals}>
            {downloading ? "Descargando..." : "Descargar PDF"}
          </Button>
        </div>
        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-coral-100 bg-coral-50 px-3.5 py-2.5 text-xs text-coral-600">
            <TriangleAlert size={14} strokeWidth={2} className="shrink-0" />
            {error}
          </div>
        )}
      </Card>

      {totals && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard icon={ScanLine} label="Inspeccionados" value={totals.inspected.toLocaleString("es")} />
            <StatCard icon={ClipboardList} label="OK" value={totals.ok.toLocaleString("es")} />
            <StatCard
              icon={PackageX}
              label="Rechazados"
              value={totals.rejected.toLocaleString("es")}
              accent="text-coral-500"
            />
            <StatCard icon={Percent} label="Tasa de rechazo" value={`${totals.rejectRate}%`} accent="text-coral-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card padded={false}>
              <div className="px-5 pt-5">
                <CardHeader title="Desglose por modelo" subtitle="Piezas decididas por cada modelo en el periodo" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y border-line text-left text-xs uppercase tracking-wide text-ink-faint">
                      <th className="px-5 py-2.5 font-medium">Modelo</th>
                      <th className="px-3 py-2.5 font-medium text-right">Inspeccionados</th>
                      <th className="px-3 py-2.5 font-medium text-right">Rechazados</th>
                      <th className="px-3 py-2.5 font-medium text-right pr-5">Tasa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.byModel.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-sm text-ink-faint">
                          Sin datos en el periodo seleccionado.
                        </td>
                      </tr>
                    )}
                    {report.byModel.map((m) => (
                      <tr key={m.model} className="border-b border-line last:border-0">
                        <td className="px-5 py-2.5 text-ink">{MODEL_LABELS[m.model] ?? m.model}</td>
                        <td className="px-3 py-2.5 text-right text-ink-soft tnum">{m.inspeccionadas}</td>
                        <td className="px-3 py-2.5 text-right text-ink-soft tnum">{m.rechazadas}</td>
                        <td className="px-3 py-2.5 text-right pr-5 text-ink-soft tnum">{m.rejectRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <CardHeader title="Defectos más comunes" subtitle="Ranking de defectos detectados en el periodo" />
              {report.defects.length === 0 ? (
                <p className="text-sm text-ink-faint">No se registraron defectos en el periodo seleccionado.</p>
              ) : (
                <div className="space-y-3">
                  {report.defects.map((d) => (
                    <div key={d.defect}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-ink-soft">{d.defect}</span>
                        <span className="font-medium text-ink tnum">{d.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-panel-alt overflow-hidden">
                        <div
                          className="h-full rounded-full bg-coral-500"
                          style={{ width: `${maxDefect ? (d.count / maxDefect) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
