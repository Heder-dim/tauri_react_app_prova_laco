import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./components/layout/sidebar";
import { routeForLabel, labelForPath, idProvaFromPath, type MenuLabel } from "./routes/menu-routes";

import DashboardPage from "./pages/DashboardPage";
import ProvasPage from "./pages/ProvasPage";
import CabeceirosPage from "./pages/CabeceirosPage";
import PezeirosPage from "./pages/PezeirosPage";
import DuplasResultadosPage from "./pages/DuplasResultadosPage";
import BancoCabeceirosPage from "./pages/BancoCabeceirosPage";
import BancoPezeirosPage from "./pages/BancoPezeirosPage";

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const activeLabel = labelForPath(location.pathname);
  const idProva = idProvaFromPath(location.pathname);

  function handleNavigate(label: MenuLabel) {
    navigate(routeForLabel(label, idProva));
  }

  return (
    <div className="min-h-screen bg-white">
      <Sidebar active={activeLabel} onNavigate={handleNavigate} />

      {/* Área de conteúdo: recuada em desktop (largura da sidebar = w-72 = 18rem) */}
      <main className="p-6 lg:ml-72 lg:p-10">
        <Routes>
          <Route path="/" element={<ProvasPage />} />
          <Route path="/banco/cabeceiros" element={<BancoCabeceirosPage />} />
          <Route path="/banco/pezeiros" element={<BancoPezeirosPage />} />

          <Route path="/provas/:idProva/dashboard" element={<DashboardPage />} />
          <Route path="/provas/:idProva/cabeceiros" element={<CabeceirosPage />} />
          <Route path="/provas/:idProva/pezeiros" element={<PezeirosPage />} />
          <Route path="/provas/:idProva/duplas-resultados" element={<DuplasResultadosPage />} />

          {/* /provas/:idProva sozinho (sem sub-rota) cai direto no Dashboard daquela prova */}
          <Route path="/provas/:idProva" element={<Navigate to="dashboard" replace />} />
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