// Bewegung: weiches Scrollen, Einblenden beim Scrollen, Lichtkegel auf Karten.
// Bei „reduzierter Bewegung“ im Betriebssystem bleibt alles still und sofort sichtbar.
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- Weiches Scrollen (nur Maus/Trackpad; Touch bleibt nativ) ----
if (!reduce) {
  new Lenis({ autoRaf: true, lerp: 0.1, anchors: { offset: -80 } });
}

// ---- Einblenden beim Scrollen ----
const items = document.querySelectorAll('.reveal, .reveal-media');
if ('IntersectionObserver' in window && !reduce) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.15 },
  );
  items.forEach((el) => io.observe(el));
} else {
  items.forEach((el) => el.classList.add('is-visible'));
}

// ---- Video-Loops: erst laden, wenn sie ins Bild kommen; außerhalb pausieren ----
const saveData = (navigator as any).connection?.saveData === true;
const narrow = matchMedia('(max-width: 47.99rem)').matches;
const loops = document.querySelectorAll<HTMLVideoElement>('video[data-loop]');
loops.forEach((v) => {
  if (narrow && v.dataset.posterMobile) v.poster = v.dataset.posterMobile;
});
if (!reduce && !saveData && 'IntersectionObserver' in window) {
  const start = (v: HTMLVideoElement) => {
    if (!v.src) v.src = (narrow && v.dataset.srcMobile) || v.dataset.src || '';
    v.play().catch(() => {});
  };
  const vio = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        const v = e.target as HTMLVideoElement;
        if (e.isIntersecting) start(v);
        else if (!v.paused) v.pause();
      });
    },
    { rootMargin: '200px 0px' },
  );
  loops.forEach((v) => {
    if ('eager' in v.dataset) start(v);
    vio.observe(v);
  });
}

// ---- Lichtkegel folgt der Maus (Karten mit [data-spotlight]) ----
if (!reduce && matchMedia('(hover: hover)').matches) {
  document.querySelectorAll<HTMLElement>('[data-spotlight]').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--x', `${e.clientX - r.left}px`);
      card.style.setProperty('--y', `${e.clientY - r.top}px`);
    });
  });
}

// ---- Karten zum Wischen (Handy): Fortschrittsbalken unter der Reihe ----
document.querySelectorAll<HTMLElement>('[data-carousel]').forEach((row) => {
  const bar = row.parentElement?.querySelector<HTMLElement>('[data-carousel-bar]');
  if (!bar) return;
  const update = () => {
    const max = row.scrollWidth - row.clientWidth;
    const visible = row.clientWidth / row.scrollWidth;
    const p = max > 0 ? visible + (1 - visible) * (row.scrollLeft / max) : 1;
    bar.style.setProperty('--progress', p.toFixed(3));
  };
  row.addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();
});

// ---- Reiter (z. B. Phasen): ohne JavaScript sind alle Inhalte sichtbar ----
document.querySelectorAll<HTMLElement>('[data-tabs]').forEach((box) => {
  const tabs = [...box.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const panels = [...box.querySelectorAll<HTMLElement>('[role="tabpanel"]')];
  const select = (i: number, focus = false) => {
    tabs.forEach((t, j) => {
      const on = i === j;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      panels[j].hidden = !on;
    });
    if (focus) tabs[i].focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i));
    t.addEventListener('keydown', (e) => {
      const n = tabs.length;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); select((i + 1) % n, true); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); select((i - 1 + n) % n, true); }
    });
  });
  box.classList.add('tabs-ready');
  select(0);
});

// ---- Handy: fester Termin-Button, sobald der Hero aus dem Bild ist (aus beim Kontaktbereich) ----
const sticky = document.querySelector<HTMLElement>('[data-sticky-cta]');
const heroEl = document.querySelector('.hero');
const contactEl = document.getElementById('kontakt');
if (sticky && heroEl && 'IntersectionObserver' in window) {
  let heroVisible = true;
  let contactVisible = false;
  const set = () => sticky.classList.toggle('is-shown', !heroVisible && !contactVisible);
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; set(); }).observe(heroEl);
  if (contactEl) new IntersectionObserver(([e]) => { contactVisible = e.isIntersecting || e.boundingClientRect.top < 0; set(); }).observe(contactEl);
}
