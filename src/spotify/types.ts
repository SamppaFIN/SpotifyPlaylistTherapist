// Spotify API -tyypit
// Dokumentaatio: https://developer.spotify.com/documentation/web-api/reference/

/** Spotify API -vastauksen perusrakenne */
export interface SpotifyPaginated<T> {
  href: string;
  items: T[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}

/** Spotify-soittolista (yksinkertaistettu) */
export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  href: string;
  images: SpotifyImage[];
  owner: { display_name: string; id: string };
  tracks: { total: number; href: string };
  public: boolean;
  collaborative: boolean;
}

/** Albumin kuva */
export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

/** Spotify-artisti (yksinkertaistettu) */
export interface SpotifyArtist {
  id: string;
  name: string;
  genres?: string[];
  popularity?: number;
}

/** Soittolistan biisi (track object) */
export interface SpotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  popularity: number;
  preview_url: string | null;
  artists: { id: string; name: string }[];
  album: {
    id: string;
    name: string;
    images: SpotifyImage[];
    release_date: string;
  };
}

/** Soittolistan biisi (playlist track -wrapper) */
export interface SpotifyPlaylistTrack {
  added_at: string;
  track: SpotifyTrack | null;
}

/** Audio Features (Spotify API) */
export interface SpotifyAudioFeatures {
  id: string;
  acousticness: number;      // 0–1, onko akustinen
  danceability: number;      // 0–1, kuinka tanssittava
  energy: number;            // 0–1, intensiteetti & aktiivisuus
  instrumentalness: number;  // 0–1, ei laulua
  liveness: number;          // 0–1, live-yleisö
  loudness: number;          // -60–0 dB, keskimääräinen äänenvoimakkuus
  speechiness: number;       // 0–1, puhuttu sana
  valence: number;           // 0–1, positiivisuus (surullinen ↔ iloinen)
  tempo: number;             // BPM
  key: number;               // -1 = ei määritelty, 0 = C, 1 = C#, ..., 11 = B
  mode: number;              // 0 = molli, 1 = duuri
  time_signature: number;    // 3/4, 4/4, jne.
  duration_ms: number;
}

/** Auth-tokenit */
export interface SpotifyTokens {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;          // sekuntia
  refresh_token: string;
  scope: string;
  /** Milloin token vanhenee (Date.now() + expires_in * 1000) */
  expires_at: number;
}

/** Spotify-profiili */
export interface SpotifyProfile {
  id: string;
  display_name: string;
  images: SpotifyImage[];
  email?: string;
  country?: string;
  product?: 'premium' | 'free' | 'open';
}
