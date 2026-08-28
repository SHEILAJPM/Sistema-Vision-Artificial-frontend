import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "./Sidebar.jsx";

// Contraparte del rail para telefonos (<640px): Sidebar se oculta del todo
// ahí (ver su comentario), así que sin esto un operador que abre el panel
// desde el celular quedaba sin forma de cambiar de página, solo podía ver
// Resumen en vivo. Barra fija inferior, solo-ícono + etiqueta chica -- no un
// hamburger/drawer genérico, para no meter un patrón que no existe en el
// resto del panel. Etiqueta siempre visible (no depende de hover/tooltip
// como el rail de tablet) porque en touch no hay hover.
export function MobileNav() {
  return (
    <nav
      className="sm:hidden fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-between border-t border-line bg-panel px-1 pt-1.5 shadow-card-hover"
      style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }}
    >
      {NAV_ITEMS.map(({ to, label, short, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          aria-label={label}
          className={({ isActive }) =>
            `focus-ring flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] font-medium leading-none transition-colors duration-150 ${
              isActive ? "text-green-700" : "text-ink-faint hover:text-ink-soft"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${isActive ? "bg-green-50" : ""}`}>
                <Icon size={17} strokeWidth={2} />
              </span>
              <span className="truncate px-0.5">{short}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
