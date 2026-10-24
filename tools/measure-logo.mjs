// Vermisst das Original-Logo: Begrenzungen von Weiß (Schrift) und Gold (EKG-Linie)
import sharp from 'sharp';

const src = process.argv[2];
const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

const isWhite = (r, g, b) => r > 200 && g > 200 && b > 200;
const isGold = (r, g, b) => r > 140 && g > 110 && b < 120 && r - b > 60;

const box = () => ({ x0: 1e9, y0: 1e9, x1: -1, y1: -1 });
const white = box(), gold = box();
const rowsWhite = new Array(height).fill(0);
const goldCols = {};

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * channels;
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    let b2 = null;
    if (isWhite(r, g, b)) { b2 = white; rowsWhite[y]++; }
    else if (isGold(r, g, b)) { b2 = gold; (goldCols[x] ||= []).push(y); }
    if (b2) {
      b2.x0 = Math.min(b2.x0, x); b2.y0 = Math.min(b2.y0, y);
      b2.x1 = Math.max(b2.x1, x); b2.y1 = Math.max(b2.y1, y);
    }
  }
}
console.log('size', width, height);
console.log('white', white);
console.log('gold', gold);
// Zeilenbänder der weißen Schrift (Wortmarke vs. Unterzeile)
let bands = [], inBand = false, start = 0;
rowsWhite.forEach((n, y) => {
  if (n > 0 && !inBand) { inBand = true; start = y; }
  if (n === 0 && inBand) { inBand = false; bands.push([start, y - 1]); }
});
console.log('white bands', bands);
// Gold: pro Spalte Min/Max-y (Mittellinie der Linie)
const cols = Object.keys(goldCols).map(Number).sort((a, b) => a - b);
const out = cols.filter((x) => x % 4 === 0).map((x) => {
  const ys = goldCols[x];
  return `${x}:${Math.min(...ys)}-${Math.max(...ys)}`;
});
console.log(out.join(' '));
