/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API base URL. Unset in dev (uses the Vite proxy at /api). */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
