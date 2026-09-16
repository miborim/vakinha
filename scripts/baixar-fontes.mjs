// Baixa os woff2 do Google Fonts e gera o CSS local com @font-face.
// Uso pontual: rode apenas se precisar trocar/atualizar as fontes.
//   node scripts/baixar-fontes.mjs
import { writeFile, mkdir, copyFile } from "node:fs/promises";
import path from "node:path";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const URL_GOOGLE =
  "https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700" +
  "&family=EB+Garamond:ital,wght@0,400;0,500;1,400" +
  "&family=Space+Mono:ital,wght@0,400;0,700;1,400" +
  "&family=Special+Elite&display=swap";

// Só os subsets que o site usa. "latin" ja cobre todo o acentuado do
// portugues e do frances (e, e, c, i estao em U+0000-00FF); "latin-ext"
// entra como rede de seguranca e so e baixado se a pagina precisar.
const SUBSETS = new Set(["latin", "latin-ext"]);

const DEST_FONTES = path.resolve("src/assets/fonts");
const DEST_CSS = path.resolve("src/fontes.css");

// public/404.html nao passa pelo Vite (e copiado literalmente), entao nao
// enxerga os arquivos com hash de src/assets. Ele recebe a propria copia,
// gerada aqui para nunca sair de sincronia com a do site.
const DEST_404 = path.resolve("public/fonts");
const FONTES_404 = [
  ["Space Mono", "400", "normal", "latin"],
  ["Space Mono", "700", "normal", "latin"],
  ["Special Elite", "400", "normal", "latin"],
];

const slug = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

async function main() {
  const css = await (await fetch(URL_GOOGLE, { headers: { "User-Agent": UA } })).text();

  // Cada bloco vem precedido de um comentario com o nome do subset.
  const blocos = [...css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g)];
  if (!blocos.length) throw new Error("Nao consegui interpretar o CSS do Google Fonts.");

  await mkdir(DEST_FONTES, { recursive: true });

  const saida = [];
  let baixados = 0;
  let bytes = 0;

  for (const [, subset, bloco] of blocos) {
    if (!SUBSETS.has(subset)) continue;

    const campo = (nome) => bloco.match(new RegExp(`${nome}:\\s*([^;]+);`))?.[1].trim();
    const familia = campo("font-family").replace(/['"]/g, "");
    const peso = campo("font-weight");
    const estilo = campo("font-style");
    const range = campo("unicode-range");
    const url = bloco.match(/url\((https:[^)]+\.woff2)\)/)?.[1];
    if (!url) throw new Error(`Bloco sem woff2: ${familia} ${peso} ${estilo}`);

    const arquivo = `${slug(familia)}-${peso}-${estilo}-${subset}.woff2`;
    const buf = Buffer.from(await (await fetch(url, { headers: { "User-Agent": UA } })).arrayBuffer());
    await writeFile(path.join(DEST_FONTES, arquivo), buf);
    baixados++;
    bytes += buf.length;

    saida.push(
      `/* ${familia} ${peso} ${estilo} — ${subset} */\n` +
        `@font-face {\n` +
        `  font-family: "${familia}";\n` +
        `  font-style: ${estilo};\n` +
        `  font-weight: ${peso};\n` +
        `  font-display: swap;\n` +
        `  src: url("./assets/fonts/${arquivo}") format("woff2");\n` +
        `  unicode-range: ${range};\n` +
        `}`
    );
  }

  const cabecalho =
    `/* Fontes auto-hospedadas — geradas por scripts/baixar-fontes.mjs.\n` +
    `   Nao edite a mao: rode o script de novo se precisar mudar algo.\n` +
    `   Auto-hospedar evita conexoes a fonts.googleapis.com/fonts.gstatic.com,\n` +
    `   o que corta duas conexoes de terceiros e nao expoe o IP de quem visita. */\n\n`;

  await writeFile(DEST_CSS, cabecalho + saida.join("\n\n") + "\n", "utf8");

  // Copia para o 404, que se vira sozinho.
  await mkdir(DEST_404, { recursive: true });
  const css404 = [];
  for (const [familia, peso, estilo, subset] of FONTES_404) {
    const arquivo = `${slug(familia)}-${peso}-${estilo}-${subset}.woff2`;
    await copyFile(path.join(DEST_FONTES, arquivo), path.join(DEST_404, arquivo));
    css404.push(
      `@font-face { font-family: "${familia}"; font-style: ${estilo}; ` +
        `font-weight: ${peso}; font-display: swap; ` +
        `src: url("/vakinha/fonts/${arquivo}") format("woff2"); }`
    );
  }
  console.log(`\n404: ${FONTES_404.length} arquivos em public/fonts/`);
  console.log("Cole estes @font-face no <style> de public/404.html:\n");
  console.log(css404.join("\n"));

  console.log(`\n${baixados} arquivos, ${(bytes / 1024).toFixed(1)} KB`);
  console.log(`CSS: ${path.relative(process.cwd(), DEST_CSS)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
