/**
 * Central configuration.
 * Values are injected at build time from /frontend/.env (see .env.example).
 */

export const config = {
  /** OpenRouteService API key (real road routing). */
  orsApiKey: import.meta.env.VITE_ORS_API_KEY as string | undefined,

  /** Backend REST API base. In dev, /api is proxied to :8000. */
  apiBase: (import.meta.env.VITE_API_BASE ?? '/api') as string,

  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
    appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined,
  },

  /** True when Firebase is configured (used to switch DB adapter). */
  get firebaseEnabled(): boolean {
    const f = this.firebase;
    return Boolean(f.apiKey && f.projectId && f.appId);
  },
} as const;

/** Safely check at runtime whether the ORS key is present. */
export function hasOrsKey(): boolean {
  return typeof config.orsApiKey === 'string' && config.orsApiKey.length > 0;
}