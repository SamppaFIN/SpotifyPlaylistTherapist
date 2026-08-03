// Spotify OAuth 2.0 PKCE -autentikointi
// Dokumentaatio: https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
//
// Flow:
//   1. Generoi code_verifier (satunnainen 64-merkkinen merkkijono)
//   2. Hashaa se SHA-256:lla → code_challenge
//   3. Uudelleenohjaa Spotifyhin: /authorize?code_challenge=...
//   4. Käyttäjä hyväksyy → Spotify ohjaa takaisin: ?code=...
//   5. Vaihda code + code_verifier access_tokeniin: POST /api/token
//   6. Tallenna tokenit localStorageen
//   7. Refresh token automaattisesti kun access token vanhenee

import type { SpotifyTokens, SpotifyProfile } from './types.js';
import { SPOTIFY_CONFIG, STORAGE_KEYS } from './config.js';

// ─── PKCE-apurit ───────────────────────────────────────────

/** Generoi kryptografisesti vahva satunnainen merkkijono */
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => chars[b % chars.length]).join('');
}

/** SHA-256-hash ja base64url-enkoodaus (PKCE-spesifikaatio) */
async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  return crypto.subtle.digest('SHA-256', encoder.encode(plain));
}

function base64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const binary = String.fromCharCode(...bytes);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// ─── Tokenien hallinta ─────────────────────────────────────

/** Tallenna tokenit localStorageen */
function saveTokens(tokens: SpotifyTokens): void {
  localStorage.setItem(STORAGE_KEYS.tokens, JSON.stringify(tokens));
}

/** Hae tallennetut tokenit */
export function getStoredTokens(): SpotifyTokens | null {
  const raw = localStorage.getItem(STORAGE_KEYS.tokens);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SpotifyTokens;
  } catch {
    return null;
  }
}

/** Poista tokenit (uloskirjautuminen) */
export function clearTokens(): void {
  localStorage.removeItem(STORAGE_KEYS.tokens);
  localStorage.removeItem(STORAGE_KEYS.profile);
}

/** Onko käyttäjä kirjautunut JA token voimassa? */
export async function isAuthenticated(): Promise<boolean> {
  const tokens = getStoredTokens();
  if (!tokens) return false;

  // Onko access token vanhentunut? Jos on, kokeile refreshata.
  if (Date.now() >= tokens.expires_at) {
    const refreshed = await refreshAccessToken(tokens.refresh_token);
    return refreshed !== null;
  }

  return true;
}

/** Hae voimassa oleva access token (refresh tarvittaessa) */
export async function getAccessToken(): Promise<string | null> {
  const tokens = getStoredTokens();
  if (!tokens) return null;

  if (Date.now() >= tokens.expires_at) {
    const refreshed = await refreshAccessToken(tokens.refresh_token);
    return refreshed?.access_token ?? null;
  }

  return tokens.access_token;
}

// ─── PKCE flow ─────────────────────────────────────────────

/**
 * Aloita Spotify-kirjautuminen.
 * Generoi PKCE-parametrit, tallenna code_verifier ja uudelleenohjaa Spotifyhin.
 */
export async function login(): Promise<void> {
  const codeVerifier = generateRandomString(64);
  const codeChallenge = base64url(await sha256(codeVerifier));

  // Tallenna code_verifier myöhempää token-vaihtoa varten
  localStorage.setItem(STORAGE_KEYS.codeVerifier, codeVerifier);

  const params = new URLSearchParams({
    client_id: SPOTIFY_CONFIG.clientId,
    response_type: 'code',
    redirect_uri: SPOTIFY_CONFIG.redirectUri,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    scope: SPOTIFY_CONFIG.scopes,
    show_dialog: 'true', // Näytä aina auth-dialogi
  });

  window.location.href = `${SPOTIFY_CONFIG.accountsBase}/authorize?${params}`;
}

/**
 * Käsittele callback — Spotify on ohjannut takaisin ?code=... parametrilla.
 * Vaihda authorization code access tokeniin.
 * Palauttaa tokenit tai null jos epäonnistui.
 */
