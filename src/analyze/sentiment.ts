// Lyriikoiden haku ja sentiment-analyysi
// Genius API: https://docs.genius.com/
//
// Koska Genius API vaatii backendin (CORS), tämä moduuli tarjoaa:
//   1. Rajapinnan lyriikoiden hakuun
//   2. Yksinkertaisen keyword/sentiment-analyysin (ilman API-kutsua)
//   3. Valmiin promptin OpenAI:lle (joka osaa analysoida lyriikat)

export interface LyricsResult {
  trackId: string;
  trackName: string;
  artistName: string;
  lyrics: string | null;
  source: 'genius' | 'mock' | 'unavailable';
}

export interface LyricsSentiment {
  /** Arvioitu sentiment: -1 (negatiivinen) ... +1 (positiivinen) */
  sentiment: number;
  /** Avainsanat soittolistalta */
  keywords: string[];
  /** Toistuvat teemat */
  themes: string[];
  /** Sanamäärä */
  wordCount: number;
}

// ─── Genius API -haku ──────────────────────────────────────

const GENIUS_BASE = 'https://api.genius.com';

/**
 * Hae biisin sanoitukset Genius API:sta.
 * HUOM: Genius API vaatii access tokenin ja backendin CORS:n takia.
 * Tämä on ensisijaisesti dokumentaatio/proxy-palvelinta varten.
 */
