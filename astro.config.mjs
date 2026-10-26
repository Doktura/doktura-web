import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// SITE_URL: die Live-Domain.
const SITE_URL = 'https://doktura.de';

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'never',
  build: { format: 'file', inlineStylesheets: 'auto' },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/styleguide') && !page.includes('/danke') && !page.includes('/404'),
    }),
  ],
});
