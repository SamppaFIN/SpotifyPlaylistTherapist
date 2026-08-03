// Spotify-sovelluksen konfiguraatio
// HUOM: Älä committaa client_id:tä suoraan koodiin tuotannossa.
// Kehityksessä käytä ympäristömuuttujia tai .env-tiedostoa.

export const SPOTIFY_CONFIG = {
  /** Spotify Developer Dashboard → oma sovellus */
  clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID as string || 'YOUR_CLIENT_ID',

  /** Mihin Spotify ohjaa autentikoinnin jälkeen */
  redirectUri: (() => {
    // Kehitys: localhost, Tuotanto: GitHub Pages URL
    const prod = 'https://INFINITE.github.io/SpotifyPlaylistTherapist/demo.html';
    const dev = 'http://localhost:3333/demo.html';
    return import.meta.env.PROD ? prod : dev;
  })(),

  /** Spotify API:n juuri */
  apiBase: 'https://api.spotify.com/v1',

  /** Spotify Accounts -palvelun juuri */
  accountsBase: 'https://accounts.spotify.com',

  /** Tarvittavat oikeudet (scopes) */
  scopes: [
    'playlist-read-private',   // Yksityiset soittolistat
    'playlist-read-collaborative', // Yhteisölliset
    'user-read-private',       // Profiili
    'user-read-email',         // Sähköposti
  ].join(' '),
} as const;

/** localStorage-avaimet */
export const STORAGE_KEYS = {
  tokens: 'spotify_tokens',
  codeVerifier: 'spotify_code_verifier',
  profile: 'spotify_profile',
} as const;
