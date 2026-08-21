# Andrej Creatives — sajt

Statički sajt (čist HTML/CSS/JS, bez frameworka i bez build koraka), spreman da ide direktno na Vercel.

## Struktura fajlova

```
index.html    → sav sadržaj i sekcije
styles.css    → dizajn (boje, tipografija, layout, animacije)
script.js     → interaktivnost (meni, scroll animacije, video lightbox, forma)
```

## Pre nego što objaviš — zameni placeholder podatke

Ovo su jedina mesta koja moraš da izmeniš pre lansiranja:

1. **Email** — postavljen na `creativesbyandrej@gmail.com` (u `index.html` i `script.js`). Menjaš ga na isti način ako se ikad promeni — Find & Replace.
2. **Video snimci u Work sekciji** — trenutno su kartice prazne (samo placeholder "waveform" grafika). Za svaki `<article class="work-card">` u `index.html`:
   - Postavi svoj eksportovani MP4 fajl negde u projekat (npr. u folder `videos/`)
   - Upiši putanju u `data-video="videos/ime-fajla.mp4"`
   - Klik na karticu će automatski otvoriti video u lightbox-u
   - Ako želiš da koristiš YouTube/Vimeo umesto lokalnog fajla, uputstvo je u komentaru na vrhu `script.js` (deo o video lightbox-u)
4. **Naslovi/opisi projekata** — tekst pored svake kartice (`<h3>` i `<p class="mono">`), po potrebi izmeni ili dodaj/obriši kartice.

## Pregled sajta lokalno

Nije obavezno, ali ako želiš da vidiš sajt pre deploya:

```bash
cd andrej-creatives
python3 -m http.server 5500
```

Zatim otvori `http://localhost:5500` u browseru. (Ili samo dupli klik na `index.html` — sajt nema build korak, radi i tako, mada je lokalni server bolji jer neki browseri blokiraju video/fetch pozive sa `file://`.)

## Deploy na Vercel

**Opcija A — preko GitHub-a (preporučeno, automatski redeploy pri svakoj izmeni):**

1. Napravi novi repo na GitHub-u i push-uj ovaj folder:
   ```bash
   cd andrej-creatives
   git init
   git add .
   git commit -m "Andrej Creatives — initial site"
   git branch -M main
   git remote add origin https://github.com/TVOJ-USERNAME/andrej-creatives.git
   git push -u origin main
   ```
2. Idi na [vercel.com](https://vercel.com) → **Add New Project** → izaberi taj repo.
3. Framework Preset ostavi na **Other** (nema build korak, nema build command, output directory je `.` / root).
4. Klikni **Deploy** — gotovo za manje od minuta.

**Opcija B — Vercel CLI (najbrže, bez GitHub-a):**

```bash
npm i -g vercel
cd andrej-creatives
vercel
```

Prati uputstva u terminalu — Vercel će te pitati za ime projekta i odmah dati link.

Kasnije, za produkcijski deploy: `vercel --prod`

## Custom domen

Nakon prvog deploya, u Vercel dashboard-u: **Project → Settings → Domains** → dodaj svoj domen (npr. `andrejcreatives.com`) i prati DNS uputstva.

## Šta ako želiš da forma za kontakt šalje mejlove "tiho" (bez otvaranja mail app-a)

Trenutno forma pravi `mailto:` link — radi bez ikakvog servera, ali otvara korisnikov mejl klijent. Za profesionalniji tok bez otvaranja mail app-a:

1. Napravi nalog na [formspree.io](https://formspree.io) (besplatan plan je dovoljan za početak)
2. Dobićeš endpoint URL
3. U `script.js`, u delu za `contactForm`, zameni `mailto:` logiku sa `fetch()` POST pozivom ka tom endpoint-u (uputstvo je i u komentaru iznad te funkcije)

## Dizajn sistem — na brzinu

- **Boje**: skoro isključivo crno/belo (`--black`, `--white`, plus par sivih tonova) — namerno, da jedina "boja" na sajtu dolazi od samih video radova kad ih ubaciš.
- **Fontovi**: Instrument Serif za naslove (tvoj "CBA" monogram stil), Inter za tekst/UI.
- **"Timecode" oznake** (00:00:04:12 itd.) su stilizovane kao editorski workflow — nisu stvarno trajanje klipova, već dekorativni marker kroz sekcije.

Sve boje, razmaci i fontovi su definisani kao CSS varijable na vrhu `styles.css` (`:root { ... }`) — menjaš na jednom mestu, reflektuje se svuda.
