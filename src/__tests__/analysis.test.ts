// Yksikkötestit — Audio Profile & Sentiment analyysi
import { describe, it, expect } from 'vitest';
import type { AudioProfileAverages } from '../spotify/audio-features.js';
import { computeAverages, findExtremes } from '../spotify/audio-features.js';
import type { SpotifyAudioFeatures } from '../spotify/types.js';
import { mapToCircumplex, estimateBigFive, describeVibe } from '../analyze/audio-profile.js';
import { analyzeLyricsSentiment } from '../analyze/sentiment.js';

// ─── Apuri: generoi mock audio-features ────────────────────

function mockFeatures(overrides: Partial<SpotifyAudioFeatures>[]): SpotifyAudioFeatures[] {
  return overrides.map((o, i) => ({
    id: `track-${i}`,
    acousticness: 0.5,
    danceability: 0.5,
    energy: 0.5,
    instrumentalness: 0.1,
    liveness: 0.1,
    loudness: -10,
    speechiness: 0.05,
    valence: 0.5,
    tempo: 120,
    key: 0,
    mode: 1,
    time_signature: 4,
    duration_ms: 200000,
    ...o,
  }));
}

// ─── Audio Features -keskiarvot ────────────────────────────

describe('computeAverages', () => {
  it('laskee keskiarvot oikein kahdelle biisille', () => {
    const features = mockFeatures([
      { valence: 0.2, energy: 0.8, danceability: 0.6 },
      { valence: 0.8, energy: 0.4, danceability: 0.2 },
    ]);

    const avg = computeAverages(features)!;
    expect(avg.valence).toBeCloseTo(0.5);
    expect(avg.energy).toBeCloseTo(0.6);
    expect(avg.danceability).toBeCloseTo(0.4);
  });

  it('palauttaa null tyhjälle listalle', () => {
    expect(computeAverages([])).toBeNull();
  });

  it('laskee duuri/molli-suhteen oikein', () => {
    const features = mockFeatures([
      { mode: 1 }, { mode: 0 }, { mode: 1 }, { mode: 1 },
    ]);
    const avg = computeAverages(features)!;
    expect(avg.majorKeyRatio).toBeCloseTo(0.75);
  });
});

// ─── Russellin tunnetilakartta ─────────────────────────────

describe('mapToCircumplex', () => {
  it('tunnistaa iloisen kvadrantin', () => {
    const avg: AudioProfileAverages = {
      count: 1, valence: 0.8, energy: 0.85,
      acousticness: 0.1, danceability: 0.9, instrumentalness: 0,
      liveness: 0.1, loudness: -5, speechiness: 0.05,
      tempo: 130, majorKeyRatio: 0.9,
    };
    expect(mapToCircumplex(avg).quadrant).toBe('iloinen 😄');
  });

  it('tunnistaa surullisen kvadrantin', () => {
    const avg: AudioProfileAverages = {
      count: 1, valence: 0.15, energy: 0.2,
      acousticness: 0.8, danceability: 0.2, instrumentalness: 0.1,
      liveness: 0.1, loudness: -15, speechiness: 0.05,
      tempo: 65, majorKeyRatio: 0.2,
    };
    expect(mapToCircumplex(avg).quadrant).toBe('surullinen 😢');
  });
});

// ─── Big Five -arviot ──────────────────────────────────────

describe('estimateBigFive', () => {
  it('korkea energy + danceability → korkea ekstraversio', () => {
    const avg: AudioProfileAverages = {
      count: 10, energy: 0.9, danceability: 0.9, valence: 0.8,
      acousticness: 0.1, instrumentalness: 0, speechiness: 0.05,
      liveness: 0.1, loudness: -5, tempo: 135, majorKeyRatio: 0.9,
    };
    const bf = estimateBigFive(avg);
    expect(bf.extraversion).toBeGreaterThan(0.7);
    expect(bf.labels.extraversion).toContain('🦚');
  });

  it('matala valence + molli → korkea neuroottisuus', () => {
    const avg: AudioProfileAverages = {
      count: 10, valence: 0.1, energy: 0.3, danceability: 0.2,
      acousticness: 0.5, instrumentalness: 0.2, speechiness: 0.05,
      liveness: 0.1, loudness: -12, tempo: 70, majorKeyRatio: 0.1,
    };
    const bf = estimateBigFive(avg);
    expect(bf.neuroticism).toBeGreaterThan(0.6);
  });
});

// ─── Sentiment-analyysi ────────────────────────────────────

describe('analyzeLyricsSentiment', () => {
  it('tunnistaa positiivisen sentimentin', () => {
    const result = analyzeLyricsSentiment(
      'I love you so much, you are beautiful and amazing, my sweet love',
      'Test Song',
      'Test Artist',
    );
    expect(result.sentiment).toBeGreaterThan(0);
    expect(result.themes).toContain('rakkaus');
  });

  it('tunnistaa negatiivisen sentimentin', () => {
    const result = analyzeLyricsSentiment(
      'I am broken and alone, tears fall down, hate and pain everywhere',
      'Sad Song',
      'Sad Artist',
    );
    expect(result.sentiment).toBeLessThan(0);
    expect(result.themes).toContain('kipu & sydänsuru');
  });

  it('palauttaa nollan tyhjille lyriikoille', () => {
    const result = analyzeLyricsSentiment(null, 'No Lyrics', 'Artist');
    expect(result.sentiment).toBe(0);
    expect(result.wordCount).toBe(0);
  });
});
