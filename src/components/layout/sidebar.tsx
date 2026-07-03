import { useState } from "react";
import { LayoutGrid, Users, User, Trophy, Menu, X, type LucideIcon } from "lucide-react";

type MenuLabel = "Provas" | "Dashboard" | "Cabeceiros" | "Pezeiros" | "Duplas e Resultados";

interface MenuItem {
  label: MenuLabel;
  icon: LucideIcon;
}

const MENU_ITEMS: MenuItem[] = [
  { label: "Provas", icon: LayoutGrid },
  { label: "Dashboard", icon: LayoutGrid },
  { label: "Cabeceiros", icon: Users },
  { label: "Pezeiros", icon: User },
  { label: "Duplas e Resultados", icon: Trophy },
];


export interface SidebarProps {
  active?: MenuLabel;
  onNavigate?: (label: MenuLabel) => void;
}

function LogoMark() {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-950/40">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 11l18-5v12L3 14v-3z" />
        <path d="M11.6 16.8a2 2 0 1 1-3.2 2.4" />
      </svg>
    </div>
  );
}


export default function Sidebar({
  active = "Dashboard",
  onNavigate = () => {},
}: SidebarProps) {
  const [open, setOpen] = useState(false);

  function handleSelect(label: MenuLabel) {
    onNavigate(label);
    setOpen(false);
  }

  return (
    <>
      {/* Barra superior — visível apenas em telas pequenas/médias */}
      <div className="flex h-14 items-center justify-between border-b border-white/5 bg-[#0b1220] px-4 lg:hidden">
        <div className="flex items-center gap-2.5">
          <LogoMark />
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-wide text-white">LAÇO</p>
            <p className="-mt-0.5 text-[10px] font-semibold tracking-widest text-blue-400">
              AUTOMAÇÃO
            </p>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="p-2 text-slate-300 hover:text-white"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Overlay do drawer mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar — fixa em desktop, drawer deslizante em mobile */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-72 shrink-0 flex-col
          bg-[#0b1220] transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <button
          onClick={() => setOpen(false)}
          aria-label="Fechar menu"
          className="absolute right-4 top-4 text-slate-400 hover:text-white lg:hidden"
        >
          <X size={20} />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-3 px-6 pb-5 pt-6">
          <LogoMark />
          <div className="leading-tight">
            <p className="text-base font-bold tracking-wide text-white">
              LAÇO
            </p>
            <p className="-mt-0.5 text-xs font-semibold tracking-widest text-blue-400">
              AUTOMAÇÃO
            </p>
          </div>
        </div>

        <div className="mx-6 border-t border-white/5" />

        {/* Navegação */}
        <nav className="mt-6 flex-1 overflow-y-auto px-4">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            Menu principal
          </p>
          <ul className="space-y-1.5">
            {MENU_ITEMS.map(({ label, icon: Icon }) => {
              const isActive = label === active;
              return (
                <li key={label}>
                  <button
                    onClick={() => handleSelect(label)}
                    className={`flex w-full items-center gap-3 cursor-pointer rounded-xl px-3 py-2.5 text-left text-sm transition-colors
                      ${
                        isActive
                          ? "bg-linear-to-r from-blue-600 to-blue-500 font-semibold text-white shadow-lg shadow-blue-950/40"
                          : "font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200"
                      }`}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.4 : 2} />
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav> 
      </aside>
    </>
  );
}