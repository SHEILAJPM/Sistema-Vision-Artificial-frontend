import { AppShell } from "../components/layout/AppShell.jsx";
import { ReportsPanel } from "../components/reports/ReportsPanel.jsx";

export default function ReportsPage() {
  return (
    <AppShell title="Reportes" subtitle="Genera y descarga reportes de inspección por rango de fechas">
      <ReportsPanel />
    </AppShell>
  );
}
