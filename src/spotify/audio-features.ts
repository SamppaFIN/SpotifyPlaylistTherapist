// Spotify Audio Features API
// Dokumentaatio: https://developer.spotify.com/documentation/web-api/reference/get-several-audio-features
//
// Spotify sallii max 100 biisin audio-featuret yhdellä kutsulla.
// Täällä hoidetaan chunkitus + keskiarvojen laskenta.

import { spotifyGet } from './auth.js';
import type { SpotifyAudioFeatures } from './types.js';

/** Hae audio-featuret usealle biisille kerralla (max 100) */
export async function fetchAudioFeatures(
  trackIds: string[],
): Promise<SpotifyAudioFeatures[] | null> {
  if (trackIds.length === 0) return [];
  if (trackIds.length > 100) {
    throw new Error('Max 100 track ID:tä kerralla — käytä fetchAllAudioFeatures()');
  }

  const ids = trackIds.join(',');
  const data = await spotifyGet<{ audio_features: SpotifyAudioFeatures[] }>(
    `/audio-features?ids=${ids}`,
  );

  if (!data) return null;

  // Spotify palauttaa null jos featureita ei löydy (esim. paikalliset tiedostot)
  return data.audio_features.filter(Boolean);
}

/** Hae audio-featuret chunkkeina (yli 100 biisille) */
export async function fetchAllAudioFeatures(
  trackIds: string[],
): Promise<SpotifyAudioFeatures[]> {
  const all: SpotifyAudioFeatures[] = [];

  for (let i = 0; i < trackIds.length; i += 100) {
    const chunk = trackIds.slice(i, i + 100);
    const features = await fetchAudioFeatures(chunk);
    if (features) all.push(...features);
  }

  return all;
}

// ─── Keskiarvot & tilastot ─────────────────────────────────

/** Soittolistan audio-featureiden keskiarvot */
export interface AudioProfileAverages {
  count: number;
  acousticness: number;
  danceability: number;
  energy: number;
  instrumentalness: number;
  liveness: number;
  loudness: number;
  speechiness: number;
  valence: number;
  tempo: number;
  /** Duuri-biisien osuus (0–1) */
  majorKeyRatio: number;
}

/** Laske keskiarvot audio-featureista */
export function computeAverages(
  features: SpotifyAudioFeatures[],
): AudioProfileAverages | null {
  if (features.length === 0) return null;

  const count = features.length;

  const sum = (fn: (f: SpotifyAudioFeatures) => number) =>
    features.reduce((acc, f) => acc + fn(f), 0);

  const majorCount = features.filter((f) => f.mode === 1).length;

  return {
    count,
    acousticness: sum((f) => f.acousticness) / count,
    danceability: sum((f) => f.danceability) / count,
    energy: sum((f) => f.energy) / count,
    instrumentalness: sum((f) => f.instrumentalness) / count,
    liveness: sum((f) => f.liveness) / count,
    loudness: sum((f) => f.loudness) / count,
    speechiness: sum((f) => f.speechiness) / count,
    valence: sum((f) => f.valence) / count,
    tempo: sum((f) => f.tempo) / count,
    majorKeyRatio: majorCount / count,
  };
}

/** Tunnista ääripäät: hae biisit joilla on korkein/matalin arvo */
export function findExtremes(
  features: SpotifyAudioFeatures[],
  key: keyof SpotifyAudioFeatures,
  topN = 3,
): SpotifyAudioFeatures[] {
  const numeric = features.filter((f) => typeof f[key] === 'number');
  const sorted = [...numeric].sort((a, b) => (b[key] as number) - (a[key] as number));

  return sorted.slice(0, topN);
}
