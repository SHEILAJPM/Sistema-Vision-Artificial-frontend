import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthProvider.jsx";
import { SystemProvider } from "./context/SystemProvider.jsx";
import { RequireAuth } from "./components/auth/RequireAuth.jsx";
import { SplashScreen } from "./components/auth/SplashScreen.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import OverviewPage from "./pages/OverviewPage.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";
import RejectedPage from "./pages/RejectedPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import HelpPage from "./pages/HelpPage.jsx";

// El estado en vivo (SystemProvider) solo tiene sentido una vez autenticado,
// asi que se monta como layout route dentro del arbol protegido en vez de
// envolver toda la app: /login nunca abre WS ni pide /api/status.
function SystemLayout() {
  return (
    <SystemProvider>
      <Outlet />
    </SystemProvider>
  );
}

export default function App() {
  const { authChecked, isAuthenticated } = useAuth();

  if (!authChecked) return <SplashScreen />;

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<SystemLayout />}>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/historial" element={<HistoryPage />} />
          <Route path="/rechazadas" element={<RejectedPage />} />
          <Route path="/configuracion" element={<SettingsPage />} />
          <Route path="/ayuda" element={<HelpPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
