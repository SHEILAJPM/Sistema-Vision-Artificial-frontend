import { ScanLine, Lightbulb, Wrench, Cable, Cpu, TriangleAlert } from "lucide-react";
import { AppShell } from "../components/layout/AppShell.jsx";
import { Card, CardHeader } from "../components/ui/Card.jsx";

const FAQ = [
  {
    icon: ScanLine,
    q: "La banda no arranca al presionar 'Iniciar'",
    a: "Revisa el indicador de conexión serial en el panel de control. Si aparece 'Sin conexión serial', usa 'Reiniciar conexión con Arduino' antes de reintentar.",
  },
  {
    icon: Lightbulb,
    q: "La luz no enciende automáticamente",
    a: "El relé se activa al iniciar el sistema por firmware del Arduino. Si no enciende, usa el override manual en el panel de control y revisa el cableado del relé.",
  },
  {
    icon: Wrench,
    q: "Quiero probar el servo de rechazo sin pasar un limón",
    a: "Usa el botón 'Probar servo' en el panel de control manual, dentro de Resumen en vivo. Activa el servo una vez, sin afectar los contadores de limones.",
  },
  {
    icon: Cable,
    q: "Cómo cambio el puerto serial o el baudrate",
    a: "Ve a Configuración > Conexión serial. Los cambios se envían al backend y se aplican en la siguiente reconexión con el Arduino.",
  },
  {
    icon: Cpu,
    q: "Cuál es la diferencia entre el Modelo A y el Modelo B",
    a: "En Modelos de IA puedes elegir cuál evalúa cada limón: el Modelo A (YOLOv8) detecta y localiza defectos, el Modelo B (ResNet18) clasifica la imagen completa. 'Comparar ambos' los corre en paralelo y muestra el nivel de acuerdo entre los dos.",
  },
];

export default function HelpPage() {
  return (
    <AppShell title="Ayuda" subtitle="Preguntas frecuentes sobre la operación del sistema">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FAQ.map(({ icon, q, a }) => (
          <Card key={q}>
            <CardHeader icon={icon} title={q} />
            <p className="text-sm text-ink-soft leading-relaxed">{a}</p>
          </Card>
        ))}
      </div>

      <Card className="flex items-start gap-3">
        <TriangleAlert size={18} className="text-coral-500 shrink-0 mt-0.5" strokeWidth={2} />
        <div>
          <p className="text-sm font-medium text-ink">Antes de una parada de emergencia</p>
          <p className="text-sm text-ink-soft mt-1 leading-relaxed">
            El botón "Detener banda" corta el PWM del L298N por software. Para mantenimiento físico
            de la banda, el servo o el relé, usa siempre el paro de emergencia físico del panel
            eléctrico además del control desde este dashboard.
          </p>
        </div>
      </Card>
    </AppShell>
  );
}
