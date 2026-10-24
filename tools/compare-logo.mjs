// Original-Logo und SVG-Nachbau nebeneinander + Überlagerung (Rot = nur Original, Cyan = nur Nachbau)
import fs from 'node:fs';
import sharp from 'sharp';

const [logoPath, outPath] = process.argv.slice(2);
const L = JSON.parse(fs.readFileSync('src/components/logo-paths.json', 'utf8'));
const [vx, vy, vw, vh] = L.viewBox.split(' ').map(Number);
const S = 2; // Vergrößerung
const W = vw * S, H = vh * S;

const orig = await sharp(logoPath).extract({ left: vx, top: vy, width: vw, height: vh }).resize(W, H).png().toBuffer();
const attrs = `fill="none" stroke="#BF9E5D" stroke-width="${L.stroke}" stroke-linecap="round" stroke-linejoin="round"`;
const mk = (bg, txt) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="${L.viewBox}">
<rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="${bg}"/>
<path fill="${txt}" d="${L.word}"/><path fill="${txt}" d="${L.subline}"/>
<path ${attrs} d="${L.ekg}"/><path ${attrs} d="${L.arrow}"/></svg>`);
const rebuilt = await sharp(mk('#2D1431', '#FFFFFF')).png().toBuffer();

// Überlagerung
const a = await sharp(orig).greyscale().raw().toBuffer();
const b = await sharp(rebuilt).greyscale().raw().toBuffer();
const ov = Buffer.alloc(W * H * 3);
for (let i = 0; i < W * H; i++) {
  const A = a[i] > 110, B = b[i] > 110;
  const c = A && B ? [235, 235, 235] : A ? [230, 60, 60] : B ? [40, 200, 220] : [30, 20, 35];
  ov.set(c, i * 3);
}
const overlay = await sharp(ov, { raw: { width: W, height: H, channels: 3 } }).png().toBuffer();

const label = (t) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="36"><rect width="100%" height="100%" fill="#111"/><text x="12" y="25" font-family="Arial" font-size="20" fill="#ddd">${t}</text></svg>`);
const parts = [
  [label('Original (Logo.jpg)'), 36], [orig, H],
  [label('Nachbau (SVG)'), 36], [rebuilt, H],
  [label('Überlagerung: weiß = deckungsgleich · rot = nur Original · cyan = nur Nachbau'), 36], [overlay, H],
];
let y = 0;
const comp = parts.map(([input, h]) => { const r = { input, left: 0, top: y }; y += h; return r; });
await sharp({ create: { width: W, height: y, channels: 3, background: '#000' } }).composite(comp).png().toFile(outPath);
console.log('ok');
