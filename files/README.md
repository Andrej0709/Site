# Andrej Creatives — sajt

Statički sajt (čist HTML/CSS/JS, bez frameworka i bez build koraka), spreman da ide direktno na Vercel.

## Struktura fajlova

```
index.html    → sav sadržaj i sekcije
styles.css    → dizajn (boje, tipografija, layout, animacije)
script.js     → interaktivnost (meni, scroll animacije, video lightbox, forma)
```

## Video hosting — zašto MP4 fajlovi ne idu u git

GitHub odbija bilo koji fajl preko 100MB (tvoji exportovani video snimci lako pređu tu granicu). Zato `.gitignore` isključuje `videos/*.mp4` — git prati samo kod i thumbnail slike, a sami video fajlovi žive na spoljnom storage-u.

**Preporuka: Cloudflare R2** — besplatno do 10GB/mesec skladišta, i bitno: **bez naplate za bandwidth** (za razliku od AWS S3), što je važno kad video fajlove ljudi gledaju/skidaju direktno.

1. Napravi nalog na [dash.cloudflare.com](https://dash.cloudflare.com) → R2 → Create Bucket
2. Uploaduj svoje MP4 fajlove u bucket
3. U bucket Settings → Public Access → uključi "Public Development URL" (daje ti `pub-xxxxx.r2.dev` link, bez potrebe za custom domenom)
4. Za svaki video, kopiraj njegov public URL i zameni u `index.html`: `data-video="videos/ime.mp4"` → `data-video="https://pub-xxxxx.r2.dev/ime.mp4"`

Sve ostalo (lightbox, klik-za-play) radi identično — samo je putanja sad puni URL umesto lokalne.

## Pre nego što objaviš — zameni placeholder podatke

Ovo su jedina mesta koja moraš da izmeniš pre lansiranja:

1. **Email** — postavljen na `creativesbyandrej@gmail.com` (u `index.html` i `script.js`). Menjaš ga na isti način ako se ikad promeni — Find & Replace.
2. **Video snimci u Work sekciji** — trenutno su kartice prazne (samo placeholder "waveform" grafika). Za svaki `<article class="work-card">` u `index.html`:
   - Postavi svoj eksportovani MP4 fajl negde u projekat (npr. u folder `videos/`)
   - Upiši putanju u `data-video="videos/ime-fajla.mp4"`
   - Klik na karticu će automatski otvoriti video u lightbox-u
   - Ako želiš da koristiš YouTube/Vimeo umesto lokalnog fajla, uputstvo je u komentaru na vrhu `script.js` (deo o video lightbox-u)
4. **Naslovi/opisi projekata** — tekst pored svake kartice (`<h3>` i `<p class="mono">`), po potrebi izmeni ili dodaj/obriši kartice.
5. **Vertikalni (9:16) video** — kartica sa klasom `work-card work-card--vertical` u `.work-extra` bloku je za TikTok/Reels/Shorts-format sadržaj. Radi na isti način kao ostale kartice (`data-video="videos/ime.mp4"`), samo joj je thumbnail 9:16 umesto 16:9 (definisano u `styles.css` preko `.work-card--vertical .work-thumb`), pa lepo sedne pored jedne standardne kartice bez razvlačenja reda. Ako dodaš još jednu vertikalnu karticu, samo kopiraj taj isti `<article>` blok — obe će stati jedna pored druge u `.work-extra` gridu.

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

- **Boje**: baza je i dalje crno/belo (`--black`, `--white`, sivi tonovi), ali sad postoje tri signature akcentne boje inspirisane klasičnim "teal & orange" color grading-om: `--teal` (#22D3C6), `--amber` (#FF7A45) i `--violet` (#9B87F5, koristi se ređe, za varijaciju). Koriste se kao gradient na "hire me" dugmadima, ambijentalni sjaj iza tamnih sekcija, tačkica ispred svakog "timecode" naslova, i akcentna boja po kartici u Work/Services/About sekcijama — namerno suzdržano, ne kao pune boje po celoj pozadini.
- Sve "Start a Project" / "Send Message" dugmad koriste `.btn-gradient` klasu — to je vizuelni signal kroz ceo sajt da je to akcija za kontakt/hire.
- Sitan filmski "grain" preko cele stranice (čist CSS/SVG, bez slike, ne utiče na brzinu učitavanja).
- **Fontovi**: Instrument Serif za naslove (tvoj "CBA" monogram stil), Inter za tekst/UI.
- **"Timecode" oznake** (00:00:04:12 itd.) su stilizovane kao editorski workflow — nisu stvarno trajanje klipova, već dekorativni marker kroz sekcije.

Sve boje, razmaci i fontovi su definisani kao CSS varijable na vrhu `styles.css` (`:root { ... }`) — menjaš na jednom mestu, reflektuje se svuda. Ako želiš da promeniš akcentne boje, menjaš samo `--teal` / `--amber` / `--violet` na vrhu fajla.

## Kontakt forma

Forma sad šalje submit tiho preko `fetch()` ka Formspree endpoint-u iz `action=""` atributa (bez otvaranja mail app-a, bez napuštanja stranice) — status poruka se ispisuje ispod dugmeta. Ako ikad promeniš Formspree endpoint, samo izmeni `action=""` u `index.html`, JS ga čita automatski.
