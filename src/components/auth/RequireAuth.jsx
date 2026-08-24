import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider.jsx";

// Layout route: si no hay sesión, redirige a /login recordando a dónde iba
// el usuario para volver ahí después de iniciar sesión.
export function RequireAuth() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}
