import { useState } from "react";
import { Spinner } from "react-bootstrap";
import { Play, Square, Lightbulb, LightbulbOff, Wrench, Plug, RefreshCw, TriangleAlert } from "lucide-react";
import { CardHeader } from "../ui/Card.jsx";
import { StatDot } from "../ui/StatDot.jsx";
import { useSystem } from "../../context/SystemProvider.jsx";

// El Spinner de Bootstrap hereda currentColor, así que se ve del tono del
// texto de cada tile sin pedirle ningún color a mano -- coherente con la
// paleta sin tocar nada de ella.
function TileSpinner() {
  return <Spinner animation="border" size="sm" role="status" aria-hidden="true" />;
}

const TILE_TONE = {
  danger: "bg-terracotta-50 text-terracotta-600 group-hover:bg-terracotta-100",
  primary: "bg-green-50 text-green-600 group-hover:bg-green-100",
  neutral: "bg-panel-alt text-ink-soft group-hover:bg-line",
};

// Tiles grandes con ícono en círculo en vez de botones de formulario chicos:
// se siente más a "panel de control físico" (Arduino, banda, servo) que a un
// formulario web genérico, y deja el estado pendiente bien visible.
//
// `blocked` es distinto de `pending`: antes el tile solo se deshabilitaba
// mientras el comando estaba en vuelo, así que con el Arduino desconectado
// se podia tocar "Probar servo" una y otra vez y cada intento hacia un
// round-trip completo solo para mostrar el mismo error (hallazgo P2 de
// /impeccable critique). cursor-not-allowed en vez de cursor-wait cuando
// esta bloqueado y no pendiente, para no sugerir que algo esta en curso.
function ControlTile({ icon: Icon, label, pendingLabel, blockedLabel, pending, blocked, tone = "neutral", onClick, wide }) {
  const disabled = pending || blocked;
  return (
    <button
      type="button"
      disabled={disabled}
      aria-busy={pending}
      aria-disabled={disabled}
      onClick={onClick}
      className={`focus-ring group flex items-center gap-3 rounded-xl border border-line bg-panel px-4 py-3.5 text-left transition-[background-color,border-color,color,transform] duration-150 hover:border-line-strong hover:-translate-y-px active:translate-y-0 active:scale-[0.97] disabled:opacity-60 disabled:hover:translate-y-0 ${
        pending ? "disabled:cursor-wait" : "disabled:cursor-not-allowed"
      } ${wide ? "col-span-2 md:col-span-3" : "flex-col text-center items-center"}`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-150 ${TILE_TONE[tone]}`}>
        {pending ? <TileSpinner /> : <Icon size={18} strokeWidth={2} />}
      </span>
      <span className="text-xs font-medium text-ink">
        {pending ? pendingLabel : blocked ? blockedLabel : label}
      </span>
    </button>
  );
}

export function ControlPanel() {
  const { status, sendCommand } = useSystem();
  // Set (no un solo string, aporte de Sheila): los tiles son acciones
  // independientes, un comando en vuelo no debe afectar el estado
  // "disabled" de los demás -- con un solo string, tocar "Probar servo"
  // mientras "Iniciar banda" seguia en vuelo pisaba silenciosamente el
  // pending de banda.
  const [pending, setPending] = useState(() => new Set());
  // El banner de conexion (ConnectionBanner) solo cubre backend/Arduino
  // caidos. Si un comando falla por otro motivo, antes no se veia nada mas
  // que el spinner desapareciendo (hallazgo P1 de /impeccable critique).
  const [error, setError] = useState(null);

  const bandaRunning = status?.banda === "running";
  const luzOn = status?.luz === "on";
  const arduinoConnected = status?.arduino === "connected";

  const run = async (command) => {
    setPending((prev) => new Set(prev).add(command));
    const res = await sendCommand(command);
    setError(res.ok ? null : res.error ?? "El comando no se pudo ejecutar.");
    setPending((prev) => {
      const next = new Set(prev);
      next.delete(command);
      return next;
    });
  };

  return (
    <div className="control-metal rounded-2xl border border-line-strong/50 shadow-card-hover p-5">
      <div className="relative">
        <CardHeader
          title="Control manual"
          subtitle="Override directo del Arduino, para pruebas y mantenimiento"
          action={
            <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white/50 px-3 py-1.5 backdrop-blur-sm">
              <Plug size={13} className={arduinoConnected ? "text-teal-600" : "text-terracotta-500"} strokeWidth={2} />
              <StatDot tone={arduinoConnected ? "ok" : "rejected"} pulse={arduinoConnected} />
              <span className="text-xs text-ink-soft">
                {arduinoConnected ? `Conectado · ${status?.serialPort ?? "--"}` : "Sin conexión serial"}
              </span>
            </div>
          }
        />
      </div>

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="relative mb-4 flex items-center gap-2 rounded-lg border border-terracotta-100 bg-terracotta-50 px-3.5 py-2.5 text-xs text-terracotta-600"
        >
          <TriangleAlert size={14} strokeWidth={2} className="shrink-0" />
          {error}
        </div>
      )}

      <div className="relative grid grid-cols-2 md:grid-cols-3 gap-3">
        <ControlTile
          icon={bandaRunning ? Square : Play}
          label={bandaRunning ? "Detener banda" : "Iniciar banda"}
          pendingLabel={bandaRunning ? "Deteniendo..." : "Iniciando..."}
          blockedLabel="Sin conexión"
          pending={pending.has("START") || pending.has("STOP")}
          blocked={!arduinoConnected}
          tone={bandaRunning ? "danger" : "primary"}
          onClick={() => run(bandaRunning ? "STOP" : "START")}
        />

        <ControlTile
          icon={luzOn ? LightbulbOff : Lightbulb}
          label={luzOn ? "Apagar luz" : "Encender luz"}
          pendingLabel="Cambiando..."
          blockedLabel="Sin conexión"
          pending={pending.has("LIGHT_ON") || pending.has("LIGHT_OFF")}
          blocked={!arduinoConnected}
          tone="neutral"
          onClick={() => run(luzOn ? "LIGHT_OFF" : "LIGHT_ON")}
        />

        <ControlTile
          icon={Wrench}
          label="Probar servo"
          pendingLabel="Probando..."
          blockedLabel="Sin conexión"
          pending={pending.has("TEST_SERVO")}
          blocked={!arduinoConnected}
          tone="primary"
          onClick={() => run("TEST_SERVO")}
        />

        <ControlTile
          icon={RefreshCw}
          label="Reiniciar conexión con Arduino"
          pendingLabel="Reconectando..."
          pending={pending.has("RECONNECT_ARDUINO")}
          tone="neutral"
          wide
          onClick={() => run("RECONNECT_ARDUINO")}
        />
      </div>
    </div>
  );
}
