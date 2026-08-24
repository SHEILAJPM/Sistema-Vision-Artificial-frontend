import { Route, Routes } from "react-router-dom";
import OverviewPage from "./pages/OverviewPage.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";
import RejectedPage from "./pages/RejectedPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import HelpPage from "./pages/HelpPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<OverviewPage />} />
      <Route path="/historial" element={<HistoryPage />} />
      <Route path="/rechazadas" element={<RejectedPage />} />
      <Route path="/configuracion" element={<SettingsPage />} />
      <Route path="/ayuda" element={<HelpPage />} />
    </Routes>
  );
}
