// Demo-palvelin — tarjoilee public/-kansion staattiset tiedostot
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const app = express();
app.use(express.static(publicDir));

const PORT = 5555;

app.listen(PORT, () => {
  console.log(`🎧 Psyko kuuntelee → http://localhost:${PORT}/demo.html`);
  console.log(`   Staattiset tiedostot: ${publicDir}`);
});
