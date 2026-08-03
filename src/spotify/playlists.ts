// Spotify-soittolistojen haku
// Dokumentaatio: https://developer.spotify.com/documentation/web-api/reference/get-list-users-playlists

import { spotifyGet } from './auth.js';
import type {
  SpotifyPaginated,
  SpotifyPlaylist,
  SpotifyPlaylistTrack,
} from './types.js';

/** Hae käyttäjän omat soittolistat (sivutus) */
export async function fetchMyPlaylists(
  offset = 0,
  limit = 50,
): Promise<SpotifyPaginated<SpotifyPlaylist> | null> {
  return spotifyGet<SpotifyPaginated<SpotifyPlaylist>>(
    `/me/playlists?limit=${limit}&offset=${offset}`,
  );
}

/** Hae KAIKKI soittolistat (hoitaa sivutus automaattisesti) */
export async function fetchAllMyPlaylists(): Promise<SpotifyPlaylist[]> {
  const all: SpotifyPlaylist[] = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    const page = await fetchMyPlaylists(offset, limit);
    if (!page) break;

    all.push(...page.items);

    if (!page.next) break;
    offset += limit;

    // Spotify rate limit: kevyt delay
    await sleep(100);
  }

  return all;
}

/** Hae yhden soittolistan kaikki biisit (sivutus) */
export async function fetchPlaylistTracks(
  playlistId: string,
  offset = 0,
  limit = 100,
): Promise<SpotifyPaginated<SpotifyPlaylistTrack> | null> {
  return spotifyGet<SpotifyPaginated<SpotifyPlaylistTrack>>(
    `/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`,
  );
}

/** Hae soittolistan KAIKKI biisit (hoitaa sivutus) */
export async function fetchAllPlaylistTracks(
  playlistId: string,
): Promise<SpotifyPlaylistTrack[]> {
  const all: SpotifyPlaylistTrack[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const page = await fetchPlaylistTracks(playlistId, offset, limit);
    if (!page) break;

    // Suodata null-trackit pois (poistetut biisit)
    const valid = page.items.filter((item) => item.track !== null);
    all.push(...valid);

    if (!page.next) break;
    offset += limit;

    await sleep(100);
  }

  return all;
}

/** Hae soittolistan metadata (nimi, kuvaus, kuvat, biisien määrä) */
export async function fetchPlaylistMeta(
  playlistId: string,
): Promise<SpotifyPlaylist | null> {
  return spotifyGet<SpotifyPlaylist>(`/playlists/${playlistId}`);
}

// ─── Apurit ────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
