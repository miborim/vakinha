// Otimiza imagens em public/ preservando qualidade e transparência.
// Originais são copiados para ./assets-originais (fora de public, não vai pro site).
import { readdir, mkdir, copyFile, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(".");
const PUBLIC = path.join(ROOT, "public");
const BACKUP = path.join(ROOT, "assets-originais");

// Largura máxima por pasta (px). Stickers aparecem pequenos; texturas são fundos.
const MAX_WIDTH = {
  stickers: 800,
  texturas: 1800,
  fotos: 1400,
  logos: 1000,
};

// Arquivos que já foram tratados à mão e não devem ser reprocessados.
// A faixa do rodapé tem texto manuscrito e um carimbo com letras miúdas:
// reduzir a largura deixa esses detalhes ilegíveis, então ela é gerada
// separadamente a partir de assets-originais/footer/rodapé.png.
const NAO_OTIMIZAR = new Set(["footer/footer-band.webp"]);

const kb = (b) => (b / 1024).toFixed(1);

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

async function run() {
  const files = await walk(PUBLIC);
  let totalBefore = 0;
  let totalAfter = 0;

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const rel = path.relative(PUBLIC, file);
    const folder = rel.split(path.sep)[0];
    const before = (await stat(file)).size;

    if (NAO_OTIMIZAR.has(rel.split(path.sep).join("/"))) {
      totalBefore += before;
      totalAfter += before;
      console.log(`skip  ${rel}  (${kb(before)} KB, tratada à mão)`);
      continue;
    }

    // SVG: apenas contabiliza, já é leve (vetorial).
    if (ext === ".svg") {
      totalBefore += before;
      totalAfter += before;
      console.log(`skip  ${rel}  (${kb(before)} KB, svg)`);
      continue;
    }
    if (![".png", ".jpg", ".jpeg", ".webp"].includes(ext)) continue;

    // Backup do original
    const backupPath = path.join(BACKUP, rel);
    await mkdir(path.dirname(backupPath), { recursive: true });
    if (!existsSync(backupPath)) await copyFile(file, backupPath);

    const maxW = MAX_WIDTH[folder] ?? 1400;
    let img = sharp(backupPath).resize({
      width: maxW,
      withoutEnlargement: true,
    });

    if (ext === ".png") {
      img = img.png({ quality: 82, compressionLevel: 9, palette: true });
    } else if (ext === ".webp") {
      img = img.webp({ quality: 82 });
    } else {
      img = img.jpeg({ quality: 82, mozjpeg: true });
    }

    const buf = await img.toBuffer();
    await writeFile(file, buf);
    const after = buf.length;

    totalBefore += before;
    totalAfter += after;
    const saved = (100 * (1 - after / before)).toFixed(0);
    console.log(`opt   ${rel}  ${kb(before)} -> ${kb(after)} KB  (-${saved}%)`);
  }

  console.log(
    `\nTOTAL: ${kb(totalBefore)} -> ${kb(totalAfter)} KB  ` +
      `(-${(100 * (1 - totalAfter / totalBefore)).toFixed(0)}%)`
  );
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
