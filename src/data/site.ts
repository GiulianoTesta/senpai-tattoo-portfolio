// Tutti i contenuti del sito: modifica qui testi, artisti, stili e didascalie.

export const studio = {
  name: 'Senpai Tattoo Studio',
  tagline:
    'Studio di tatuaggi. Disegniamo sulla pelle come si disegna una tavola manga: linea decisa, retino, inchiostro che resta.',
  days: 'Lun — Sab',
  hours: '10:30 — 19:30',
  address: 'Via degli Studi 5',
  city: 'Paternò (CT)',
  postalCity: 'Paternò',
  region: 'CT',
  email: 'senpaitattoostudio@gmail.com',
  phone: '+393522635018',
  phoneLabel: '352 263 5018',
  instagram: '', // es. 'https://instagram.com/senpai.tattoo' (vuoto = nascosto)
  vat: '', // P.IVA da inserire (obbligatoria nel footer per legge)
};

// color = colore "personaggio" dell'artista (vedi --c-* in global.css)
// La foto si aggiunge mettendo src/assets/artists/<slug>.jpg
export const artists = [
  { slug: 'nicole', name: 'Nicole Bline', role: 'Anime · Fine line', glyph: '桜', color: 'lime', bubble: 'Anime e fine line: porta la tua vignetta preferita!', instagram: '' },
  { slug: 'samuele', name: 'Samuele Scuderi', role: 'Chicano', glyph: '薔', color: 'orange', bubble: 'Chicano: lettering, rose e chiaroscuro.', instagram: '' },
  { slug: 'm3ltdwn', name: 'M3ltdwn', role: 'Handpoke', glyph: '点', color: 'rose', bubble: 'Handpoke: punto dopo punto, senza macchinetta.', instagram: '' },
  { slug: 'emanuele', name: 'Emanuele Romano', role: 'Realistico', glyph: '眼', color: 'blue', bubble: 'Realistico: ritratti e dettagli che sembrano foto.', instagram: '' },
];

export const styles = [
  { name: 'Anime', glyph: '星', color: 'lime', desc: 'Personaggi e scene dai tuoi anime e manga, fedeli al tratto originale.', artist: 'Nicole Bline' },
  { name: 'Fine line', glyph: '桜', color: 'violet', desc: 'Linea sottile e piccoli formati, ideale per il primo tatuaggio.', artist: 'Nicole Bline' },
  { name: 'Chicano', glyph: '薔', color: 'orange', desc: 'Lettering, rose, ritratti in bianco e nero con sfumature morbide.', artist: 'Samuele Scuderi' },
  { name: 'Handpoke', glyph: '点', color: 'rose', desc: 'Tatuaggio a mano, punto per punto, senza macchinetta.', artist: 'M3ltdwn' },
  { name: 'Realistico', glyph: '眼', color: 'blue', desc: 'Ritratti, animali e soggetti fotografici con dettaglio estremo.', artist: 'Emanuele Romano' },
];

export const process = [
  { name: 'Bozza', note: 'Schizzo libero: composizione e proporzioni studiate sul tuo corpo.' },
  { name: 'Stencil', note: 'Lo stencil viola si trasferisce sulla pelle. Si può ancora spostare.' },
  { name: 'Linework', note: 'La linea principale, una passata sola. Il momento in cui il tatuaggio diventa tuo.' },
  { name: 'Ombre a retino', note: 'Ombre puntinate come in una tavola stampata.' },
  { name: 'Colore', note: 'Colore pieno. Il sole rosso è sempre l\'ultima cosa che si stende.' },
  { name: 'Guarigione', note: 'Circa quattro settimane dopo: pelle guarita, colore stabile. Fine del capitolo.' },
];

// Galleria: le foto sono i file in src/assets/gallery (ordinati per nome).
// Per sostituire una foto basta un file con lo stesso nome (anche .png/.webp): la didascalia resta.
export const gallery: Record<string, string> = {
  '01': 'Anime · Nicole Bline',
  '02': 'Handpoke · M3ltdwn',
  '03': 'Realistico · Emanuele Romano',
  '04': 'Chicano · Samuele Scuderi',
  '05': 'Realistico · Emanuele Romano',
  '06': 'Chicano · Samuele Scuderi',
  '07': 'Anime · Nicole Bline',
  '08': 'Handpoke · M3ltdwn',
};