export async function handleCallback(): Promise<SpotifyTokens | null> {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const error = urlParams.get('error');

  if (error) {
    console.error('🔴 Spotify auth error:', error);
    return null;
  }

  if (!code) {
    return null; // Ei olla callbackissa
  }

  const codeVerifier = localStorage.getItem(STORAGE_KEYS.codeVerifier);
  if (!codeVerifier) {
    console.error('🔴 PKCE code_verifier puuttuu — aloita login uudelleen');
    return null;
  }

  try {
    const tokens = await exchangeCodeForToken(code, codeVerifier);
    saveTokens(tokens);
    localStorage.removeItem(STORAGE_KEYS.codeVerifier);

    // Siivoa URL:sta ?code=... jotta sitä ei vahingossa käytetä uudelleen
    window.history.replaceState({}, document.title, window.location.pathname);

    return tokens;
  } catch (err) {
    console.error('🔴 Token exchange epäonnistui:', err);
    localStorage.removeItem(STORAGE_KEYS.codeVerifier);
    return null;
  }
}

/** Vaihda authorization code + code_verifier → access token */
async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
): Promise<SpotifyTokens> {
  const response = await fetch(`${SPOTIFY_CONFIG.accountsBase}/api/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: SPOTIFY_CONFIG.redirectUri,
      client_id: SPOTIFY_CONFIG.clientId,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Token exchange failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();

  return {
    access_token: data.access_token,
    token_type: data.token_type,
    expires_in: data.expires_in,
    refresh_token: data.refresh_token,
    scope: data.scope,
    expires_at: Date.now() + data.expires_in * 1000,
  };
}

// ─── Token refresh ─────────────────────────────────────────

/** Päivitä access token refresh tokenilla */
async function refreshAccessToken(refreshToken: string): Promise<SpotifyTokens | null> {
  try {
    const response = await fetch(`${SPOTIFY_CONFIG.accountsBase}/api/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: SPOTIFY_CONFIG.clientId,
      }),
    });

    if (!response.ok) {
      // Refresh token on vanhentunut tai mitätöity → pakota uusi login
      clearTokens();
      return null;
    }

    const data = await response.json();

    // Spotify saattaa palauttaa uuden refresh_tokenin (refresh token rotation)
    const tokens: SpotifyTokens = {
      access_token: data.access_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
      refresh_token: data.refresh_token ?? refreshToken,
      scope: data.scope,
      expires_at: Date.now() + data.expires_in * 1000,
    };

    saveTokens(tokens);
    return tokens;
  } catch {
    return null;
  }
}

// ─── Profiili ──────────────────────────────────────────────

/** Hae kirjautuneen käyttäjän Spotify-profiili */
export async function fetchProfile(): Promise<SpotifyProfile | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const cached = localStorage.getItem(STORAGE_KEYS.profile);
  if (cached) return JSON.parse(cached) as SpotifyProfile;

  const response = await fetch(`${SPOTIFY_CONFIG.apiBase}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return null;

  const profile: SpotifyProfile = await response.json();
  localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
  return profile;
}

// ─── API-kutsujen apuri ────────────────────────────────────

/**
 * Tee autentikoitu GET-pyyntö Spotify API:in.
 * Refreshaa tokenin automaattisesti tarvittaessa.
 */
export async function spotifyGet<T>(path: string): Promise<T | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const response = await fetch(`${SPOTIFY_CONFIG.apiBase}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 401) {
    // Token vanhentunut — kokeile refreshata ja yritä uudelleen
    const tokens = getStoredTokens();
    if (tokens?.refresh_token) {
      const refreshed = await refreshAccessToken(tokens.refresh_token);
      if (refreshed) {
        return spotifyGet<T>(path); // Rekursiivinen uudelleenyritys
      }
    }
    clearTokens();
    return null;
  }

  if (!response.ok) return null;

  return response.json() as Promise<T>;
}
