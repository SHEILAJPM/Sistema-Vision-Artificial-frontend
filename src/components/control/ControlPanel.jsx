import { useState } from "react";
import { Play, Square, Lightbulb, LightbulbOff, Wrench, Plug, RefreshCw } from "lucide-react";
import { Card, CardHeader } from "../ui/Card.jsx";
import { Button } from "../ui/Button.jsx";
import { StatDot } from "../ui/StatDot.jsx";
import { useSystem } from "../../context/SystemProvider.jsx";

export function ControlPanel() {
  const { status, sendCommand } = useSystem();
  // Set (no un solo string) porque los botones son acciones independientes:
  // un comando en vuelo no debe afectar el estado "disabled" de los demás.
  const [pending, setPending] = useState(() => new Set());

  const bandaRunning = status?.banda === "running";
  const luzOn = status?.luz === "on";
  const arduinoConnected = status?.arduino === "connected";

  const run = async (command) => {
    setPending((prev) => new Set(prev).add(command));
    await sendCommand(command);
    setPending((prev) => {
      const next = new Set(prev);
      next.delete(command);
      return next;
    });
  };

  return (
    <Card>
      <CardHeader
        title="Control manual"
        subtitle="Override directo del Arduino, para pruebas y mantenimiento"
        action={
          <div className="flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5">
            <Plug size={13} className={arduinoConnected ? "text-teal-600" : "text-coral-500"} strokeWidth={2} />
            <StatDot tone={arduinoConnected ? "ok" : "rejected"} pulse={arduinoConnected} />
            <span className="text-xs text-ink-soft">
              {arduinoConnected ? `Conectado · ${status?.serialPort ?? "--"}` : "Sin conexión serial"}
            </span>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Button
          variant={bandaRunning ? "danger" : "primary"}
          icon={bandaRunning ? Square : Play}
          disabled={pending.has("START") || pending.has("STOP")}
          onClick={() => run(bandaRunning ? "STOP" : "START")}
        >
          {bandaRunning ? "Detener banda" : "Iniciar banda"}
        </Button>

        <Button
          variant="soft"
          icon={luzOn ? LightbulbOff : Lightbulb}
          disabled={pending.has("LIGHT_ON") || pending.has("LIGHT_OFF")}
          onClick={() => run(luzOn ? "LIGHT_OFF" : "LIGHT_ON")}
        >
          {luzOn ? "Apagar luz" : "Encender luz"}
        </Button>

        <Button
          variant="soft"
          icon={Wrench}
          disabled={pending.has("TEST_SERVO")}
          onClick={() => run("TEST_SERVO")}
        >
          Probar servo
        </Button>

        <Button
          variant="outline"
          icon={RefreshCw}
          className="col-span-2 md:col-span-3"
          disabled={pending.has("RECONNECT_ARDUINO")}
          onClick={() => run("RECONNECT_ARDUINO")}
        >
          Reiniciar conexión con Arduino
        </Button>
      </div>
    </Card>
  );
}
