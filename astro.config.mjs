import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.senpaitattoo.it', // dominio su GitHub Pages: deve coincidere con public/CNAME
  build: {
    inlineStylesheets: 'always',
  },
});
