// Vergleicht die Logo-Unterzeile mit freien Grotesk-Schriften
import fs from 'node:fs';
import path from 'node:path';
import opentype from 'opentype.js';
import sharp from 'sharp';

const [logoPath, outPath, list] = process.argv.slice(2);
const text = 'Finanzberatung für Ärzte';
const W = 740, H = 70, top = 570, left = 170;

// Original vermessen: Versalhöhe aus dem "F" (x 186–206)
const { data, info } = await sharp(logoPath).raw().toBuffer({ resolveWithObject: true });
let fTop = 1e9, fBot = -1, x0 = 1e9, x1 = -1;
for (let y = 575; y < 640; y++) for (let x = 150; x < 950; x++) {
  const i = (y * info.width + x) * info.channels;
  if (data[i] > 200 && data[i + 1] > 200 && data[i + 2] > 200) {
    if (x < 207 && y > 583) { fTop = Math.min(fTop, y); fBot = Math.max(fBot, y); }
    x0 = Math.min(x0, x); x1 = Math.max(x1, x);
  }
}
console.log({ fTop, fBot, x0, x1 });
const capH = fBot - fTop + 1, baseline = fBot + 1, targetW = x1 - x0 + 1;

function load(name, wt) {
  const buf = fs.readFileSync(path.join('node_modules/@fontsource', name, 'files', `${name}-latin-${wt}-normal.woff`));
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length));
}
function layout(font, size, track) {
  const scale = size / font.unitsPerEm;
  const glyphs = [...text].map((c) => font.charToGlyph(c));
  let x = 0; const pos = [];
  glyphs.forEach((g, i) => {
    pos.push(x);
    x += g.advanceWidth * scale + track;
    if (glyphs[i + 1]) x += font.getKerningValue(g, glyphs[i + 1]) * scale;
  });
  return { glyphs, pos };
}

const rows = [await sharp(logoPath).extract({ left, top, width: W, height: H }).png().toBuffer()];
for (const [name, wt] of list.split(',').map((s) => s.split(':'))) {
  const font = load(name, wt);
  const capUnits = font.tables.os2.sCapHeight || font.charToGlyph('H').getBoundingBox().y2;
  const size = capH / capUnits * font.unitsPerEm;
  // Laufweite so wählen, dass die Gesamtbreite passt
  const base = layout(font, size, 0);
  const lastG = base.glyphs.at(-1);
  const rawW = base.pos.at(-1) + lastG.getBoundingBox().x2 * size / font.unitsPerEm;
  const track = (targetW - rawW) / (text.length - 1);
  const { glyphs, pos } = layout(font, size, track);
  const p = new opentype.Path();
  glyphs.forEach((g, i) => p.extend(g.getPath(x0 - left + pos[i], baseline - top, size)));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect width="100%" height="100%" fill="#2D1431"/><path d="${p.toPathData(2)}" fill="#fff"/>
    <text x="${W - 4}" y="12" font-family="Arial" font-size="11" fill="#BF9E5D" text-anchor="end">${name} ${wt} · track ${(track / size).toFixed(3)}em</text></svg>`;
  rows.push(await sharp(Buffer.from(svg)).png().toBuffer());
}
await sharp({ create: { width: W, height: rows.length * H, channels: 3, background: '#000' } })
  .composite(rows.map((input, i) => ({ input, left: 0, top: i * H }))).png().toFile(outPath);
console.log('ok');
