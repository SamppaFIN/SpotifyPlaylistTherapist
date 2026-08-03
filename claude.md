# 🎧 SpotifyPlaylistTherapist — claude.md

> Projektitiedosto. Tätä lukemalla AI (Psyko) tietää mikä projekti on kyseessä, missä vaiheessa ollaan ja mitä tehdään seuraavaksi.

---

## 1. Identiteetti (AI:n rooli)

```json
{
  "kutsumanimi": "Psyko",
  "ikoni": "🎧",
  "malli": "DeepSeek V4 Pro",
  "alusta": "GitHub Copilot (VS Code)",
  "projektin_omistaja": "Infinite",
  "kieli": ["suomi", "englanti"],
  "luonne": ["suorapuheinen", "utelias", "rehellinen", "analyttinen"]
}
```

---

## 2. Projektin metadata

```json
{
  "projekti": "SpotifyPlaylistTherapist",
  "versio": "0.1.0-MVP",
  "kuvaus": "Hae Spotify-soittolista ja tee sen biiseistä psykoanalyysi — tunnetilat, persoonallisuuspiirteet, teemat.",
  "tila": "demo_valmis"
}
```

---

## 3. Epicit & tiketit (MVP)

```json
{
  "epicit": [
    {
      "id": "perusta",
      "nimi": "📡 Data Foundation — Spotify API",
      "tiketit": [1, 2],
      "valmius": 100
    },
    {
      "id": "analyysi",
      "nimi": "🧠 Psykoanalyysimoottori",
      "tiketit": [3, 4],
      "valmius": 100
    },
    {
      "id": "demo",
      "nimi": "🖥️ Demo-UI & visualisointi",
      "tiketit": [5, 6],
      "valmius": 100
    },
    {
      "id": "deploy",
      "nimi": "🚀 Deploy & infra",
      "tiketit": [7],
      "valmius": 100
    }
  ],
  "tiketit": [
    {
      "id": 1,
      "epic": "perusta",
      "nimi": "Spotify API -autentikointi (OAuth 2.0 PKCE)",
      "effort": "M",
      "riippuvuudet": [],
      "status": "done",
      "user_story": "Käyttäjänä haluan kirjautua Spotify-tunnuksillani, jotta voin antaa soittolistani analysoitavaksi ilman erillistä rekisteröitymistä.",
      "acceptance_criteria": [
        "Käyttäjä voi kirjautua Spotify-tunnuksilla",
        "Access token ja refresh token tallennetaan turvallisesti",
        "Token refresh toimii automaattisesti"
      ],
      "valmius": 100
    },
    {
      "id": 2,
      "epic": "perusta",
      "nimi": "Soittolistan haku ja biisien metadata",
      "effort": "M",
      "riippuvuudet": [1],
      "status": "done",
      "user_story": "Käyttäjänä haluan selata soittolistojani ja valita yhden analysoitavaksi, jotta näen mitä musiikkimakuni kertoo minusta.",
      "acceptance_criteria": [
        "Käyttäjä voi hakea omia soittolistojaan",
        "Soittolistan kaikki biisit haetaan (pagination)",
        "Jokaisesta biisistä: nimi, artisti, albumi, kesto, genre, popularity, valence, energy, danceability, tempo, key, mode, loudness, speechiness, acousticness, instrumentalness, liveness"
      ],
      "valmius": 100
    },
    {
      "id": 3,
      "epic": "analyysi",
      "nimi": "Audio Features -analyysi (Spotify Audio Features API)",
      "effort": "S",
      "riippuvuudet": [2],
      "status": "done",
      "user_story": "Käyttäjänä haluan että soittolistani biiseistä lasketaan audio-ominaisuudet (energia, tanssittavuus, valence…), jotta analyysi perustuu dataan eikä mutuun.",
      "acceptance_criteria": [
        "Haetaan audio-features jokaiselle biisille",
        "Lasketaan soittolistan keskiarvot: valence, energy, danceability, tempo, jne.",
        "Tunnistetaan poikkeamat ja ääripäät"
      ],
      "valmius": 100
    },
    {
      "id": 4,
      "epic": "analyysi",
      "nimi": "Psykoanalyysimoottori — tunnetila- ja persoonallisuusprofiili",
      "effort": "L",
      "riippuvuudet": [3],
      "status": "done",
      "user_story": "Käyttäjänä haluan että ulkoinen tekoäly (OpenAI GPT-4o-mini) analysoi soittolistani ja kertoo suoraan kuinka hullu olen — mitkä tunnetilat hallitsevat, mitä persoonallisuuspiirteitä biisit paljastavat, mitkä teemat toistuvat pakkomielteisesti, ja mihin Freudin vaiheeseen olen jämähtänyt.",
      "acceptance_criteria": [
        "Valence + energy → tunnetilakartta (Russell's Circumplex)",
        "Biisien sanoitukset haetaan (Genius API tai vastaava)",
        "Lyriikoista NLP: sentiment, teemat, avainsanat",
        "Koostetaan 'psykologinen profiili': hallitsevat tunnetilat, persoonallisuuspiirteet (Big Five -arvio), toistuvat teemat",
        "Generoidaan luonnollisen kielen yhteenveto (OpenAI / LLM)"
      ],
      "valmius": 100
    },
    {
      "id": 5,
      "epic": "demo",
      "nimi": "Demo-UI — Single-File SPA (GitHub Pages)",
      "effort": "M",
      "riippuvuudet": [4],
      "status": "done",
      "user_story": "Käyttäjänä haluan nähdä analyysin visuaalisesti — tunnetilakartan, persoonallisuusprofiilin ja selkokielisen 'diagnoosin' — jotta voin jakaa tuloksen kavereille ja todistaa että olen yhtä sekaisin kuin soittolistani.",
      "acceptance_criteria": [
        "Single-file HTML/CSS/JS SPA ilman build-steppiä",
        "Spotify-login, soittolistan valinta, analyysinäkymä",
        "Tunnetilakartta (scatter plot, valence × energy)",
        "Profiilikortti (persoonallisuusarviot, top-teemat)",
        "OKLCH-värit, clamp-typografia, mobiiliresponsiivinen"
      ],
      "valmius": 100
    },
    {
      "id": 6,
      "epic": "demo",
      "nimi": "Mock-data & fallback (ilman backendia)",
      "effort": "S",
      "riippuvuudet": [],
      "status": "done",
      "user_story": "Käyttäjänä haluan kokeilla demoa ilman Spotify-tunnuksia, jotta näen heti mistä on kyse — 'näytä esimerkki psykoanalyysistä ennen kuin paljastan oman soittolistani'.",
      "acceptance_criteria": [
        "Realistinen mock-data vähintään 3 eri soittolistaprofiilista",
        "Demo toimii GitHub Pagesissa ilman backendia (FALLBACK-data)",
        "Mock-datalla voi esitellä kaikki näkymät"
      ],
      "valmius": 100
    },
    {
      "id": 7,
      "epic": "deploy",
      "nimi": "GitHub Pages -deploy & CI",
      "effort": "S",
      "riippuvuudet": [5],
      "status": "done",
      "user_story": "Käyttäjänä haluan että demo on julkisessa URL-osoitteessa, jotta voin lähettää sen kaverille ja kysyä 'arvaa kenen soittolista — ja kuinka pihalla tää tyyppi on?'.",
      "acceptance_criteria": [
        "GitHub Actions workflow: push → deploy gh-pages",
        "README.md kuntoon",
        "Demo toimii julkisessa URL:ssa"
      ],
      "valmius": 100
    }
  ]
}
```

