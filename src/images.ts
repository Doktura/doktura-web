// Bilder, die im Redaktionssystem (doktura.de/admin → „Bilder“) austauschbar sind.
// Das CMS speichert Pfade wie "/src/assets/images/foto.jpg" in src/content/bilder.json;
// hier wird daraus ein Astro-Bild, das beim Bauen automatisch verkleinert und als AVIF/WebP ausgeliefert wird.
import type { ImageMetadata } from 'astro';
import bilder from './content/bilder.json';

const all = import.meta.glob<{ default: ImageMetadata }>('/src/assets/images/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP}', { eager: true });

function pick(path: string | undefined, fallback: string): ImageMetadata {
  const norm = (p: string) => '/' + p.replace(/^\/+/, '');
  const hit = path ? all[norm(path)] : undefined;
  if (path && !hit) console.warn(`[bilder] ${path} nicht gefunden – nutze ${fallback}`);
  return (hit ?? all[fallback]).default;
}

export const images = {
  portrait: pick(bilder.portrait, '/src/assets/images/zamin-portrait.jpg'),
  portraitAlt: bilder.portraitAlt || 'Zamin Köhler, Gründer von Doktura',
  avatar: pick(bilder.avatar, '/src/assets/images/zamin-avatar.jpg'),
  vorschaubild: pick(bilder.vorschaubild, '/src/assets/images/og-image.jpg'),
};
