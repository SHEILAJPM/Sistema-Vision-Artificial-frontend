import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Fade, Spinner, OverlayTrigger, Tooltip } from "react-bootstrap";
import { Eye, EyeOff, TriangleAlert, ArrowRight, User, Lock, Info, HelpCircle } from "lucide-react";
import { useAuth } from "../context/AuthProvider.jsx";
import { USE_MOCK_DATA } from "../lib/api.js";
import lemonHeroPhoto from "../assets/limon-macro-hero.jpg";

// EXCEPCIÓN DE DISEÑO DELIBERADA -- confirmada con el usuario. Esta pantalla
// no sigue la paleta/tipografía/radios de DESIGN.md (beige cálido, verde/
// terracota, esquinas redondeadas generosas, Hanken Grotesk): corre su
// propio lenguaje "Contraste Editorial" -- navy sólido + blanco/negro puro,
// bordes a 1px, radio 0, sin sombras, tipografía Inter/Roboto Mono cargadas
// aparte en index.html. No uses este archivo como referencia para ningún
// otro componente del panel; el resto de la app sigue el sistema de
// DESIGN.md sin cambios.
const inputClass =
  "w-full border border-[#111827] bg-transparent pl-11 pr-4 py-3 text-sm text-[#0F172A] placeholder:text-[#9CA3AF] outline-none transition-colors duration-100 focus:border-black";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  // No hay endpoint de recuperación en el backend (solo postLogin/getMe/
  // postLogout, ver src/lib/api.js) -- un link "Olvidé mi contraseña" que
  // navegara a algo real no existe todavía. En vez de fingir un flujo de
  // self-service que no está, esto revela una instrucción honesta al hacer
  // click: a quién contactar. Nunca un href="#" muerto.
  const [showRecoveryHint, setShowRecoveryHint] = useState(false);

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
    <div className="flex min-h-screen" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Columna de marca -- 50/50 exacto en lg+. Antes: fondo navy sólido +
          la foto encajonada en una tarjeta chica adentro de la columna de
          texto (el patrón menos "premium" posible según la guía de dirección
          de arte de /imagegen-frontend-web: "Background Mode: full-bleed
          image... not a small inset thumbnail"). Ahora la foto es el fondo
          completo del panel, con el texto superpuesto en zonas seguras
          (logo arriba, mensaje al medio, footer abajo) -- Composition Anchor
          "image-as-canvas". Sin herramienta de generación de imágenes en este
          entorno, así que sigue siendo una foto real (Pexels #37540984,
          licencia libre) en vez de un render de IA, pero con la misma lógica
          de encuadre que pide esa skill. */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between overflow-hidden bg-[#0F172A] px-14 py-14">
        <img
          src={lemonHeroPhoto}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: "grayscale(0.45) contrast(1.05) brightness(0.85)" }}
        />
        {/* Duotone: mismo truco que antes (mix-blend-mode: color tiñe la foto
            de navy sin perder su textura/luz original). */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: "#0F172A", mixBlendMode: "color" }}
        />
        {/* Scrim mas fuerte que la version anterior a proposito: ahi el texto
            solo vivia en el 40% inferior de una tarjeta chica; aca cubre todo
            el panel (logo arriba, mensaje al medio, footer abajo), asi que
            necesita contraste parejo de punta a punta, no solo un degrade
            hacia abajo. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(6,10,20,0.86) 0%, rgba(6,10,20,0.62) 42%, rgba(6,10,20,0.82) 100%)" }}
        />

        <div className="relative flex items-center gap-3">
          <span className="h-2.5 w-2.5 bg-white" />
          <p className="text-sm font-semibold tracking-[0.08em] text-white uppercase">InspectaLine</p>
        </div>

        <div className="relative max-w-md">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#94A3B8]">
            Sistema de inspección visual
          </p>
          <h1 className="text-[2.75rem] leading-[1.05] font-semibold text-white tracking-tight mt-3">
            Control total de la línea de inspección.
          </h1>
          <p className="text-sm text-[#CBD5E1] mt-4 leading-relaxed">
            Banda transportadora, iluminación, servo de rechazo y detección de
            defectos con YOLOv8 — de la cosecha en Piura a la línea de empaque.
          </p>
        </div>

        <div className="relative flex items-end justify-between gap-4">
          <p className="text-xs text-[#94A3B8]">Acceso restringido a personal autorizado de planta</p>
          <p
            className="shrink-0 text-[10px] uppercase tracking-[0.12em] text-white/60"
            style={{ fontFamily: "'Roboto Mono', ui-monospace, monospace" }}
          >
            PIURA · PE — LOTE 04
          </p>
        </div>
      </div>

      {/* Columna de login -- blanco puro, máximo contraste con la izquierda. */}
      <div className="flex flex-1 lg:w-1/2 items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <span className="h-2.5 w-2.5 bg-black" />
            <p className="text-sm font-semibold tracking-[0.08em] text-black uppercase">InspectaLine</p>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-black tracking-tight">Iniciar sesión</h2>
            <p className="text-sm text-[#4B5563] mt-2">Ingresa tus credenciales para acceder al panel</p>
          </div>

          {USE_MOCK_DATA && (
            <Fade in appear>
              <div className="mt-7 flex items-start gap-2.5 border-l-2 border-[#0F172A] bg-[#F8FAFC] px-4 py-3 text-xs text-[#0F172A]">
                <Info size={14} strokeWidth={2} className="shrink-0 mt-px" />
                Modo demo: cualquier usuario y contraseña funcionan.
              </div>
            </Fade>
          )}

          <Fade in={!!error} unmountOnExit>
            <div className="mt-7 flex items-start gap-2.5 border-l-2 border-[#B91C1C] bg-[#FEF2F2] px-4 py-3 text-xs text-[#B91C1C]">
              <TriangleAlert size={14} strokeWidth={2} className="shrink-0 mt-px" />
              {error}
            </div>
          </Fade>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="username" className="mb-1.5 block text-xs font-medium uppercase tracking-[0.06em] text-black">
                Usuario
              </label>
              <div className="relative">
                <User size={15} strokeWidth={2} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]" />
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
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label htmlFor="password" className="block text-xs font-medium uppercase tracking-[0.06em] text-black">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => setShowRecoveryHint((v) => !v)}
                  className="text-xs text-[#6B7280] underline decoration-[#D1D5DB] underline-offset-2 transition-colors duration-100 hover:text-black"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <Lock size={15} strokeWidth={2} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  className={`${inputClass} pr-11`}
                />
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>{showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}</Tooltip>}
                >
                  {/* Área de toque real ~40px (icono 16px + p-2.5), no solo el
                      glifo -- el botón anterior tenía ~16px de hit target,
                      bien debajo del mínimo de 44px recomendado para mobile. */}
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-2.5 text-[#6B7280] transition-colors duration-100 hover:text-black"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
                  </button>
                </OverlayTrigger>
              </div>
              <Fade in={showRecoveryHint} unmountOnExit>
                <div className="mt-2.5 flex items-start gap-2 border-l-2 border-[#0F172A] bg-[#F8FAFC] px-3.5 py-2.5 text-xs text-[#374151]">
                  <HelpCircle size={13} strokeWidth={2} className="shrink-0 mt-px text-[#6B7280]" />
                  Contactá al administrador del sistema en planta para restablecer tu contraseña.
                </div>
              </Fade>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-3 flex w-full items-center justify-center gap-2 bg-black py-3.5 text-sm font-semibold text-white transition-colors duration-100 hover:bg-[#1F2937] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Spinner animation="border" size="sm" role="status" aria-hidden="true" />
                  Ingresando...
                </>
              ) : (
                <>
                  Ingresar
                  <ArrowRight size={16} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-xs text-[#6B7280] lg:hidden">
            Acceso restringido a personal autorizado de planta · Piura, Perú
          </p>
        </div>
      </div>
    </div>
  );
}
