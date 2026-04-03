// Firebase configuration for OpenScoreboard v3
// Using Firebase SDK v8 (firebase@8.10.1)

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
}

// Only initialize Firebase if we have valid config
export const hasValidConfig = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.databaseURL?.startsWith('https://')
)

export { firebaseConfig }

// Check if using local database (AceBase)
export const isLocalDatabase = import.meta.env.VITE_USE_LOCAL_DB === "true"

// AceBase configuration for local database
export const acebaseConfig = {
  host: import.meta.env.VITE_ACEBASE_HOST || 'localhost',
  port: parseInt(import.meta.env.VITE_ACEBASE_PORT || '8080'),
  ssl: import.meta.env.VITE_ACEBASE_USE_SSL === 'true',
  dbname: import.meta.env.VITE_DATABASE_NAME || 'openscoreboard',
}

export const subFolderPath = isLocalDatabase ? '/app' : ''

export const scoreboardBaseURL = import.meta.env.NODE_ENV === 'production'
  ? (typeof window !== 'undefined' ? window.location.origin : '')
  : (typeof window !== 'undefined' ? window.location.origin.replace(window.location.port, '3001') : '')
