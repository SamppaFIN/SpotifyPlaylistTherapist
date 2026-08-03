// Audio-profiili: Audio Features → tunnetilat & persoonallisuusarviot
//
// Russell's Circumplex Model of Affect:
//   - X-akseli: valence (0 = negatiivinen, 1 = positiivinen)
//   - Y-akseli: energy (0 = matala energia, 1 = korkea energia)
//   - Kvadrantit: iloinen/energinen, vihainen/jännittynyt, surullinen/rauhallinen, rentoutunut/tyyni
//
// Big Five -arviot perustuvat tunnettuihin korrelaatioihin musiikin
// audio-ominaisuuksien ja persoonallisuuspiirteiden välillä
// (North & Hargreaves, 2008; Rentfrow & Gosling, 2003).

import type { AudioProfileAverages } from '../spotify/audio-features.js';
import type { SpotifyAudioFeatures } from '../spotify/types.js';

// ─── Russell's Circumplex ──────────────────────────────────

export type EmotionQuadrant =
  | 'iloinen 😄'
  | 'vihainen 😤'
  | 'surullinen 😢'
  | 'rentoutunut 😌'
  | 'neutraali 😐';

export interface EmotionMapping {
  quadrant: EmotionQuadrant;
  label: string;
  valence: number;  // 0–1
  energy: number;   // 0–1
}

/** Mappaa valence + energy Russellin tunnekartalle */
export function mapToCircumplex(avg: AudioProfileAverages): EmotionMapping {
  const { valence, energy } = avg;

  let quadrant: EmotionQuadrant;
  if (valence >= 0.55 && energy >= 0.55) quadrant = 'iloinen 😄';
  else if (valence < 0.45 && energy >= 0.55) quadrant = 'vihainen 😤';
  else if (valence < 0.45 && energy < 0.45) quadrant = 'surullinen 😢';
  else if (valence >= 0.55 && energy < 0.45) quadrant = 'rentoutunut 😌';
  else quadrant = 'neutraali 😐';

  return { quadrant, label: quadrant.replace(/ .*/, ''), valence, energy };
}

// ─── Big Five -arvio ───────────────────────────────────────

export interface BigFiveEstimate {
  /** Avoimuus uusille kokemuksille (0–1) */
  openness: number;
  /** Tunnollisuus (0–1) */
  conscientiousness: number;
  /** Ulospäinsuuntautuneisuus (0–1) */
  extraversion: number;
  /** Sovinnollisuus (0–1) */
  agreeableness: number;
  /** Neuroottisuus / tunne-elämän epävakaus (0–1) */
  neuroticism: number;
  /** Sanallinen arvio jokaisesta */
  labels: Record<keyof Omit<BigFiveEstimate, 'labels'>, string>;
}

/**
 * Arvioi Big Five -persoonallisuuspiirteet audio-featureiden perusteella.
 * Perustuu musiikkipsykologian tutkimuskirjallisuuteen.
 */
export function estimateBigFive(avg: AudioProfileAverages): BigFiveEstimate {
  const { energy, danceability, valence, acousticness, speechiness, tempo, instrumentalness, majorKeyRatio } = avg;

  // Avoimuus: korkea acousticness + instrumentalness → reflektiivinen, taiteellinen
  const openness = clamp((acousticness * 0.4 + instrumentalness * 0.3 + (1 - danceability) * 0.3), 0, 1);

  // Tunnollisuus: duuri + korkea danceability → järjestelmällinen, energinen
  const conscientiousness = clamp((majorKeyRatio * 0.3 + danceability * 0.4 + energy * 0.3), 0, 1);

  // Ekstraversio: korkea energy + danceability → sosiaalinen, ulospäinsuuntautunut
  const extraversion = clamp((energy * 0.5 + danceability * 0.3 + valence * 0.2), 0, 1);

  // Sovinnollisuus: korkea valence + duuri → empaattinen, yhteistyökykyinen
  const agreeableness = clamp((valence * 0.5 + majorKeyRatio * 0.3 + (1 - speechiness) * 0.2), 0, 1);

  // Neuroottisuus: matala valence + molli + matala danceability → ahdistunut, epävakaa
  const neuroticism = clamp(((1 - valence) * 0.4 + (1 - majorKeyRatio) * 0.3 + (1 - danceability) * 0.3), 0, 1);

  return {
    openness,
    conscientiousness,
    extraversion,
    agreeableness,
    neuroticism,
    labels: {
      openness: labelTrait(openness, ['sulkeutunut 🏠', 'tasapainoinen 🚪', 'äärimmäisen avoin 🌌']),
      conscientiousness: labelTrait(conscientiousness, ['spontaani 🎲', 'järjestelmällinen 📋', 'pakkomielteinen 📐']),
      extraversion: labelExtraversion(extraversion),
      agreeableness: labelTrait(agreeableness, ['kapinallinen 🤘', 'diplomaattinen 🤝', 'miellyttäjä 🥺']),
      neuroticism: labelTrait(neuroticism, ['kylmän rauhallinen 🧊', 'tunteellinen 🌊', 'hermoromahduksen partaalla 💥']),
    },
  };
}

