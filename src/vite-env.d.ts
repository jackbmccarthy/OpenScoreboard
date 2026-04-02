/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_DATABASE_URL: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_FIREBASE_APPLE_CLIENT_ID: string
  readonly VITE_USE_LOCAL_DB: string
  readonly VITE_ACEBASE_HOST: string
  readonly VITE_ACEBASE_PORT: string
  readonly VITE_ACEBASE_USE_SSL: string
  readonly VITE_DATABASE_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
