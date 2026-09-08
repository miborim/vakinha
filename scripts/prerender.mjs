// Pre-renderizacao (SSG) do site.
//
// Por que isso existe: o site e um app React que, por padrao, gera um
// `index.html` praticamente vazio (`<div id="root"></div>`). Crawlers do
// Google, bots de IA (GPTBot, ClaudeBot, PerplexityBot), geradores de preview
// de link (WhatsApp, Instagram) e leitores de tela mais simples nao executam
// JavaScript — ou seja, nao enxergavam nenhum conteudo da pagina.
//
// Este script roda depois do `vite build` e injeta o HTML completo, ja
// renderizado, dentro do `index.html` publicado. O navegador continua
// carregando o React normalmente (via `hydrateRoot`), entao toda a
// interatividade (modais, galeria, copiar PIX) segue funcionando igual.
//
// Uso: `npm run build` (ja chama este script automaticamente).

import { createServer } from "vite";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = fileURLToPath(new URL("../", import.meta.url));
const arquivoHtml = path.join(raiz, "dist", "index.html");

const vite = await createServer({
  root: raiz,
  logLevel: "warn",
  server: { middlewareMode: true },
  appType: "custom",
});

try {
  const { render } = await vite.ssrLoadModule("/src/entry-server.jsx");
  const { campaign } = await vite.ssrLoadModule("/src/data/campaign.js");
  const { perguntasFrequentes } = await vite.ssrLoadModule("/src/data/faq.js");
  const conteudo = render();

  if (!conteudo || conteudo.length < 1000) {
    throw new Error(
      `HTML pre-renderizado ficou vazio ou curto demais (${conteudo?.length ?? 0} caracteres).`
    );
  }

  const site = "https://miborim.github.io/vakinha/";

  // Dados estruturados. Usamos apenas tipos que existem de fato no Schema.org
  // (WebPage, Person, FAQPage) — nao existe um tipo oficial para "vaquinha".
  const dadosEstruturados = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Mirella na França · Vaquinha do Intercâmbio na ECE Paris",
      description:
        "Campanha de arrecadação para custear os gastos pessoais do intercâmbio de Mirella Borim em Inteligência Artificial na ECE Paris.",
      url: site,
      inLanguage: "pt-BR",
      about: {
        "@type": "Person",
        name: campaign.nome,
        description:
          "Estudante de Sistemas de Informação, aprovada para o intercâmbio em Inteligência Artificial na ECE Paris.",
        email: `mailto:${campaign.contato.email}`,
        sameAs: [campaign.contato.instagram, campaign.contato.linkedin],
        alumniOf: {
          "@type": "CollegeOrUniversity",
          name: "Inteli — Institute of Technology and Leadership",
        },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: perguntasFrequentes.map((item) => ({
        "@type": "Question",
        name: item.pergunta,
        acceptedAnswer: { "@type": "Answer", text: item.resposta },
      })),
    },
  ];

  const jsonLd = dadosEstruturados
    .map(
      (bloco) =>
        `    <script type="application/ld+json">${JSON.stringify(bloco).replace(
          /</g,
          "\\u003c"
        )}</script>`
    )
    .join("\n");

  const html = await readFile(arquivoHtml, "utf8");
  const alvo = '<div id="root"></div>';

  if (!html.includes(alvo)) {
    throw new Error(
      `Nao encontrei '${alvo}' em dist/index.html — o build mudou de formato?`
    );
  }

  const htmlFinal = html
    .replace(alvo, `<div id="root">${conteudo}</div>`)
    .replace("</head>", `${jsonLd}\n  </head>`);

  await writeFile(arquivoHtml, htmlFinal, "utf8");

  console.log(
    `[prerender] HTML estatico gerado com sucesso (${conteudo.length} caracteres injetados em dist/index.html).`
  );
  console.log(
    `[prerender] JSON-LD injetado: WebPage + Person + FAQPage (${perguntasFrequentes.length} perguntas).`
  );
} finally {
  await vite.close();
}
