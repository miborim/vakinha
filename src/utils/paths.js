// Resolve caminhos de assets da pasta `public` levando em conta o `base`
// configurado no Vite (ex.: "/vakinha/" quando publicado no GitHub Pages).
// Sem isso, caminhos absolutos como "/hero/foo.webp" apontariam para a raiz
// do domínio em vez da raiz do site, quebrando as imagens em Project Pages.
export function withBase(path) {
  const base = import.meta.env.BASE_URL || "/";
  return `${base.replace(/\/$/, "")}/${String(path).replace(/^\//, "")}`;
}