// ─── Soittolistan luonnehdinta ─────────────────────────────

export interface PlaylistVibe {
  /** Pääasiallinen tunnelma */
  primaryMood: string;
  /** Energiataso */
  energyLevel: 'matala 🔋' | 'kohtalainen ⚡' | 'korkea 🚀';
  /** Tanssittavuus */
  danceabilityLevel: 'sohvaperuna 🛋️' | 'nyökkäilyä 🎵' | 'tanssilattialla 💃';
  /** Soittolistan tyyppi */
  playlistType: string;
  /** Dominantti sävellaji */
  keyMood: 'pääosin duuri ☀️' | 'pääosin molli 🌙' | 'tasapainossa ⚖️';
  /** Tempo */
  tempoLabel: string;
}

export function describeVibe(avg: AudioProfileAverages): PlaylistVibe {
  const moodMap = moodDescriptor(avg.valence, avg.energy);

  return {
    primaryMood: moodMap,
    energyLevel: avg.energy > 0.65 ? 'korkea 🚀' : avg.energy > 0.35 ? 'kohtalainen ⚡' : 'matala 🔋',
    danceabilityLevel: avg.danceability > 0.65 ? 'tanssilattialla 💃' : avg.danceability > 0.35 ? 'nyökkäilyä 🎵' : 'sohvaperuna 🛋️',
    playlistType: classifyPlaylist(avg),
    keyMood: avg.majorKeyRatio > 0.65 ? 'pääosin duuri ☀️' : avg.majorKeyRatio < 0.35 ? 'pääosin molli 🌙' : 'tasapainossa ⚖️',
    tempoLabel: tempoLabel(avg.tempo),
  };
}

// ─── Apurifunktiot ─────────────────────────────────────────

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function labelTrait(value: number, [low, mid, high]: [string, string, string]): string {
  if (value < 0.35) return low;
  if (value > 0.65) return high;
  return mid;
}

function labelExtraversion(value: number): string {
  if (value < 0.3) return 'introvertti 🦉';
  if (value < 0.5) return 'ambivertti 🦊';
  if (value < 0.7) return 'ekstrovertti 🦜';
  return 'bile-eläin 🦚';
}

function moodDescriptor(valence: number, energy: number): string {
  if (valence > 0.7 && energy > 0.7) return 'euforinen ✨';
  if (valence > 0.6 && energy > 0.5) return 'iloinen 🌞';
  if (valence > 0.5 && energy < 0.4) return 'seesteinen 🧘';
  if (valence < 0.3 && energy > 0.7) return 'aggressiivinen 🔥';
  if (valence < 0.3 && energy < 0.3) return 'melankolinen 🥀';
  if (valence < 0.4 && energy > 0.5) return 'levoton 🌪️';
  if (valence > 0.5 && energy < 0.5) return 'rentoutunut 😌';
  return 'tasapainoinen ⚖️';
}

function classifyPlaylist(avg: AudioProfileAverages): string {
  if (avg.energy > 0.7 && avg.danceability > 0.6) return 'Bilemix 🎉';
  if (avg.acousticness > 0.6 && avg.energy < 0.4) return 'Akustinen ilta 🕯️';
  if (avg.instrumentalness > 0.5) return 'Instrumentaali/fokus 🎼';
  if (avg.speechiness > 0.3) return 'Lyriikkapainotteinen 📝';
  if (avg.valence < 0.3) return 'Synkkä sielunmaisema 🖤';
  if (avg.energy > 0.6 && avg.valence > 0.5) return 'Feel-good 🇫🇮';
  if (avg.tempo > 130) return 'Nopeatempoinen 🏃';
  return 'Eklektinen sekoitus 🎨';
}

function tempoLabel(bpm: number): string {
  if (bpm < 60) return 'erittäin hidas 🐢';
  if (bpm < 80) return 'hidas 🚶';
  if (bpm < 100) return 'kohtalainen 🚴';
  if (bpm < 120) return 'reipas 🏃';
  if (bpm < 140) return 'nopea 🏎️';
  return 'äärimmäisen nopea ⚡';
}
