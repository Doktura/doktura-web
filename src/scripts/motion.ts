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
