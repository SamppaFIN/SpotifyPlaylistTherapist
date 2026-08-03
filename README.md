# 🎧 SpotifyPlaylistTherapist

> Hae Spotify-soittolista ja tee sen biiseistä psykoanalyysi — tunnetilat, persoonallisuuspiirteet, toistuvat teemat.

**Status:** 🟡 Suunnitteluvaihe (MVP 0.1.0)

---

## Idea

Mitä soittolistasi kertoo sinusta? SpotifyPlaylistTherapist analysoi soittolistasi biisit:

- **Audio Features** (valence, energy, danceability, tempo, jne.) → tunnetilaprofiili
- **Lyriikat** (Genius API) → sentiment, teemat, avainsanat
- **Psykologinen yhteenveto** → persoonallisuusarviot (Big Five), hallitsevat tunnetilat, Freud-tyylinen analyysi

Kaikki tämä yhdellä klikkauksella — ja ripauksella huumoria.

---

## Tech Stack

| Kerros | Teknologia |
|--------|-----------|
| Frontend | Single-file HTML/CSS/JS (Vanilla, GitHub Pages) |
| Auth | Spotify OAuth 2.0 PKCE |
| API:t | Spotify Web API, Genius API, OpenAI |
| NLP/LLM | GPT-4o-mini (analyysin generointi) |
| Testit | Vitest + Playwright |

---

## Kansiorakenne

```
SpotifyPlaylistTherapist/
├── claude.md              # Projektitiedosto (AI:n ohjeet)
├── public/                # GitHub Pages -juuri
│   └── demo.html          # Single-file SPA
├── src/                   # TypeScript
│   ├── spotify/           # Spotify API -integraatio
│   ├── analyze/           # Analyysimoottorit
│   └── engine/            # Raportin generointi
└── .github/workflows/     # CI/CD
```

---

## Kehitys

```bash
# Asenna riippuvuudet
npm install

# Aja testit
npm test

# Aja demo (Express mock-server)
npm run demo
```

---

*"Tell me what you listen to, and I'll tell you who you are."* — 🎧 Psyko
