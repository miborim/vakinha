// Gera a imagem de preview social (Open Graph / Twitter Card), 1200x630.
//
// Ela e o que aparece quando alguem cola o link do site no WhatsApp,
// Instagram, LinkedIn ou X. Sem ela, o link vira so um retangulo cinza.
//
// Uso: `npm run gerar:preview` (so precisa rodar de novo se a arte mudar).

import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = fileURLToPath(new URL("../", import.meta.url));
const origem = path.join(raiz, "public", "hero", "hero-desktop.webp");
const destino = path.join(raiz, "public", "social-preview.png");

const LARGURA = 1200;
const ALTURA = 630;
const FUNDO = { r: 250, g: 250, b: 250, alpha: 1 };

const colagem = await sharp(origem)
  .resize({
    width: Math.round(LARGURA * 0.62),
    height: Math.round(ALTURA * 0.88),
    fit: "inside",
    withoutEnlargement: false,
  })
  .toBuffer();

const meta = await sharp(colagem).metadata();

const texto = Buffer.from(`
<svg width="${LARGURA}" height="${ALTURA}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .titulo { font-family: Georgia, 'Times New Roman', serif; font-size: 46px; font-weight: 700; fill: #2f2b25; }
    .sub    { font-family: 'Courier New', monospace; font-size: 22px; fill: #8f3b47; }
    .corpo  { font-family: 'Courier New', monospace; font-size: 20px; fill: #4a453c; }
  </style>
  <text class="titulo" x="700" y="252">Mirella na França</text>
  <text class="sub"    x="702" y="294">vaquinha do intercâmbio</text>
  <text class="corpo"  x="702" y="360">Aprovada na ECE Paris para</text>
  <text class="corpo"  x="702" y="391">estudar Inteligência Artificial.</text>
  <text class="corpo"  x="702" y="440">Bora fazer parte? Doe via PIX.</text>
</svg>
`);

await sharp({
  create: { width: LARGURA, height: ALTURA, channels: 4, background: FUNDO },
})
  .composite([
    {
      input: colagem,
      top: Math.round((ALTURA - meta.height) / 2),
      left: 30,
    },
    { input: texto, top: 0, left: 0 },
  ])
  .png()
  .toFile(destino);

console.log(`[preview] Imagem social gerada em ${destino} (${LARGURA}x${ALTURA}).`);
