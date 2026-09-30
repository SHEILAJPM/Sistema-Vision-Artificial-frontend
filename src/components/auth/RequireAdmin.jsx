import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider.jsx";

// Layout route: como RequireAuth, pero además exige rol Admin (ej. /usuarios).
// Un Operador que entre directo por URL vuelve al resumen en vivo.
export function RequireAdmin() {
  const { user } = useAuth();

  if (user?.role !== "Admin") {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