---

## 4. Response Protocol (Käyttäytymissäännöt AI:lle)

```
─────────────────────────────────────────
Call #N | Confidence: XX%
─────────────────────────────────────────
🟢 CLEAR (facts, confirmed by context or codebase)
  - ...
🟡 ASSUMED (reasonable guesses — flag these)
  - ...
🔴 NEEDS CLARIFICATION (blockers — ask before proceeding)
  - ...
🃏 JOKERI (free thoughts, humor, sarcasm)
  - ...
─────────────────────────────────────────
```

**Säännöt:**
- Confidence > 90% → vaatimukset selkeät, etene
- 70–89% → pieniä epäselvyyksiä, mainitse oletukset
- 50–69% → merkittäviä oletuksia, etene varoen
- < 50% → pysähdy ja kysy
- Jos 🔴 ei ole tyhjä ja confidence < 70% → älä koodaa, kysy ensin

**Koodaussäännöt:**
1. **Think before coding** — älä oleta, tuo kompromissit esiin
2. **Simplicity first** — minimaalinen koodi, ei spekulatiivista
3. **Surgical changes** — koske vain mitä on pakko
4. **Goal-driven** — monivaiheisille: suunnitelma → verify → toteuta

---

## 5. Projektin kansiorakenne

```
SpotifyPlaylistTherapist/
├── claude.md              # Tämä tiedosto
├── .gitignore             # node_modules, dist, .env, *.log
├── README.md
├── public/                # GitHub Pages -juuri
│   └── demo.html          # Single-file SPA (FALLBACK-data sisällä)
├── src/                   # Tuotantokoodi (TypeScript)
│   ├── spotify/           # Spotify API -integraatio
│   │   ├── auth.ts        # OAuth 2.0 PKCE flow
│   │   ├── playlists.ts   # Soittolistojen haku
│   │   └── audio-features.ts  # Audio Features API
│   ├── analyze/           # Analyysimoottorit
│   │   ├── audio-profile.ts   # Audio features → profiili
│   │   ├── sentiment.ts       # Lyriikoiden NLP-analyysi
│   │   └── psycho-profile.ts  # Koostettu psykoanalyysi
│   ├── engine/            # Datan prosessointi
│   │   └── report.ts      # Raportin generointi
│   └── __tests__/         # Unit-testit
└── .github/workflows/     # CI/CD
    └── pages.yml          # GitHub Pages deploy
```

---

## 6. Tech Stack

| Kerros | Teknologia |
|--------|-----------|
| Frontend | Single-file HTML/CSS/JS (Vanilla, no framework) |
| Auth | Spotify OAuth 2.0 PKCE (client-side) |
| API | Spotify Web API (playlists, audio-features) |
| Lyrics | Genius API (tai vastaava) |
| NLP / LLM | OpenAI API (GPT-4o-mini) analyysin generointiin |
| Hosting | GitHub Pages (frontend), API:t kutsutaan selaimesta |
| Testit | Vitest (unit), Playwright (E2E) |

---

## 7. API-avaimet & ympäristömuuttujat

Kehityksessä tarvittavat:
- `SPOTIFY_CLIENT_ID` — Spotify Developer Dashboard
- `GENIUS_ACCESS_TOKEN` — Genius API
- `OPENAI_API_KEY` — OpenAI (analyysin generointiin)

**HUOM:** Koska kyseessä on client-side SPA, API-avaimia EI upoteta koodiin. Spotify-auth käyttää PKCE-flowta (ei client secretiä). OpenAI-kutsut proxy-palvelimen kautta tai käyttäjä antaa oman avaimen.

