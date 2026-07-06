import type { SidebarProps } from "../components/layout/sidebar";

export type MenuLabel = NonNullable<SidebarProps["active"]>;

/**
 * Monta o caminho de um item do menu, considerando a prova ativa.
 * "Provas" sempre vai pra raiz; os demais dependem de haver um idProva na URL atual
 * (se não houver — ex: usuário ainda na lista de Provas — o item já vem desabilitado
 * na Sidebar, mas mantemos o fallback pra "/" por segurança).
 */
export function routeForLabel(label: MenuLabel, idProva: string | null): string {
  if (label === "Provas" || !idProva) return "/";

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

/** Determina qual item do menu deve ficar destacado, a partir do caminho atual */
export function labelForPath(pathname: string): MenuLabel {
  if (pathname === "/") return "Provas";
  if (pathname.includes("/dashboard")) return "Dashboard";
  if (pathname.includes("/cabeceiros")) return "Cabeceiros";
  if (pathname.includes("/pezeiros")) return "Pezeiros";
  if (pathname.includes("/duplas-resultados")) return "Duplas e Resultados";
  return "Provas";
}