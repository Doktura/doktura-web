// Baut das Doktura-Logo als SVG nach.
// Schriftzug: Besley 800, Unterzeile: Montserrat 700 – beide in Pfade umgewandelt,
// damit keine Schriftdatei geladen werden muss. Maße vom Original-Logo (1080 px) abgenommen.
//
// Aufruf: node tools/gen-logo.mjs <Pfad zu Logo.jpg>
// Ergebnis: src/components/logo-paths.json + public/logo/*.svg + public/favicon.svg
import fs from 'node:fs';
import path from 'node:path';
import opentype from 'opentype.js';
import sharp from 'sharp';

const logoPath = process.argv[2];
const GOLD = '#BF9E5D', AUBERGINE = '#23052F', OFFWHITE = '#F0EDF6';

// --- Original vermessen --------------------------------------------------
const { data, info } = await sharp(logoPath).raw().toBuffer({ resolveWithObject: true });
const white = (x, y) => {
  const i = (y * info.width + x) * info.channels;
  return data[i] > 170 && data[i + 1] > 170 && data[i + 2] > 170;
};
function measure(y0, y1, x0 = 150, x1 = 1000, capX1 = null) {
  let b = { x0: 1e9, x1: -1, y0: 1e9, y1: -1, capTop: 1e9, capBot: -1 };
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (white(x, y)) {
    b.x0 = Math.min(b.x0, x); b.x1 = Math.max(b.x1, x); b.y0 = Math.min(b.y0, y); b.y1 = Math.max(b.y1, y);
    if (capX1 && x <= capX1) { b.capTop = Math.min(b.capTop, y); b.capBot = Math.max(b.capBot, y); }
  }
  return b;
}
// Wortmarke: "D" liegt ganz links -> Versalhöhe aus den ersten ~40 px
const wm = measure(490, 572, 150, 620);
const wmD = measure(490, 572, wm.x0, wm.x0 + 40, wm.x0 + 40);
const sub = measure(584, 640, 150, 950);
const subF = measure(584, 640, sub.x0, sub.x0 + 16, sub.x0 + 16);
console.log({ wm, wmD, sub, subF });

// --- Schriftsatz ----------------------------------------------------------
function load(name, wt) {
  const buf = fs.readFileSync(path.join('node_modules/@fontsource', name, 'files', `${name}-latin-${wt}-normal.woff`));
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length));
}
// Glyph inkl. zusammengesetzter Glyphen (z. B. Ä) als Pfad
function glyphPath(font, g, x, y, size) { return g.getPath(x, y, size); }

function setText(font, text, { capHeight, baseline, left, width }) {
  const capUnits = font.charToGlyph('H').getBoundingBox().y2;
  const size = capHeight / capUnits * font.unitsPerEm;
  const scale = size / font.unitsPerEm;
  const glyphs = [...text].map((c) => font.charToGlyph(c));
  const lay = (track) => {
    let x = 0; const pos = [];
    glyphs.forEach((g, i) => {
      pos.push(x);
      x += g.advanceWidth * scale + track;
      if (glyphs[i + 1]) x += font.getKerningValue(g, glyphs[i + 1]) * scale;
    });
    return pos;
  };
  const first = glyphs[0].getBoundingBox().x1 * scale;
  const p0 = lay(0);
  const rawW = p0.at(-1) + glyphs.at(-1).getBoundingBox().x2 * scale - first;
  const track = (width - rawW) / (glyphs.length - 1);
  const pos = lay(track);
  const p = new opentype.Path();
  glyphs.forEach((g, i) => p.extend(glyphPath(font, g, left - first + pos[i], baseline, size)));
  return { d: p.toPathData(2), size, track };
}

const besley = load('besley', 800);
const mont = load('montserrat', 700);
const word = setText(besley, 'Doktura', {
  capHeight: wmD.capBot - wmD.capTop + 1, baseline: wmD.capBot + 1, left: wm.x0, width: wm.x1 - wm.x0 + 1,
});
const subline = setText(mont, 'Finanzberatung für Ärzte', {
  capHeight: subF.capBot - subF.capTop + 1, baseline: subF.capBot + 1, left: sub.x0, width: sub.x1 - sub.x0 + 1,
});
console.log('Wortmarke', word.size.toFixed(1), 'px, Laufweite', (word.track / word.size).toFixed(3), 'em');
console.log('Unterzeile', subline.size.toFixed(1), 'px, Laufweite', (subline.track / subline.size).toFixed(3), 'em');

// --- EKG-Linie mit Pfeil (Mittellinie, vom Original abgenommen) ------------
const ekg = 'M616 546.5H663Q667 546.5 670.2 540L682 516.5L698 556.5L716 463.5L735 593.5L754 513.5L765.9 538Q769 546.5 775 546.5H785Q792 546.5 796.5 542L887 454';
const arrow = 'M862 458L887 454L883.5 479';
const STROKE = 6;

// Ausschnitt um den Inhalt (mit etwas Luft für die Strichstärke)
const vb = { x: 182, y: 446, w: 892 - 182 + 2, h: 634 - 446 };
const viewBox = `${vb.x} ${vb.y} ${vb.w} ${vb.h}`;

// Nur das Zeichen (EKG + Pfeil) für Favicon und Dekoration
const markVB = '608 444 288 158';

const out = { viewBox, markViewBox: markVB, word: word.d, subline: subline.d, ekg, arrow, stroke: STROKE };
fs.mkdirSync('src/components', { recursive: true });
fs.writeFileSync('src/components/logo-paths.json', JSON.stringify(out, null, 2));

// --- Statische SVG-Dateien -----------------------------------------------
const lineAttrs = `fill="none" stroke="${GOLD}" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round"`;
const svg = (textColor, { withSub = true, bg = null } = {}) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="Doktura – Finanzberatung für Ärzte">
${bg ? `<rect x="${vb.x}" y="${vb.y}" width="${vb.w}" height="${vb.h}" fill="${bg}"/>\n` : ''}<path fill="${textColor}" d="${word.d}"/>
${withSub ? `<path fill="${textColor}" d="${subline.d}"/>\n` : ''}<path ${lineAttrs} d="${ekg}"/>
<path ${lineAttrs} d="${arrow}"/>
</svg>
`;
fs.mkdirSync('public/logo', { recursive: true });
fs.writeFileSync('public/logo/doktura-logo-hell.svg', svg(OFFWHITE));        // für dunkle Flächen
fs.writeFileSync('public/logo/doktura-logo-dunkel.svg', svg(AUBERGINE));     // für helle Flächen
fs.writeFileSync('public/logo/doktura-logo-weiss.svg', svg('#FFFFFF'));

// Favicon: EKG-Zeichen auf Aubergine
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<rect width="64" height="64" rx="14" fill="${AUBERGINE}"/>
<g transform="translate(5 9) scale(0.19)">
<path fill="none" stroke="${GOLD}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round" d="M0 165H45L70 108L96 186L120 20L148 250L176 108L200 165H220L300 70"/>
<path fill="none" stroke="${GOLD}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round" d="M240 66L302 66L302 128"/>
</g>
</svg>
`;
fs.writeFileSync('public/favicon.svg', favicon);
console.log('fertig');
