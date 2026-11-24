# Senpai Tattoo Studio

Sito one-page in Astro.

## Avvio in locale
```
npm install
npm run dev      # http://localhost:4321
npm run build    # crea la cartella dist/ da pubblicare
```

## Modificare i contenuti
- **Testi, artisti, stili, contatti, P.IVA, Instagram**: `src/data/site.ts`
- **Foto dei lavori**: metti i file in `src/assets/gallery/` (jpg, png, webp). Sono mostrati in ordine di nome. Un file con lo stesso nome di un segnaposto (es. `01.jpg`) lo sostituisce e mantiene la didascalia.
- **Foto degli artisti**: `src/assets/artists/<slug>.jpg`, con slug `nicole`, `samuele`, `m3ltdwn`, `emanuele`
- Le foto vengono ridimensionate e convertite in WebP in automatico durante la build.

## Pubblicazione (Netlify)
1. Carica il progetto su GitHub.
2. Su Netlify: *Add new site → Import from Git*, scegli il repository. Build command `npm run build`, cartella `dist`.
3. Quando c'è il dominio: aggiungilo in Netlify (*Domain management*) e decommenta `site` in `astro.config.mjs`.
