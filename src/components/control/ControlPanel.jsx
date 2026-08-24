import { useState } from "react";
import { Play, Square, Lightbulb, LightbulbOff, Wrench, Plug, RefreshCw } from "lucide-react";
import { Card, CardHeader } from "../ui/Card.jsx";
import { Button } from "../ui/Button.jsx";
import { StatDot } from "../ui/StatDot.jsx";
import { useSystem } from "../../context/SystemProvider.jsx";

export function ControlPanel() {
  const { status, sendCommand } = useSystem();
  const [pending, setPending] = useState(null);

  const bandaRunning = status?.banda === "running";
  const luzOn = status?.luz === "on";
  const arduinoConnected = status?.arduino === "connected";

  const run = async (command) => {
    setPending(command);
    await sendCommand(command);
    setPending(null);
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
              {arduinoConnected ? `Conectado · ${status?.serialPort ?? "--"}` : "Sin conexion serial"}
            </span>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Button
          variant={bandaRunning ? "danger" : "primary"}
          icon={bandaRunning ? Square : Play}
          disabled={pending === "START" || pending === "STOP"}
          onClick={() => run(bandaRunning ? "STOP" : "START")}
        >
          {bandaRunning ? "Detener banda" : "Iniciar banda"}
        </Button>

        <Button
          variant="soft"
          icon={luzOn ? LightbulbOff : Lightbulb}
          disabled={pending === "LIGHT_ON" || pending === "LIGHT_OFF"}
          onClick={() => run(luzOn ? "LIGHT_OFF" : "LIGHT_ON")}
        >
          {luzOn ? "Apagar luz" : "Encender luz"}
        </Button>

        <Button
          variant="soft"
          icon={Wrench}
          disabled={pending === "TEST_SERVO"}
          onClick={() => run("TEST_SERVO")}
        >
          Probar servo
        </Button>

        <Button
          variant="outline"
          icon={RefreshCw}
          className="col-span-2 md:col-span-3"
          disabled={pending === "RECONNECT_ARDUINO"}
          onClick={() => run("RECONNECT_ARDUINO")}
        >
          Reiniciar conexion con Arduino
        </Button>
      </div>
    </Card>
  );
}
