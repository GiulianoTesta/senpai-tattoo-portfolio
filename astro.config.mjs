import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.senpaitattoo.it', // dominio su GitHub Pages: deve coincidere con public/CNAME
  build: {
    inlineStylesheets: 'always',
  },
  // three.js (scena del capitolo 4) è un chunk unico da ~560 kB (~140 kB gzip), caricato solo vicino alla sezione
  vite: { build: { chunkSizeWarningLimit: 600 } },
});
