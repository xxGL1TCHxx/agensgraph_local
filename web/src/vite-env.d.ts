/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_ORIGIN: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}