// Erzeugt favicon.ico (32 px PNG), apple-touch-icon.png und das Link-Vorschaubild og-image.jpg
import fs from 'node:fs';
import sharp from 'sharp';

const L = JSON.parse(fs.readFileSync('src/components/logo-paths.json', 'utf8'));
const fav = fs.readFileSync('public/favicon.svg');

await sharp(fav).resize(180, 180).png().toFile('public/apple-touch-icon.png');

// ICO mit eingebettetem 32-px-PNG (von allen Browsern unterstützt)
const png32 = await sharp(fav).resize(32, 32).png().toBuffer();
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
header.writeUInt8(32, 6); header.writeUInt8(32, 7); header.writeUInt8(0, 8); header.writeUInt8(0, 9);
header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12);
header.writeUInt32LE(png32.length, 14); header.writeUInt32LE(22, 18);
fs.writeFileSync('public/favicon.ico', Buffer.concat([header, png32]));

// Vorschaubild 1200 × 630: Logo mittig auf Aubergine, feine Goldlinie unten
const [vx, vy, vw, vh] = L.viewBox.split(' ').map(Number);
const lw = 760, lh = lw * vh / vw;
const attrs = `fill="none" stroke="#BF9E5D" stroke-width="${L.stroke}" stroke-linecap="round" stroke-linejoin="round"`;
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<rect width="1200" height="630" fill="#23052F"/>
<svg x="${(1200 - lw) / 2}" y="${(630 - lh) / 2 - 10}" width="${lw}" height="${lh}" viewBox="${L.viewBox}">
<path fill="#F0EDF6" d="${L.word}"/><path fill="#F0EDF6" d="${L.subline}"/>
<path ${attrs} d="${L.ekg}"/><path ${attrs} d="${L.arrow}"/></svg>
<rect x="560" y="540" width="80" height="2" fill="#BF9E5D"/>
</svg>`;
await sharp(Buffer.from(og)).jpeg({ quality: 88, mozjpeg: true }).toFile('public/og-image.jpg');
console.log('ok');
