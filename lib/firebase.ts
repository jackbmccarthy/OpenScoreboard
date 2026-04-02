// Firebase configuration for OpenScoreboard
// This file reuses the firebase config from the original Expo app

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTHDOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
}

// Check if we're using local database (AceBase)
export const isLocalDatabase = process.env.EXPO_PUBLIC_USE_LOCAL_DB !== "true" ? false : true
export const subFolderPath = isLocalDatabase ? "/app" : ""
export const scoreboardBaseURL = process.env.NODE_ENV === "production" 
  ? (typeof window !== "undefined" ? window.location.origin : "") 
  : (typeof window !== "undefined" ? window.location.origin.replace(window.location.port, "3001") : "")
