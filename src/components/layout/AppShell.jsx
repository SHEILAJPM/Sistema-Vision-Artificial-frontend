import { Sidebar } from "./Sidebar.jsx";
import { ConnectionBanner } from "./ConnectionBanner.jsx";

export function AppShell({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <ConnectionBanner />
        <header className="px-6 md:px-8 pt-7 pb-2">
          <h1 className="text-xl font-semibold text-ink tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-ink-faint mt-1">{subtitle}</p>}
        </header>
        <main className="flex-1 px-6 md:px-8 py-6 space-y-6">{children}</main>
      </div>
    </div>
  );
}
