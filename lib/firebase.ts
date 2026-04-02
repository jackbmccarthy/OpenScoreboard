// Firebase configuration for OpenScoreboard v3
// Using Firebase SDK v8 (firebase@8.10.1)

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // Apple OAuth requires clientId
  clientId: process.env.NEXT_PUBLIC_FIREBASE_APPLE_CLIENT_ID,
}

// Check if we're using local database (AceBase)
export const isLocalDatabase = process.env.NEXT_PUBLIC_USE_LOCAL_DB === "true"

// AceBase configuration for syncing Firebase users
export const acebaseConfig = {
  host: process.env.NEXT_PUBLIC_ACEBASE_HOST || (typeof window !== "undefined" ? window.location.hostname : "localhost"),
  port: parseInt(process.env.NEXT_PUBLIC_ACEBASE_PORT || (typeof window !== "undefined" ? window.location.port : "8080")),
  ssl: process.env.NEXT_PUBLIC_ACEBASE_USE_SSL === "true" || (typeof window !== "undefined" ? window.location.protocol.includes("https") : false),
  dbname: process.env.NEXT_PUBLIC_DATABASE_NAME || "openscoreboard",
}

export const subFolderPath = isLocalDatabase ? "/app" : ""

export const scoreboardBaseURL = process.env.NODE_ENV === "production"
  ? (typeof window !== "undefined" ? window.location.origin : "")
  : (typeof window !== "undefined" ? window.location.origin.replace(window.location.port, "3001") : "")
