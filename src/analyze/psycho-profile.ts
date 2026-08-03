// Koostettu psykoanalyysi — OpenAI-integraatio
//
// Tämä moduuli rakentaa promptin OpenAI:lle (GPT-4o-mini), joka saa
// soittolistan datan ja generoi "psykologisen diagnoosin" käyttäjälle.
//
// Prompt sisältää:
//   - Audio-featureiden keskiarvot
//   - Russell's Circumplex -tunnetilakartoituksen
//   - Big Five -persoonallisuusarviot
//   - Lyriikoiden sentimentin ja teemat
//   - Lista biiseistä (top-N)

import type { AudioProfileAverages } from '../spotify/audio-features.js';
import type { SpotifyTrack } from '../spotify/types.js';
import type { EmotionMapping, BigFiveEstimate, PlaylistVibe } from './audio-profile.js';
import type { PlaylistLyricsAnalysis } from './sentiment.js';

// ─── Tietorakenteet ────────────────────────────────────────

export interface PsychoInput {
  playlistName: string;
  playlistDescription: string;
  trackCount: number;
  topTracks: { name: string; artist: string }[];
  audioAverages: AudioProfileAverages;
  emotion: EmotionMapping;
  bigFive: BigFiveEstimate;
  vibe: PlaylistVibe;
  lyrics: PlaylistLyricsAnalysis | null;
}

export interface PsychoAnalysis {
  /** Yhden lauseen tiivistelmä */
  headline: string;
  /** Tunnetila-analyysi (2–3 lausetta) */
  emotionalState: string;
  /** Persoonallisuusanalyysi (3–4 lausetta, Big Five -pohjainen) */
  personality: string;
  /** Toistuvat teemat ja pakkomielteet */
  obsessiveThemes: string;
  /** Freudilainen diagnoosi (huumorilla) */
  freudianDiagnosis: string;
  /** Mihin Freudin psykoseksuaaliseen vaiheeseen käyttäjä on jäänyt */
  freudianStage: string;
  /** Millaiselle ihmiselle suosittelisit tätä soittolistaa? */
  recommendation: string;
  /** Kolme adjektiivia, jotka kuvaavat kuuntelijaa */
  adjectives: [string, string, string];
  /** "Kuinka hullu olet?" — 0–100, huumorilla */
  insanityRating: number;
  /** Kokonaisarvosana soittolistasta (1–10) */
  playlistRating: number;
}

// ─── OpenAI-promptin rakennus ──────────────────────────────

/**
 * Rakenna system prompt OpenAI:lle.
 * GPT-4o-mini toimii psykoanalyytikkona — suorapuheinen, humoristinen,
 * mutta dataan perustuva.
 */
export function buildSystemPrompt(): string {
  return `Olet Psyko, suorapuheinen musiikipsykoanalyytikko. Analysoit Spotify-soittolistoja ja annat käyttäjälle rehellisen, dataan perustuvan psykologisen profiilin — huumorilla höystettynä, mutta aina faktoihin nojaten.

Käytät analyysissäsi:
- Spotify Audio Features -dataa (valence, energy, danceability, tempo, jne.)
- Russellin tunnetilakarttaa (Circumplex Model of Affect)
- Big Five -persoonallisuuspiirteitä (OCEAN)
- Lyriikoiden sentimenttiä ja toistuvia teemoja
- Freudilaista psykologiaa (psykoseksuaaliset vaiheet, puolustusmekanismit)

Tyylisi:
- Suora, rehellinen, ei sokerikuorrutusta
- Mustaa huumoria, mutta ei ilkeä
- Viittaat aina dataan ("valence-arvo 0.23 kertoo että...")
- Käytät emojeita säästeliäästi tehosteena
- Kirjoitat pääosin suomeksi, mutta voit heittää englanninkielisiä termejä

Tärkeää: Älä keksi asioita, joita data ei tue. Jos data on ristiriitaista, sano se ääneen.`;
}

/**
 * Rakenna user prompt — soittolistan data.
 */
