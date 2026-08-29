import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthProvider.jsx";
import { SystemProvider } from "./context/SystemProvider.jsx";
import { RequireAuth } from "./components/auth/RequireAuth.jsx";
import { RequireAdmin } from "./components/auth/RequireAdmin.jsx";
import { SplashScreen } from "./components/auth/SplashScreen.jsx";
import LoginPage from "./pages/LoginPage.jsx";

// Paginas protegidas: se cargan bajo demanda (una sola se ve a la vez) en
// vez de entrar todas al bundle inicial -- Reportes y Resumen ya arrastran
// recharts, que no hace falta antes del primer login.
const OverviewPage = lazy(() => import("./pages/OverviewPage.jsx"));
const HistoryPage = lazy(() => import("./pages/HistoryPage.jsx"));
const RejectedPage = lazy(() => import("./pages/RejectedPage.jsx"));
const ReportsPage = lazy(() => import("./pages/ReportsPage.jsx"));
const ModelsPage = lazy(() => import("./pages/ModelsPage.jsx"));
const ManualInspectionPage = lazy(() => import("./pages/ManualInspectionPage.jsx"));
const DatasetPage = lazy(() => import("./pages/DatasetPage.jsx"));
const AnnotatePage = lazy(() => import("./pages/AnnotatePage.jsx"));
const TrainingPage = lazy(() => import("./pages/TrainingPage.jsx"));
const UsersPage = lazy(() => import("./pages/UsersPage.jsx"));
const SettingsPage = lazy(() => import("./pages/SettingsPage.jsx"));
const HelpPage = lazy(() => import("./pages/HelpPage.jsx"));

// El estado en vivo (SystemProvider) solo tiene sentido una vez autenticado,
// así que se monta como layout route dentro del árbol protegido en vez de
// envolver toda la app: /login nunca abre WS ni pide /api/status.
function SystemLayout() {
  return (
    <SystemProvider>
      <Suspense fallback={<SplashScreen />}>
        <Outlet />
      </Suspense>
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
          <Route path="/reportes" element={<ReportsPage />} />
          <Route path="/modelos-ia" element={<ModelsPage />} />
          <Route path="/inspeccion-manual" element={<ManualInspectionPage />} />
          <Route element={<RequireAdmin />}>
            <Route path="/dataset" element={<DatasetPage />} />
            <Route path="/dataset/:imageId/anotar" element={<AnnotatePage />} />
            <Route path="/entrenamiento" element={<TrainingPage />} />
            <Route path="/usuarios" element={<UsersPage />} />
          </Route>
          <Route path="/configuracion" element={<SettingsPage />} />
          <Route path="/ayuda" element={<HelpPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
