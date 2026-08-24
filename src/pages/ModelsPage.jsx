import { AppShell } from "../components/layout/AppShell.jsx";
import { ModelComparisonPanel } from "../components/models/ModelComparisonPanel.jsx";

export default function ModelsPage() {
  return (
    <AppShell title="Modelos de IA" subtitle="Selecciona y compara los modelos de detección de defectos">
      <ModelComparisonPanel />
    </AppShell>
  );
}