export async function fetchLyricsFromGenius(
  trackName: string,
  artistName: string,
  accessToken: string,
): Promise<string | null> {
  try {
    // 1. Etsi biisi
    const searchQuery = encodeURIComponent(`${trackName} ${artistName}`);
    const searchRes = await fetch(
      `${GENIUS_BASE}/search?q=${searchQuery}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!searchRes.ok) return null;

    const searchData = await searchRes.json();
    const hits = searchData.response?.hits;
    if (!hits || hits.length === 0) return null;

    // 2. Hae lyriikat ensimmäisestä osumasta
    const songUrl = hits[0].result.url;
    // Genius ei tarjoa suoraa lyrics-endpointia API:ssa —
    // lyriikat pitää scrapata tai käyttää proxy-palvelinta.
    // Tämä on placeholder.

    return null; // Vaatii proxy-palvelimen
  } catch {
    return null;
  }
}

// ─── Keyword-pohjainen sentiment-analyysi ──────────────────

/** Negatiivisia tunnesanoja */
const NEGATIVE_WORDS = new Set([
  'pain', 'hurt', 'hate', 'death', 'die', 'dark', 'alone', 'lonely',
  'cry', 'tears', 'broken', 'lost', 'fear', 'angry', 'rage', 'sad',
  'goodbye', 'sorry', 'regret', 'empty', 'cold', 'bleed', 'burn',
  'sataa', 'kuolema', 'viha', 'yksin', 'itken', 'kyyneleet',
  'rikki', 'pelko', 'pimeä', 'kylmä', 'suru', 'ikävä', 'haavat',
]);

/** Positiivisia tunnesanoja */
const POSITIVE_WORDS = new Set([
  'love', 'happy', 'joy', 'beautiful', 'sunshine', 'dream', 'hope',
  'dance', 'smile', 'shining', 'free', 'forever', 'together',
  'heaven', 'sweet', 'wonderful', 'amazing', 'perfect', 'light',
  'rakkaus', 'ilo', 'kaunis', 'aurinko', 'unelma', 'toivo',
  'tanssi', 'vapaa', 'yhdessä', 'ihana', 'täydellinen', 'valo',
]);

/** Persoonallisuusteemat */
const THEME_PATTERNS: [RegExp, string][] = [
  [/\b(alone|lost|empty|yksin|tyhjä)\b/gi, 'yksinäisyys'],
  [/\b(love|heart|baby|sweet|rakkaus|sydän)\b/gi, 'rakkaus'],
  [/\b(party|dance|tonight|drink|bileet|tanssi)\b/gi, 'bileet & juhliminen'],
  [/\b(fight|war|battle|strong|voima|taistelu)\b/gi, 'taistelu & voima'],
  [/\b(dream|fly|sky|stars|unelma|tähdet)\b/gi, 'unelmat & toivo'],
  [/\b(pain|hurt|bleed|break|kipu|särkyy)\b/gi, 'kipu & sydänsuru'],
  [/\b(road|drive|run|away|tie|matka|pois)\b/gi, 'pako & matka'],
  [/\b(money|rich|power|fame|raha|valta)\b/gi, 'status & menestys'],
  [/\b(sex|body|touch|hot|sexy|kosketus)\b/gi, 'halu & intohimo'],
  [/\b(god|pray|soul|faith|jumala|usko)\b/gi, 'hengellisyys'],
  [/\b(remember|memory|past|years|muisto|menneisyys)\b/gi, 'nostalgia & muistot'],
  [/\b(hate|angry|rage|fuck|viha|raivo)\b/gi, 'viha & kapina'],
];

/** Analysoi lyriikoiden sentimentti ja teemat */
export function analyzeLyricsSentiment(
  lyrics: string | null,
  trackName: string,
  artistName: string,
): LyricsSentiment {
  if (!lyrics) {
    return {
      sentiment: 0,
      keywords: [],
      themes: [],
      wordCount: 0,
    };
  }

  const words = lyrics.toLowerCase().split(/\s+/);
  const wordCount = words.length;

  let posCount = 0;
  let negCount = 0;
  const foundKeywords: string[] = [];

  for (const word of words) {
    const clean = word.replace(/[^a-zäöåA-ZÄÖÅ]/g, '');
    if (POSITIVE_WORDS.has(clean)) posCount++;
    if (NEGATIVE_WORDS.has(clean)) negCount++;
  }

  // Teemat
  const themeCounts = new Map<string, number>();
  for (const [pattern, theme] of THEME_PATTERNS) {
    const matches = lyrics.match(pattern);
    if (matches) {
      themeCounts.set(theme, (themeCounts.get(theme) ?? 0) + matches.length);
    }
  }

  const themes = [...themeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme]) => theme);

  // Sentiment: normalisoitu arvo, painotettu sanamäärällä
  const total = posCount + negCount;
  const sentiment = total > 0
    ? (posCount - negCount) / total
    : 0;

  return {
    sentiment: Math.round(sentiment * 100) / 100,
    keywords: foundKeywords.slice(0, 20),
    themes,
    wordCount,
  };
}

// ─── Koostettu analyysi koko soittolistalle ────────────────

export interface PlaylistLyricsAnalysis {
  trackCount: number;
  tracksWithLyrics: number;
  overallSentiment: number;
  topThemes: { theme: string; count: number }[];
  totalWords: number;
  perTrack: LyricsSentiment[];
}

/** Analysoi koko soittolistan lyriikat */
export function analyzePlaylistLyrics(
  results: LyricsResult[],
): PlaylistLyricsAnalysis {
  const perTrack: LyricsSentiment[] = results.map((r) =>
    analyzeLyricsSentiment(r.lyrics, r.trackName, r.artistName),
  );

  const withLyrics = perTrack.filter((t) => t.wordCount > 0);

  // Yhdistä teemat
  const themeTotal = new Map<string, number>();
  for (const track of withLyrics) {
    for (const theme of track.themes) {
      themeTotal.set(theme, (themeTotal.get(theme) ?? 0) + 1);
    }
  }

  const topThemes = [...themeTotal.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([theme, count]) => ({ theme, count }));

  const overallSentiment = withLyrics.length > 0
    ? withLyrics.reduce((s, t) => s + t.sentiment, 0) / withLyrics.length
    : 0;

  return {
    trackCount: results.length,
    tracksWithLyrics: withLyrics.length,
    overallSentiment: Math.round(overallSentiment * 100) / 100,
    topThemes,
    totalWords: withLyrics.reduce((s, t) => s + t.wordCount, 0),
    perTrack,
  };
}
