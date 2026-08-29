import PropTypes from "prop-types";
import { motion } from "motion/react";
import { Sidebar } from "./Sidebar.jsx";
import { MobileNav } from "./MobileNav.jsx";
import { ConnectionBanner } from "./ConnectionBanner.jsx";

// `badge` y `headerRight` son opcionales: sólo Resumen en vivo los usa (chip
// "EN VIVO" + reloj de última actualización) -- el resto de las páginas sigue
// con el header simple de siempre, sin layout roto por props ausentes.
export function AppShell({ title, subtitle, badge, headerRight, children }) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <ConnectionBanner />
        {/* Ancho maximo (antes ausente): sin esto, en un monitor ancho las
            tablas y tarjetas se estiraban borde a borde sin límite --
            hallazgo real de /redesign-existing-projects. 1600px, no el
            1200-1440 tipico de una landing, porque acá el contenido son
            tablas/gráficos que aprovechan mas ancho que prosa. La entrada
            con motion (aporte de Sheila) corre encima de esa estructura sin
            pisarla -- un fade+slide sutil al cambiar de pantalla. */}
        <motion.header
          key={`${title}-header`}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="border-b border-line/70"
        >
          <div className="max-w-[1600px] mx-auto px-6 md:px-8 pt-7 pb-5 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-semibold text-ink tracking-tight">{title}</h1>
                {badge}
              </div>
              {subtitle && <p className="text-sm text-ink-faint mt-1">{subtitle}</p>}
            </div>
            {headerRight}
          </div>
        </motion.header>
        {/* pb extra en mobile: espacio para que MobileNav (fija, abajo) no tape
            el final del contenido -- en sm+ no hace falta, ahí navega Sidebar. */}
        <motion.main
          key={`${title}-main`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
          className="flex-1 px-6 md:px-8 py-6 pb-24 sm:pb-6"
        >
          <div className="max-w-[1600px] mx-auto space-y-6">{children}</div>
        </motion.main>
      </div>
      <MobileNav />
    </div>
  );
}

AppShell.propTypes = {
  title: PropTypes.node.isRequired,
  subtitle: PropTypes.node,
  badge: PropTypes.node,
  headerRight: PropTypes.node,
  children: PropTypes.node,
};
