// Firebase configuration for OpenScoreboard v3
// Using Firebase SDK v8 (firebase@8.10.1)
// Vite uses VITE_ prefix for env vars

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  clientId: import.meta.env.VITE_FIREBASE_APPLE_CLIENT_ID,
}

// Check if we're using local database (AceBase)
export const isLocalDatabase = import.meta.env.VITE_USE_LOCAL_DB === "true"

// AceBase configuration for syncing Firebase users
export const acebaseConfig = {
  host: import.meta.env.VITE_ACEBASE_HOST || (typeof window !== "undefined" ? window.location.hostname : "localhost"),
  port: parseInt(import.meta.env.VITE_ACEBASE_PORT || (typeof window !== "undefined" ? window.location.port : "8080")),
  ssl: import.meta.env.VITE_ACEBASE_USE_SSL === "true" || (typeof window !== "undefined" ? window.location.protocol.includes("https") : false),
  dbname: import.meta.env.VITE_DATABASE_NAME || "openscoreboard",
}

export const subFolderPath = isLocalDatabase ? "/app" : ""

export const scoreboardBaseURL = import.meta.env.NODE_ENV === "production"
  ? (typeof window !== "undefined" ? window.location.origin : "")
  : (typeof window !== "undefined" ? window.location.origin.replace(window.location.port, "3001") : "")
