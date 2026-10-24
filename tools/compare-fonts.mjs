// Rendert "Doktura" in mehreren freien Schriften unter das Original zum Vergleich
import fs from 'node:fs';
import path from 'node:path';
import opentype from 'opentype.js';
import sharp from 'sharp';

const [logoPath, outPath] = process.argv.slice(2);
const fs_ = 'node_modules/@fontsource';
const candidates = (process.argv[4] || 'besley:800,besley:900,young-serif:400,noticia-text:700,literata:800,fraunces:800,kameron:700,arvo:700,sanchez:400,crete-round:400,charis-sil:700')
  .split(',').map((s) => s.split(':'));
const W = 460, H = 110, text = 'Doktura';

// Einfacher Satz ohne OpenType-Features (opentype.js kann nicht alle Lookups)
function layout(font, str, x, y, size) {
  const scale = size / font.unitsPerEm;
  const glyphs = [...str].map((c) => font.charToGlyph(c));
  const out = new opentype.Path();
  glyphs.forEach((g, i) => {
    out.extend(g.getPath(x, y, size));
    x += g.advanceWidth * scale;
    if (glyphs[i + 1]) x += font.getKerningValue(g, glyphs[i + 1]) * scale;
  });
  return out;
}
const getPath = (font, s, x, y, size) => layout(font, s, x, y, size);
const rows = [];

// Original-Zeile
rows.push(await sharp(logoPath).extract({ left: 165, top: 470, width: W, height: H }).png().toBuffer());

for (const [name, wt] of candidates) {
  const file = path.join(fs_, name, 'files', `${name}-latin-${wt}-normal.woff`);
  if (!fs.existsSync(file)) { console.log('fehlt', file); continue; }
  const buf = fs.readFileSync(file);
  const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length));
  // Breite auf 410px skalieren (wie im Original)
  const probe = getPath(font, text, 0, 0, 100).getBoundingBox();
  const size = 100 * 410 / (probe.x2 - probe.x1);
  const p = getPath(font, text, 0, 0, size);
  const bb = p.getBoundingBox();
  const dx = 188 - 165 - bb.x1, baseline = 566 - 470;
  const d = getPath(font, text, dx, baseline, size).toPathData(2);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect width="100%" height="100%" fill="#2D1431"/>
    <path d="${d}" fill="#fff"/>
    <text x="${W - 4}" y="16" font-family="Arial" font-size="12" fill="#BF9E5D" text-anchor="end">${name} ${wt}</text>
  </svg>`;
  rows.push(await sharp(Buffer.from(svg)).png().toBuffer());
}

await sharp({ create: { width: W * 2, height: Math.ceil(rows.length / 2) * H, channels: 3, background: '#000' } })
  .composite(rows.map((input, i) => ({ input, left: (i % 2) * W, top: Math.floor(i / 2) * H })))
  .png().toFile(outPath);
console.log('ok');

