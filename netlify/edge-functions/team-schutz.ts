// Passwortschutz für das interne Team-Dashboard unter doktura.de/team
// Läuft als Netlify Edge Function (kostenlos im Starter-Tarif) VOR der Seite:
// ohne gültiges Anmelde-Cookie bekommt man nur das Anmeldefeld zu sehen.
//
// Im Code steht nur ein Prüfwert, nicht das Passwort selbst.
// Neues Passwort: Claude fragen (der Prüfwert wird daraus neu berechnet, alte Anmeldungen werden ungültig).
//
// Wichtig: Das Repo auf GitHub ist öffentlich. Die Inhalte des Dashboards
// (src/content/dashboard.json) kann dort jeder lesen, der danach sucht.
// Das Passwort hält Besucher der Website fern, mehr nicht. Also keine Kundennamen,
// Zahlen oder Zugangsdaten ins Dashboard schreiben.

const SALT = 'doktura-team-v1';
const ITERATIONS = 150000;
// SHA-256 des abgeleiteten Schlüssels (PBKDF2) aus dem Passwort
const PRUEFWERT = 'df3f7f2102a6429ba354548e37afef5094bd9d41052a1c8db0b0cb920cca8daf';
const COOKIE = 'dk_team';
const LAUFZEIT_TAGE = 90;

const enc = new TextEncoder();
const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function schluessel(passwort: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(passwort), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(SALT), iterations: ITERATIONS, hash: 'SHA-256' }, key, 256);
  return hex(bits);
}

async function gueltig(token: string | undefined | null): Promise<boolean> {
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return false;
  return hex(await crypto.subtle.digest('SHA-256', enc.encode(token))) === PRUEFWERT;
}

function cookieLesen(request: Request): string | null {
  const raw = request.headers.get('cookie') ?? '';
  for (const teil of raw.split(';')) {
    const [k, ...v] = teil.trim().split('=');
    if (k === COOKIE) return v.join('=');
  }
  return null;
}

const SCHUTZ_HEADER = {
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Cache-Control': 'private, no-store',
  'Referrer-Policy': 'no-referrer',
};

function anmeldeSeite(fehler: boolean, status = 200): Response {
  const html = `<!doctype html>
<html lang="de"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Team-Bereich | Doktura</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>
  *{box-sizing:border-box;margin:0}
  body{min-height:100vh;display:grid;place-items:center;padding:1.5rem;background:#23052f;color:#f0edf6;
    font-family:'Segoe UI',system-ui,-apple-system,sans-serif;
    background-image:radial-gradient(60rem 40rem at 80% -10%,rgb(191 158 93 / .18),transparent 60%)}
  main{width:100%;max-width:24rem}
  img{display:block;width:10rem;margin-bottom:2.5rem}
  p.k{font-size:.8125rem;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#bf9e5d;margin-bottom:.75rem}
  h1{font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:2.25rem;line-height:1.1;margin-bottom:2rem}
  label{display:block;font-size:.9375rem;color:#c9c6e2;margin-bottom:.5rem}
  input{width:100%;font:inherit;font-size:1.0625rem;padding:.875rem 1rem;border-radius:2px;border:1px solid #4a2d5a;background:#2f1240;color:#f0edf6}
  input:focus{outline:2px solid #bf9e5d;outline-offset:1px}
  button{margin-top:1rem;width:100%;min-height:3.25rem;font:inherit;font-weight:600;color:#23052f;background:#bf9e5d;border:0;border-radius:2px;cursor:pointer}
  button:hover{background:#d4b77c}
  .f{margin-top:1rem;color:#f2b8b5;font-size:.9375rem}
</style></head>
<body><main>
  <img src="/logo/doktura-logo-hell.svg" alt="Doktura" onerror="this.remove()">
  <p class="k">Intern</p>
  <h1>Team-Dashboard</h1>
  <form method="post" action="/team">
    <label for="pw">Passwort</label>
    <input id="pw" name="passwort" type="password" autocomplete="current-password" required autofocus>
    <button type="submit">Anmelden</button>
    ${fehler ? '<p class="f" role="alert">Das Passwort stimmt nicht.</p>' : ''}
  </form>
</main></body></html>`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', ...SCHUTZ_HEADER } });
}

export default async (request: Request, context: { next: () => Promise<Response> }) => {
  const url = new URL(request.url);

  if (request.method === 'POST') {
    let passwort = '';
    try { passwort = String((await request.formData()).get('passwort') ?? ''); } catch { /* leer */ }
    const token = passwort ? await schluessel(passwort) : '';
    if (await gueltig(token)) {
      return new Response(null, {
        status: 303,
        headers: {
          Location: '/team',
          'Set-Cookie': `${COOKIE}=${token}; Path=/; Max-Age=${LAUFZEIT_TAGE * 86400}; HttpOnly; Secure; SameSite=Lax`,
          ...SCHUTZ_HEADER,
        },
      });
    }
    return anmeldeSeite(true, 401);
  }

  if (url.searchParams.has('abmelden')) {
    return new Response(null, {
      status: 303,
      headers: { Location: '/team', 'Set-Cookie': `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`, ...SCHUTZ_HEADER },
    });
  }

  if (await gueltig(cookieLesen(request))) {
    const res = await context.next();
    const out = new Response(res.body, res);
    for (const [k, v] of Object.entries(SCHUTZ_HEADER)) out.headers.set(k, v);
    return out;
  }

  return anmeldeSeite(false);
};

export const config = { path: ['/team', '/team.html', '/team/*'] };
