// Otimiza SOMENTE public/header (não toca no resto, que já foi tratado/recortado).
import { readdir, mkdir, copyFile, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const DIR = path.resolve("public/header");
const BACKUP = path.resolve("assets-originais/header");
const kb = (b) => (b / 1024).toFixed(1);

// Larguras máximas de exibição (px) — palavras aparecem pequenas na navbar.
const MAX_WIDTH = {
  "header-background.png": 1600,
  "header-logo.png": 620,
  "header-intercambio.png": 380,
  "header-minhahistoria.png": 440,
  "header-galeria.png": 240,
  "header-doar.png": 200,
  "header-hover.png": 120,
};

let before = 0;
let after = 0;
await mkdir(BACKUP, { recursive: true });

for (const name of await readdir(DIR)) {
  if (!name.toLowerCase().endsWith(".png")) continue;
  const file = path.join(DIR, name);
  const b = (await stat(file)).size;

  const backup = path.join(BACKUP, name);
  if (!existsSync(backup)) await copyFile(file, backup);

  const buf = await sharp(backup)
    .resize({ width: MAX_WIDTH[name] ?? 800, withoutEnlargement: true })
    .png({ quality: 80, compressionLevel: 9, palette: true })
    .toBuffer();

  await writeFile(file, buf);
  before += b;
  after += buf.length;
  console.log(`opt  ${name}  ${kb(b)} -> ${kb(buf.length)} KB  (-${(100 * (1 - buf.length / b)).toFixed(0)}%)`);
}

console.log(`\nTOTAL header: ${kb(before)} -> ${kb(after)} KB  (-${(100 * (1 - after / before)).toFixed(0)}%)`);
