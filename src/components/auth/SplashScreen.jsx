import { ScanEye } from "lucide-react";

// Se muestra brevemente mientras se valida el token guardado contra el
// backend, antes de decidir si el dashboard o /login es lo que corresponde.
export function SplashScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-canvas">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500 text-white animate-pulse-soft">
        <ScanEye size={20} strokeWidth={2} />
      </div>
      <p className="text-xs text-ink-faint">Verificando sesión...</p>
    </div>
  );
}
