// Otimiza public/hero -> WebP (preserva transparência, comprime fotos).
// Originais vão para assets-originais/hero. PNGs pesados são removidos de public.
import { readdir, mkdir, copyFile, stat, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const DIR = path.resolve("public/hero");
const BACKUP = path.resolve("assets-originais/hero");
const kb = (b) => (b / 1024).toFixed(1);

// largura máxima de exibição (px) + qualidade webp
const CFG = {
  "hero-desktop.png": { w: 1500, q: 80 },
  "hero-mobile.png": { w: 820, q: 78 },
  "hero-mirella-polaroid.png": { w: 620, q: 82 },
  "hero-amelie-icon.png": { w: 420, q: 84 },
  "hero-prazer-letters.png": { w: 820, q: 88 },
  "hero-doar-botton.png": { w: 520, q: 88 },
  "hero-sabermais-botton.png": { w: 520, q: 88 },
  "hero-mirellanafranca-card.png": { w: 1200, q: 82 },
};

await mkdir(BACKUP, { recursive: true });
let before = 0, after = 0;

for (const name of await readdir(DIR)) {
  if (!name.toLowerCase().endsWith(".png")) continue;
  const src = path.join(DIR, name);
  const b = (await stat(src)).size;

  const backup = path.join(BACKUP, name);
  if (!existsSync(backup)) await copyFile(src, backup);

  const cfg = CFG[name] ?? { w: 1200, q: 82 };
  const outName = name.replace(/\.png$/i, ".webp");
  const out = path.join(DIR, outName);

  const buf = await sharp(backup)
    .resize({ width: cfg.w, withoutEnlargement: true })
    .webp({ quality: cfg.q, effort: 6 })
    .toBuffer();

  await writeFile(out, buf);
  await rm(src); // remove PNG pesado de public (backup já feito)

  before += b;
  after += buf.length;
  console.log(`${name} -> ${outName}  ${kb(b)} -> ${kb(buf.length)} KB  (-${(100 * (1 - buf.length / b)).toFixed(0)}%)`);
}

console.log(`\nTOTAL hero: ${kb(before)} -> ${kb(after)} KB  (-${(100 * (1 - after / before)).toFixed(0)}%)`);
