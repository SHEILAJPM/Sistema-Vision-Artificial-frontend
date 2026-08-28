import { Fade } from "react-bootstrap";
import { TriangleAlert } from "lucide-react";
import { useSystem } from "../../context/SystemProvider.jsx";

// Banner de advertencia, visible pero sin colores alarmantes: usa el coral
// suave de la paleta, nunca rojo saturado ni brillos. El Fade de Bootstrap le
// da una entrada/salida suave en vez de aparecer/desaparecer de golpe --
// justo el tipo de conexión/desconexión que un operador necesita notar.
export function ConnectionBanner() {
  const { connectionOk, status, lastError } = useSystem();

  const arduinoDown = status?.arduino === "disconnected";
  const backendDown = !connectionOk;
  const visible = arduinoDown || backendDown;

  const message = backendDown
    ? "Sin conexión con el backend. Verifica que el servidor esté activo y reintenta."
    : "Arduino desconectado. La banda, la luz y el servo no responderan a comandos.";

  return (
    <Fade in={visible} unmountOnExit>
      <div className="flex items-center gap-3 border-b border-terracotta-100 bg-terracotta-50 px-6 py-2.5">
        <TriangleAlert size={16} className="text-terracotta-600 shrink-0" strokeWidth={2} />
        <p className="text-sm text-terracotta-600">
          {message}
          {lastError && <span className="text-terracotta-500 opacity-70"> ({lastError})</span>}
        </p>
      </div>
    </Fade>
  );
}
