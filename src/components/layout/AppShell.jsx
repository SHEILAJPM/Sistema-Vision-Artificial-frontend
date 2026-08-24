import { motion } from "motion/react";
import { Sidebar } from "./Sidebar.jsx";
import { ConnectionBanner } from "./ConnectionBanner.jsx";

export function AppShell({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <ConnectionBanner />
        <motion.header
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="px-6 md:px-8 pt-7 pb-2"
        >
          <h1 className="text-xl font-semibold text-ink tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-ink-faint mt-1">{subtitle}</p>}
        </motion.header>
        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
          className="flex-1 px-6 md:px-8 py-6 space-y-6"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
