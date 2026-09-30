import { NavLink, useNavigate } from "react-router-dom";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import {
  LayoutGrid,
  History,
  PackageX,
  FileText,
  Cpu,
  ScanSearch,
  Images,
  GraduationCap,
  Users,
  SlidersHorizontal,
  CircleHelp,
  Leaf,
  LogOut,
} from "lucide-react";
import { useSystem } from "../../context/SystemProvider.jsx";
import { useAuth } from "../../context/AuthProvider.jsx";
import { StatDot } from "../ui/StatDot.jsx";

// El rail colapsa a solo-ícono en tablet (ver comentario del <aside> mas
// abajo): sin el label visible ahí, el tooltip deja de ser un lujo y pasa a
// ser necesario para saber a dónde lleva cada ícono.
function NavTooltip({ label, children }) {
  return (
    <OverlayTrigger placement="right" delay={{ show: 300, hide: 0 }} overlay={<Tooltip>{label}</Tooltip>}>
      {children}
    </OverlayTrigger>
  );
}

// Exportado: MobileNav.jsx reusa la misma lista para la barra inferior de
// <640px, en vez de mantener dos fuentes de verdad para las rutas del panel.
// `short` es la etiqueta que entra en esa barra (espacio de sobra en el rail
// de escritorio para el label completo, no en una barra de 6 columnas).
// `adminOnly` (aporte de Sheila): Usuarios solo se lista para el rol Admin,
// filtrado mas abajo -- RequireAdmin ya protege la ruta, esto evita mostrar
// un link a una pantalla que igual va a redirigir.
export const NAV_ITEMS = [
  { to: "/", label: "Resumen en vivo", short: "Resumen", icon: LayoutGrid, end: true },
  { to: "/historial", label: "Historial de inspecciones", short: "Historial", icon: History },
  { to: "/rechazadas", label: "Limones rechazados", short: "Rechazados", icon: PackageX },
  { to: "/reportes", label: "Reportes", short: "Reportes", icon: FileText },
  { to: "/modelos-ia", label: "Modelos de IA", short: "Modelos", icon: Cpu },
  { to: "/inspeccion-manual", label: "Inspección Manual", short: "Inspección", icon: ScanSearch },
  { to: "/dataset", label: "Dataset", short: "Dataset", icon: Images, adminOnly: true },
  { to: "/entrenamiento", label: "Entrenamiento", short: "Entrenar", icon: GraduationCap, adminOnly: true },
  { to: "/usuarios", label: "Usuarios", short: "Usuarios", icon: Users, adminOnly: true },
  { to: "/configuracion", label: "Configuración", short: "Config.", icon: SlidersHorizontal },
  { to: "/ayuda", label: "Ayuda", short: "Ayuda", icon: CircleHelp },
];

function initialsOf(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

// Escritorio (lg+): rail completo con etiquetas. Tablet (sm-lg): rail de solo
// iconos para no robar ancho al contenido. Teléfonos (<sm): oculto -- ese
// tamaño lo cubre MobileNav.jsx (barra inferior), no este rail lateral.
export function Sidebar() {
  const { connectionOk } = useSystem();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="hidden sm:flex w-16 lg:w-64 shrink-0 flex-col border-r border-line bg-panel px-2 lg:px-4 py-6 transition-[width] duration-150">
      <div className="flex items-center gap-2.5 px-1 lg:px-2 mb-8 justify-center lg:justify-start">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-500 text-white">
          <Leaf size={18} strokeWidth={2} />
        </div>
        <div className="hidden lg:block">
          <p className="text-sm font-semibold text-ink leading-tight">InspectaLine</p>
          <p className="text-[11px] text-ink-faint leading-tight">Calidad de limones</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === "Admin").map(({ to, label, icon: Icon, end }) => (
          <NavTooltip key={to} label={label}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `focus-ring flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150 justify-center lg:justify-start ${
                  isActive
                    ? "bg-green-50 text-green-700 font-medium"
                    : "text-ink-soft hover:bg-panel-alt hover:text-ink"
                }`
              }
            >
              <Icon size={17} strokeWidth={2} className="shrink-0" />
              <span className="hidden lg:inline">{label}</span>
            </NavLink>
          </NavTooltip>
        ))}
      </nav>

      <div className="mt-3 flex justify-center rounded-xl border border-line bg-canvas px-3 py-3 lg:justify-start">
        <StatDot
          tone={connectionOk ? "ok" : "rejected"}
          pulse={connectionOk}
          label={<span className="hidden lg:inline">{connectionOk ? "Backend conectado" : "Backend sin respuesta"}</span>}
        />
      </div>

      <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-line bg-canvas px-3 py-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-beige-100 text-xs font-semibold text-beige-600">
          {initialsOf(user?.name)}
        </div>
        <div className="hidden lg:block min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-ink">{user?.name ?? "Usuario"}</p>
          <p className="truncate text-[11px] text-ink-faint">{user?.role ?? "Operador"}</p>
        </div>
        <OverlayTrigger placement="top" overlay={<Tooltip>Cerrar sesión</Tooltip>}>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            className="focus-ring shrink-0 rounded-lg p-1.5 text-ink-faint transition-transform duration-150 active:scale-[0.9] hover:bg-panel-alt hover:text-terracotta-500"
          >
            <LogOut size={15} strokeWidth={2} />
          </button>
        </OverlayTrigger>
      </div>
    </aside>
  );
}
