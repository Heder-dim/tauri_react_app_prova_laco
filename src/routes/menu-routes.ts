import type { SidebarProps } from "../components/layout/sidebar";

export type MenuLabel = NonNullable<SidebarProps["active"]>;

/** Caminho de rota para cada item do menu */
export const ROUTE_BY_LABEL: Record<MenuLabel, string> = {
  Provas: "/",
  Dashboard: "/dashboard",
  Cabeceiros: "/cabeceiros",
  Pezeiros: "/pezeiros",
  "Duplas e Resultados": "/duplas-resultados",
};

/** Caminho -> label (usado para destacar o item ativo na sidebar) */
const LABEL_BY_ROUTE: Record<string, MenuLabel> = Object.fromEntries(
  Object.entries(ROUTE_BY_LABEL).map(([label, path]) => [path, label as MenuLabel])
);

export function labelForPath(pathname: string): MenuLabel {
  return LABEL_BY_ROUTE[pathname] ?? "Dashboard";
}
