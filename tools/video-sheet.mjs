// Übersicht aller Videos in einem Ordner: je ein Standbild mit Nummer, Maßen und Dauer.
// Aufruf: node tools/video-sheet.mjs <Ordner> <Ausgabe-Ordner> [Zeitpunkt 0..1]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import ffprobe from 'ffprobe-static';
import sharp from 'sharp';

const [dir, outDir, atArg] = process.argv.slice(2);
const at = Number(atArg ?? 0.35);
fs.mkdirSync(outDir, { recursive: true });
const files = fs.readdirSync(dir).filter((f) => /\.(mp4|mov|webm)$/i.test(f)).sort();
const W = 420, H = 236, COLS = 4, PER = 12;
const tiles = [];

files.forEach((f, i) => {
  const p = path.join(dir, f);
  const info = JSON.parse(execFileSync(ffprobe.path, ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate:format=duration', '-of', 'json', p]).toString());
  const { width, height } = info.streams[0];
  const dur = Number(info.format.duration);
  const png = path.join(outDir, `f${String(i + 1).padStart(2, '0')}.png`);
  execFileSync(ffmpeg, ['-y', '-v', 'error', '-ss', String(dur * at), '-i', p, '-frames:v', '1',
    '-vf', `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=0x111111`, png]);
  tiles.push({ png, label: `${i + 1} · ${width}×${height} · ${dur.toFixed(0)}s · ${f.slice(0, 26)}` });
  console.log(`${i + 1}\t${width}x${height}\t${dur.toFixed(1)}s\t${(fs.statSync(p).size / 1e6).toFixed(0)}MB\t${f}`);
});

for (let s = 0; s * PER < tiles.length; s++) {
  const part = tiles.slice(s * PER, (s + 1) * PER);
  const rows = Math.ceil(part.length / COLS);
  const comp = [];
  for (const [j, t] of part.entries()) {
    const x = (j % COLS) * W, y = Math.floor(j / COLS) * (H + 26);
    comp.push({ input: t.png, left: x, top: y });
    comp.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="26"><rect width="100%" height="100%" fill="#000"/><text x="6" y="18" font-family="Arial" font-size="14" fill="#fff">${t.label.replace(/&/g, '&amp;')}</text></svg>`), left: x, top: y + H });
  }
  await sharp({ create: { width: W * COLS, height: rows * (H + 26), channels: 3, background: '#000' } })
    .composite(comp).jpeg({ quality: 82 }).toFile(path.join(outDir, `sheet-${s + 1}.jpg`));
}
console.log('fertig');
