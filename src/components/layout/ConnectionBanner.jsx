import { AnimatePresence, motion } from "motion/react";
import { TriangleAlert } from "lucide-react";
import { useSystem } from "../../context/SystemProvider.jsx";

// Banner de advertencia, visible pero sin colores alarmantes: usa el coral
// suave de la paleta, nunca rojo saturado ni brillos.
export function ConnectionBanner() {
  const { connectionOk, status, lastError } = useSystem();

  const arduinoDown = status?.arduino === "disconnected";
  const backendDown = !connectionOk;
  const visible = arduinoDown || backendDown;

  const message = backendDown
    ? "Sin conexión con el backend. Verifica que el servidor esté activo y reintenta."
    : "Arduino desconectado. La banda, la luz y el servo no responderan a comandos.";

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex items-center gap-3 border-b border-coral-100 bg-coral-50 px-6 py-2.5"
        >
          <motion.span
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="shrink-0"
          >
            <TriangleAlert size={16} className="text-coral-600" strokeWidth={2} />
          </motion.span>
          <p className="text-sm text-coral-600">
            {message}
            {lastError && <span className="text-coral-500 opacity-70"> ({lastError})</span>}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
