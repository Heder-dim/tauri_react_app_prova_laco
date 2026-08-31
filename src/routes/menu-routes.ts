import type { SidebarProps } from "../components/layout/sidebar";

export type MenuLabel = NonNullable<SidebarProps["active"]>;

/**
 * Monta o caminho de um item do menu, considerando a prova ativa.
 * "Provas" e as páginas do banco global (Banco de Cabeceiros/Pezeiros) sempre vão pra
 * rotas fixas, independente de prova. Os demais dependem de haver um idProva na URL
 * atual (se não houver — ex: usuário ainda na lista de Provas — o item já vem desabilitado
 * na Sidebar, mas mantemos o fallback pra "/" por segurança).
 */
export function routeForLabel(label: MenuLabel, idProva: string | null): string {
  switch (label) {
    case "Provas":
      return "/";
    case "Banco de Cabeceiros":
      return "/banco/cabeceiros";
    case "Banco de Pezeiros":
      return "/banco/pezeiros";
  }

  if (!idProva) return "/";

  switch (label) {
    case "Dashboard":
      return `/provas/${idProva}/dashboard`;
    case "Cabeceiros":
      return `/provas/${idProva}/cabeceiros`;
    case "Pezeiros":
      return `/provas/${idProva}/pezeiros`;
    case "Duplas e Resultados":
      return `/provas/${idProva}/duplas-resultados`;
  }
}

/** Extrai o :idProva da URL atual, se houver (ex: "/provas/3/cabeceiros" -> "3") */
export function idProvaFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/provas\/([^/]+)/);
  return match ? match[1] : null;
}

/** Determina qual item do menu deve ficar destacado, a partir do caminho atual.
 * As rotas do banco global são checadas com igualdade exata (não `.includes`) porque
 * "/banco/cabeceiros" também "contém" "/cabeceiros" — sem isso cairia no item errado. */
export function labelForPath(pathname: string): MenuLabel {
  if (pathname === "/") return "Provas";
  if (pathname === "/banco/cabeceiros") return "Banco de Cabeceiros";
  if (pathname === "/banco/pezeiros") return "Banco de Pezeiros";
  if (pathname.includes("/dashboard")) return "Dashboard";
  if (pathname.includes("/cabeceiros")) return "Cabeceiros";
  if (pathname.includes("/pezeiros")) return "Pezeiros";
  if (pathname.includes("/duplas-resultados")) return "Duplas e Resultados";
  return "Provas";
}