import { ScanLine, Lightbulb, Wrench, Cable, TriangleAlert } from "lucide-react";
import { AppShell } from "../components/layout/AppShell.jsx";
import { Card, CardHeader } from "../components/ui/Card.jsx";

const FAQ = [
  {
    icon: ScanLine,
    q: "La banda no arranca al presionar 'Iniciar'",
    a: "Revisa el indicador de conexion serial en el panel de control. Si aparece 'Sin conexion serial', usa 'Reiniciar conexion con Arduino' antes de reintentar.",
  },
  {
    icon: Lightbulb,
    q: "La luz no enciende automaticamente",
    a: "El rele se activa al iniciar el sistema por firmware del Arduino. Si no enciende, usa el override manual en el panel de control y revisa el cableado del rele.",
  },
  {
    icon: Wrench,
    q: "Quiero probar el servo de rechazo sin pasar una pieza",
    a: "Usa el boton 'Probar servo' en el panel de control manual, dentro de Resumen en vivo. Activa el servo una vez, sin afectar los contadores de piezas.",
  },
  {
    icon: Cable,
    q: "Como cambio el puerto serial o el baudrate",
    a: "Ve a Configuracion > Conexion serial. Los cambios se envian al backend y se aplican en la siguiente reconexion con el Arduino.",
  },
];

export default function HelpPage() {
  return (
    <AppShell title="Ayuda" subtitle="Preguntas frecuentes sobre la operacion del sistema">
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
            El boton "Detener banda" corta el PWM del L298N por software. Para mantenimiento fisico
            de la banda, el servo o el rele, usa siempre el paro de emergencia fisico del panel
            electrico ademas del control desde este dashboard.
          </p>
        </div>
      </Card>
    </AppShell>
  );
}
