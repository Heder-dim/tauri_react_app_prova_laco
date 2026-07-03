import { useState } from "react";
import Sidebar, { type SidebarProps } from "./components/layout/sidebar";

type MenuLabel = NonNullable<SidebarProps["active"]>;

export default function App() {
  const [page, setPage] = useState<MenuLabel>("Dashboard");

  return (
    <div className="min-h-screen bg-white">
      <Sidebar active={page} onNavigate={setPage} />

      {/* Área de conteúdo: recuada em desktop (largura da sidebar = w-72 = 18rem) */}
      <main className="p-6 lg:ml-72 lg:p-10">
        <h1 className="text-2xl font-bold text-[#070c14]">{page}</h1>
        <p className="mt-2 text-slate-400">
          Conteúdo da página "{page}" entra aqui.
        </p>
      </main>
    </div>
  );
}