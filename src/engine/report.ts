// Raportin generointi
// Koostaa kaiken datan yhdeksi raporttiobjektiksi, jonka UI voi renderöidä.

import type { SpotifyPlaylist, SpotifyPlaylistTrack, SpotifyTrack } from '../spotify/types.js';
import type { AudioProfileAverages } from '../spotify/audio-features.js';
import type { EmotionMapping, BigFiveEstimate, PlaylistVibe } from '../analyze/audio-profile.js';
import type { PlaylistLyricsAnalysis } from '../analyze/sentiment.js';
import type { PsychoAnalysis } from '../analyze/psycho-profile.js';
import { type PsychoInput } from '../analyze/psycho-profile.js';

// ─── Raportin tyypit ───────────────────────────────────────

export interface TherapistReport {
  meta: {
    playlistName: string;
    playlistDescription: string;
    playlistImage: string | null;
    trackCount: number;
    analyzedAt: string;
    totalDurationMs: number;
  };
  audio: {
    averages: AudioProfileAverages;
    topValence: { name: string; artist: string; value: number }[];
    bottomValence: { name: string; artist: string; value: number }[];
    topEnergy: { name: string; artist: string; value: number }[];
    bottomEnergy: { name: string; artist: string; value: number }[];
    topDanceability: { name: string; artist: string; value: number }[];
  };
  emotion: EmotionMapping;
  bigFive: BigFiveEstimate;
  vibe: PlaylistVibe;
  lyrics: PlaylistLyricsAnalysis | null;
  psycho: PsychoAnalysis | null;
  tracks: { name: string; artist: string }[];
}

// ─── Koosta raportti ───────────────────────────────────────

export interface ReportInput {
  playlist: SpotifyPlaylist;
  tracks: SpotifyPlaylistTrack[];
  averages: AudioProfileAverages;
  emotion: EmotionMapping;
  bigFive: BigFiveEstimate;
  vibe: PlaylistVibe;
  lyrics: PlaylistLyricsAnalysis | null;
  psycho: PsychoAnalysis | null;
}

export function buildReport(input: ReportInput): TherapistReport {
  const { playlist, tracks, averages, emotion, bigFive, vibe, lyrics, psycho } = input;

  // Top/bottom valence
  const sortedValence = [...(tracks.map(t => t.track).filter(Boolean) as SpotifyTrack[])]
    .sort(() => 0); // Oikeasti sortattaisiin audio-featureilla, placeholder

  const trackList = tracks
    .filter((t) => t.track !== null)
    .map((t) => ({
      name: t.track!.name,
      artist: t.track!.artists.map((a) => a.name).join(', '),
    }));

  const totalMs = tracks.reduce(
    (sum, t) => sum + (t.track?.duration_ms ?? 0),
    0,
  );

  return {
    meta: {
      playlistName: playlist.name,
      playlistDescription: playlist.description || '',
      playlistImage: playlist.images?.[0]?.url ?? null,
      trackCount: tracks.length,
      analyzedAt: new Date().toISOString(),
      totalDurationMs: totalMs,
    },
    audio: {
      averages,
      topValence: [],
      bottomValence: [],
      topEnergy: [],
      bottomEnergy: [],
      topDanceability: [],
    },
    emotion,
    bigFive,
    vibe,
    lyrics,
    psycho,
    tracks: trackList,
  };
}

/** Rakenna PsychoInput raporttia varten */
export function buildPsychoInput(report: TherapistReport): PsychoInput {
  return {
    playlistName: report.meta.playlistName,
    playlistDescription: report.meta.playlistDescription,
    trackCount: report.meta.trackCount,
    topTracks: report.tracks.slice(0, 20),
    audioAverages: report.audio.averages,
    emotion: report.emotion,
    bigFive: report.bigFive,
    vibe: report.vibe,
    lyrics: report.lyrics,
  };
}
