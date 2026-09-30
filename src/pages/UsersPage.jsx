import { AppShell } from "../components/layout/AppShell.jsx";
import { UsersPanel } from "../components/users/UsersPanel.jsx";

export default function UsersPage() {
  return (
    <AppShell title="Usuarios" subtitle="Cuentas de acceso al dashboard y sus roles">
      <UsersPanel />
    </AppShell>
  );
}
