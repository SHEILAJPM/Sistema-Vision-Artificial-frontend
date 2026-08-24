import { AppShell } from "../components/layout/AppShell.jsx";
import { SettingsPanel } from "../components/settings/SettingsPanel.jsx";

export default function SettingsPage() {
  return (
    <AppShell title="Configuración" subtitle="Parámetros de la banda, el modelo y la conexión serial">
      <SettingsPanel />
    </AppShell>
  );
}
