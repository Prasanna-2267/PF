/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API base URL. Unset in dev (uses the Vite proxy at /api). */
  readonly VITE_API_BASE_URL?: string;
  /** Google OAuth Client ID. When unset, the "Continue with Google" button is hidden. */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
