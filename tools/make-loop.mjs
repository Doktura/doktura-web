// Macht aus einem Stock-Video einen kurzen, nahtlosen Loop im Doktura-Look:
// zuschneiden, in Aubergine-Töne umfärben (Duoton), Ton entfernen, stark komprimieren, Standbild als Poster.
//
// Aufruf:
//   node tools/make-loop.mjs <Quelle.mp4> <Name> --start 2 --len 10 --w 1600 --h 900 [--flip] [--focus 0.5,0.4] [--test]
// Ergebnis: public/video/<Name>.mp4, public/video/<Name>-poster.webp   (--test: nur Standbild nach scratch)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import sharp from 'sharp';

const args = process.argv.slice(2);
const [src, name] = args;
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i > -1 ? args[i + 1] : d; };
const has = (k) => args.includes(`--${k}`);

const start = Number(opt('start', 0)), len = Number(opt('len', 8)), fade = 1;
const W = Number(opt('w', 1600)), H = Number(opt('h', 900));
const [fx, fy] = opt('focus', '0.5,0.5').split(',').map(Number);
const crf = opt('crf', '30');
const outDir = opt('out', 'public/video');
fs.mkdirSync(outDir, { recursive: true });

// Duoton: Schatten = tiefes Aubergine, Lichter = helles Lavendel. Vorher leicht entsättigen statt ganz grau,
// damit Hauttöne und Holz noch einen Hauch Wärme behalten.
const grade = [
  `scale=${W}:${H}:force_original_aspect_ratio=increase`,
  `crop=${W}:${H}:(iw-${W})*${fx}:(ih-${H})*${fy}`,
  has('flip') ? 'hflip' : null,
  'eq=contrast=1.12:brightness=-0.04:gamma=0.82',
  'split[c][g]',
].filter(Boolean).join(',');
const duo = "[g]hue=s=0,lutrgb=r='val*0.52+17':g='val*0.44+4':b='val*0.62+25'[d];[c]hue=s=0.5,eq=brightness=-0.18[cc];[cc][d]blend=all_mode=normal:all_opacity=0.18";

if (has('test')) {
  const png = path.join(outDir, `${name}-test.png`);
  execFileSync(ffmpeg, ['-y', '-v', 'error', '-ss', String(start + len / 2), '-i', src, '-frames:v', '1',
    '-filter_complex', `[0:v]${grade};${duo}[v]`, '-map', '[v]', png]);
  console.log('Test-Standbild:', png);
  process.exit(0);
}

// Nahtloser Loop: das Ende blendet in den Anfang über
const L = len, d = fade;
const fc = [
  `[0:v]${grade};${duo},fps=25,format=yuv420p,split=3[a][b][c2]`,
  `[a]trim=start=${d}:end=${L},setpts=PTS-STARTPTS[main]`,
  `[b]trim=start=${L}:end=${L + d},setpts=PTS-STARTPTS[tail]`,
  `[c2]trim=start=0:end=${d},setpts=PTS-STARTPTS[head]`,
  `[tail][head]xfade=transition=fade:duration=${d}:offset=0[x]`,
  `[main][x]concat=n=2:v=1:a=0[v]`,
].join(';');
const mp4 = path.join(outDir, `${name}.mp4`);
execFileSync(ffmpeg, ['-y', '-v', 'error', '-ss', String(start), '-t', String(L + d + 0.2), '-i', src,
  '-filter_complex', fc, '-map', '[v]', '-an',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', crf, '-profile:v', 'high', '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart', mp4], { stdio: 'inherit' });

// Poster = erstes Bild des Loops
const posterPng = path.join(outDir, `${name}-poster.png`);
execFileSync(ffmpeg, ['-y', '-v', 'error', '-i', mp4, '-frames:v', '1', posterPng]);
await sharp(posterPng).webp({ quality: 72 }).toFile(path.join(outDir, `${name}-poster.webp`));
fs.unlinkSync(posterPng);
const kb = (f) => (fs.statSync(f).size / 1024).toFixed(0);
console.log(`${name}.mp4  ${kb(mp4)} KB · Poster ${kb(path.join(outDir, `${name}-poster.webp`))} KB`);
