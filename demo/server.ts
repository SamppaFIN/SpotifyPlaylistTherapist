// Demo-palvelin — tarjoilee public/-kansion staattiset tiedostot
// + Spotify API -proxy (kiertää CORS/403-ongelmat selaimessa)
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const app = express();
app.use(express.json());
app.use(express.static(publicDir));

// Spotify API -proxy
// Käyttö: POST /api/spotify { path: "/playlists/ID/tracks", token: "..." }
app.post('/api/spotify', async (req, res) => {
  const { path, token } = req.body;
  if (!path || !token) {
    return res.status(400).json({ error: 'path ja token vaaditaan' });
  }
  try {
    const apiRes = await fetch(`https://api.spotify.com/v1${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await apiRes.json();
    res.status(apiRes.status).json(data);
  } catch (err) {
    res.status(502).json({ error: 'Spotify API -virhe', detail: String(err) });
  }
});

const PORT = 5555;

app.listen(PORT, () => {
  console.log(`🎧 Psyko kuuntelee → http://localhost:${PORT}/demo.html`);
  console.log(`   Spotify API -proxy: POST /api/spotify`);
  console.log(`   Staattiset tiedostot: ${publicDir}`);
});
