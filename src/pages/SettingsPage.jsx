import { AppShell } from "../components/layout/AppShell.jsx";
import { SettingsPanel } from "../components/settings/SettingsPanel.jsx";

export default function SettingsPage() {
  return (
    <AppShell title="Configuracion" subtitle="Parametros de la banda, el modelo y la conexion serial">
      <SettingsPanel />
    </AppShell>
  );
}
