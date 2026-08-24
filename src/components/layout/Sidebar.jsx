import { NavLink } from "react-router-dom";
import { LayoutGrid, History, PackageX, SlidersHorizontal, CircleHelp, ScanEye } from "lucide-react";
import { useSystem } from "../../context/SystemProvider.jsx";
import { StatDot } from "../ui/StatDot.jsx";

const NAV_ITEMS = [
  { to: "/", label: "Resumen en vivo", icon: LayoutGrid, end: true },
  { to: "/historial", label: "Historial de inspecciones", icon: History },
  { to: "/rechazadas", label: "Piezas rechazadas", icon: PackageX },
  { to: "/configuracion", label: "Configuracion", icon: SlidersHorizontal },
  { to: "/ayuda", label: "Ayuda", icon: CircleHelp },
];

// Escritorio (lg+): rail completo con etiquetas. Tablet (sm-lg): rail de solo
// iconos para no robar ancho al contenido. Telefonos (<sm): oculto -- el uso
// principal de este panel es de escritorio, segun el requisito de diseno.
export function Sidebar() {
  const { connectionOk } = useSystem();

  return (
    <aside className="hidden sm:flex w-16 lg:w-64 shrink-0 flex-col border-r border-line bg-panel px-2 lg:px-4 py-6 transition-[width] duration-150">
      <div className="flex items-center gap-2.5 px-1 lg:px-2 mb-8 justify-center lg:justify-start">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white">
          <ScanEye size={18} strokeWidth={2} />
        </div>
        <div className="hidden lg:block">
          <p className="text-sm font-semibold text-ink leading-tight">InspectaLine</p>
          <p className="text-[11px] text-ink-faint leading-tight">Vision artificial</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={label}
            className={({ isActive }) =>
              `focus-ring flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150 justify-center lg:justify-start ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-ink-soft hover:bg-panel-alt hover:text-ink"
              }`
            }
          >
            <Icon size={17} strokeWidth={2} className="shrink-0" />
            <span className="hidden lg:inline">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 flex justify-center rounded-xl border border-line bg-canvas px-3 py-3 lg:justify-start">
        <StatDot
          tone={connectionOk ? "ok" : "rejected"}
          pulse={connectionOk}
          label={<span className="hidden lg:inline">{connectionOk ? "Backend conectado" : "Backend sin respuesta"}</span>}
        />
      </div>
    </aside>
  );
}
