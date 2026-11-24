import { defineConfig } from 'astro/config';

export default defineConfig({
  // site: 'https://www.senpaitattoo.it', // da attivare quando c'è il dominio (serve per canonical e anteprime social)
  build: { inlineStylesheets: 'always' },
});
