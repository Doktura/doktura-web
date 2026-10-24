// Zeigt den Verlauf einzelner Videos: 5 Standbilder pro Video in einer Zeile.
// Aufruf: node tools/video-strip.mjs <Ordner> <Ausgabe.jpg> <Nummern, z. B. 4,14,25>
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import ffprobe from 'ffprobe-static';
import sharp from 'sharp';

const [dir, out, nums] = process.argv.slice(2);
const files = fs.readdirSync(dir).filter((f) => /\.(mp4|mov|webm)$/i.test(f)).sort();
const W = 336, H = 189, T = [0.08, 0.3, 0.5, 0.7, 0.92];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'strip-'));
const comp = [];
const list = nums.split(',').map(Number);

list.forEach((n, r) => {
  const p = path.join(dir, files[n - 1]);
  const dur = Number(execFileSync(ffprobe.path, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p]).toString());
  T.forEach((t, c) => {
    const png = path.join(tmp, `${n}-${c}.png`);
    execFileSync(ffmpeg, ['-y', '-v', 'error', '-ss', String(dur * t), '-i', p, '-frames:v', '1',
      '-vf', `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2`, png]);
    comp.push({ input: png, left: c * W, top: r * (H + 22) + 22 });
  });
  comp.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W * 5}" height="22"><rect width="100%" height="100%" fill="#000"/><text x="6" y="16" font-family="Arial" font-size="14" fill="#fff">Nr. ${n} · ${dur.toFixed(0)} s · ${files[n - 1]}</text></svg>`), left: 0, top: r * (H + 22) });
});
await sharp({ create: { width: W * 5, height: list.length * (H + 22), channels: 3, background: '#000' } })
  .composite(comp).jpeg({ quality: 82 }).toFile(out);
console.log('ok');
