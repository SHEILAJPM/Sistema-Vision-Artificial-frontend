import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, ScanEye, TriangleAlert, LogIn } from "lucide-react";
import { Button } from "../components/ui/Button.jsx";
import { useAuth } from "../context/AuthProvider.jsx";
import { USE_MOCK_DATA } from "../lib/api.js";
import harvestPhoto from "../assets/cosecha-limones-piura.jpg";

const inputClass =
  "focus-ring w-full rounded-lg border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await login(username, password);
    setSubmitting(false);
    if (res.ok) navigate(redirectTo, { replace: true });
    else setError(res.error);
  };

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Panel de marca -- solo en pantallas medianas en adelante. La foto
          fuente es de solo 800x450: se muestra en una tarjeta contenida, no
          como fondo a pantalla completa, para no estirarla y que se pixele. */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-gradient-to-b from-blue-600 to-blue-700 px-14 py-12">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-blue-600">
            <ScanEye size={18} strokeWidth={2} />
          </div>
          <p className="text-sm font-semibold text-white">InspectaLine</p>
        </div>

        <div className="max-w-sm">
          <p className="text-2xl font-semibold text-white leading-snug">
            Monitoreo y control de la linea de inspeccion visual.
          </p>
          <p className="text-sm text-blue-50/90 mt-3 leading-relaxed">
            Banda transportadora, iluminacion, servo de rechazo y deteccion de defectos
            con YOLOv8, en un solo panel — de la cosecha en Piura a la linea de empaque.
          </p>

          <div className="mt-7 max-w-[380px] overflow-hidden rounded-2xl border border-white/15 shadow-card-hover">
            <img src={harvestPhoto} alt="Cosecha de limon en Piura" className="block h-auto w-full" />
          </div>
          <p className="mt-2.5 text-xs text-blue-50/60">Cosecha de limon, Piura — Peru</p>
        </div>

        <p className="text-xs text-blue-50/70">Acceso restringido a personal autorizado de planta</p>
      </div>

      {/* Formulario */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center lg:items-start">
            <div className="flex lg:hidden h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white mb-4">
              <ScanEye size={20} strokeWidth={2} />
            </div>
            <h1 className="text-xl font-semibold text-ink">Iniciar sesion</h1>
            <p className="text-sm text-ink-faint mt-1 text-center lg:text-left">
              Ingresa tus credenciales para acceder al panel
            </p>
          </div>

          {USE_MOCK_DATA && (
            <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50 px-3.5 py-2.5 text-xs text-blue-700">
              Modo demo: cualquier usuario y contrasena funcionan.
            </div>
          )}

          {error && (
            <div className="mb-5 flex items-center gap-2 rounded-lg border border-coral-100 bg-coral-50 px-3.5 py-2.5 text-xs text-coral-600">
              <TriangleAlert size={14} strokeWidth={2} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="mb-1.5 block text-xs font-medium text-ink-soft">
                Usuario
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="operador.linea1"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-ink-soft">
                Contrasena
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="focus-ring absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-soft"
                  aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                >
                  {showPassword ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
                </button>
              </div>
            </div>

            <Button type="submit" variant="primary" icon={LogIn} disabled={submitting} className="w-full">
              {submitting ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
