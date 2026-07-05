import { HashRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./components/layout/sidebar";
import { ROUTE_BY_LABEL, labelForPath, type MenuLabel } from "./routes/menu-routes";

import DashboardPage from "./pages/DashboardPage";
import CabeceirosPage from "./pages/CabeceirosPage";


function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const activeLabel = labelForPath(location.pathname);

  function handleNavigate(label: MenuLabel) {
    navigate(ROUTE_BY_LABEL[label]);
  }

  return (
    <div className="min-h-screen bg-white">
      <Sidebar active={activeLabel} onNavigate={handleNavigate} />

      {/* Área de conteúdo: recuada em desktop (largura da sidebar = w-60 = 15rem) */}
      <main className="p-6 lg:ml-58 lg:p-10">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/cabeceiros" element={<CabeceirosPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Layout />
    </HashRouter>
  );
}