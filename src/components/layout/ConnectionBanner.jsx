import { TriangleAlert } from "lucide-react";
import { useSystem } from "../../context/SystemProvider.jsx";

// Banner de advertencia, visible pero sin colores alarmantes: usa el coral
// suave de la paleta, nunca rojo saturado ni brillos.
export function ConnectionBanner() {
  const { connectionOk, status, lastError } = useSystem();

  const arduinoDown = status?.arduino === "disconnected";
  const backendDown = !connectionOk;

  if (!arduinoDown && !backendDown) return null;

  const message = backendDown
    ? "Sin conexión con el backend. Verifica que el servidor esté activo y reintenta."
    : "Arduino desconectado. La banda, la luz y el servo no responderan a comandos.";

  return (
    <div className="flex items-center gap-3 border-b border-coral-100 bg-coral-50 px-6 py-2.5">
      <TriangleAlert size={16} className="text-coral-600 shrink-0" strokeWidth={2} />
      <p className="text-sm text-coral-600">
        {message}
        {lastError && <span className="text-coral-500 opacity-70"> ({lastError})</span>}
      </p>
    </div>
  );
}