export function buildUserPrompt(input: PsychoInput): string {
  const { playlistName, trackCount, topTracks, audioAverages, emotion, bigFive, vibe, lyrics } = input;

  const topTrackList = topTracks
    .slice(0, 10)
    .map((t, i) => `${i + 1}. ${t.name} — ${t.artist}`)
    .join('\n');

  const lyricsSection = lyrics
    ? `
🎤 LYRIIIKKA-ANALYYSI:
- Biisejä, joissa lyriikat: ${lyrics.tracksWithLyrics}/${lyrics.trackCount}
- Kokonaissentiment: ${lyrics.overallSentiment} (-1 = synkkä, +1 = positiivinen)
- Toistuvat teemat: ${lyrics.topThemes.map((t) => `${t.theme} (${t.count}×)`).join(', ')}
- Sanamäärä yhteensä: ${lyrics.totalWords}`
    : '\n🎤 LYRI IKKA-ANALYYSI: (ei saatavilla)';

  return `🎧 SOITTOLISTA: "${playlistName}"
Biisejä: ${trackCount}

📊 AUDIO-DATA (keskiarvot):
- Valence (positiivisuus): ${pct(audioAverages.valence)}
- Energy (energisyys): ${pct(audioAverages.energy)}
- Danceability (tanssittavuus): ${pct(audioAverages.danceability)}
- Tempo: ${Math.round(audioAverages.tempo)} BPM
- Acousticness: ${pct(audioAverages.acousticness)}
- Instrumentalness: ${pct(audioAverages.instrumentalness)}
- Speechiness: ${pct(audioAverages.speechiness)}
- Liveness: ${pct(audioAverages.liveness)}
- Loudness: ${audioAverages.loudness.toFixed(1)} dB
- Duuri/molli-suhde: ${pct(audioAverages.majorKeyRatio)} duuria

🗺️ TUNNETILAKARTTA:
- Quadrant: ${emotion.quadrant}
- Valence: ${pct(emotion.valence)}, Energy: ${pct(emotion.energy)}

🧬 BIG FIVE -PERSOONALLISUUSARVIOT:
- Avoimuus: ${pct(bigFive.openness)} — ${bigFive.labels.openness}
- Tunnollisuus: ${pct(bigFive.conscientiousness)} — ${bigFive.labels.conscientiousness}
- Ekstraversio: ${pct(bigFive.extraversion)} — ${bigFive.labels.extraversion}
- Sovinnollisuus: ${pct(bigFive.agreeableness)} — ${bigFive.labels.agreeableness}
- Neuroottisuus: ${pct(bigFive.neuroticism)} — ${bigFive.labels.neuroticism}

🎭 VIBE:
- Päätunnelma: ${vibe.primaryMood}
- Energia: ${vibe.energyLevel}
- Tanssittavuus: ${vibe.danceabilityLevel}
- Soittolistan tyyppi: ${vibe.playlistType}
- Sävellaji: ${vibe.keyMood}
- Tempo: ${vibe.tempoLabel}
${lyricsSection}

🎵 TOP ${topTracks.length} BIISIÄ:
${topTrackList}

---

Analysoi tämä soittolista ja anna psykologinen profiili. Vastaa JSON-muodossa:
{
  "headline": "Yhden lauseen iskevä tiivistelmä (max 100 merkkiä)",
  "emotionalState": "Tunnetila-analyysi: mitä tunteita soittolista heijastaa? (2–3 lausetta)",
  "personality": "Persoonallisuusanalyysi Big Five -pohjalta. Mitä piirteitä data korostaa? (3–4 lausetta)",
  "obsessiveThemes": "Mitkä teemat toistuvat pakkomielteisesti? Mihin artisti/aihe kuuntelija on fiksoitunut? (2–3 lausetta)",
  "freudianDiagnosis": "Freudilainen diagnoosi: mitä puolustusmekanismeja soittolista paljastaa? (2 lausetta, huumorilla)",
  "freudianStage": "Mihin Freudin psykoseksuaaliseen vaiheeseen (oraalinen, anaalinen, fallinen, latenssi, genitaalinen) kuuntelija on jämähtänyt? Perustele yhdellä lauseella.",
  "recommendation": "Millaiselle ihmiselle suosittelisit tätä soittolistaa? (1 lause)",
  "adjectives": ["adjektiivi1", "adjektiivi2", "adjektiivi3"],
  "insanityRating": 0-100,
  "playlistRating": 1-10
}

INSANITY RATING -asteikko (huumoria!):
- 0–20: Täysin normaali, tylsä, ehkä jopa liian tervejärkinen
- 21–40: Pientä omituisuutta, mutta hallinnassa
- 41–60: Selvästi jotain meneillään, terapiassa voisi käydä
- 61–80: Vakavaa huolestuttavuutta, suosittelen ammattiapua
- 81–100: Täysin sekaisin, soittolista on todistusaineisto

Vastaa PELKÄLLÄ JSONILLA, ei muuta tekstiä.`;
}

// ─── OpenAI API -kutsu ─────────────────────────────────────

/**
 * Lähetä analyysipyyntö OpenAI:lle (GPT-4o-mini).
 * Vaatii OPENAI_API_KEY:n — joko parametrina tai ympäristömuuttujasta.
 */
export async function runPsychoAnalysis(
  input: PsychoInput,
  apiKey: string,
): Promise<PsychoAnalysis> {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(input);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.9,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('OpenAI returned empty response');
  }

  try {
    return JSON.parse(content) as PsychoAnalysis;
  } catch {
    throw new Error(`Failed to parse OpenAI JSON response: ${content.slice(0, 200)}`);
  }
}

// ─── Apurit ────────────────────────────────────────────────

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}
