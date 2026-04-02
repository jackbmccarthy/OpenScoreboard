// AceBase client configuration for OpenScoreboard
// Used when isLocalDatabase is true

import { AceBaseClient } from 'acebase-client'

let db: AceBaseClient | null = null

export function getAceBaseClient(): AceBaseClient {
  if (typeof window === "undefined") {
    throw new Error("AceBaseClient can only be used in browser environment")
  }

  if (!db) {
    db = new AceBaseClient({
      host: window.location.hostname,
      port: process.env.NODE_ENV === "production" ? parseInt(window.location.port) : 8080,
      dbname: process.env.EXPO_PUBLIC_DATABASE_NAME || "mydb",
      https: window.location.protocol.includes("https") ? true : false,
    })
  }
  
  return db
}

export function getUserPath(userId?: string): string {
  if (isLocalDatabase) {
    return "mylocalserver"
  }
  return userId || "anonymous"
}

// Re-export isLocalDatabase from firebase config
export { isLocalDatabase, subFolderPath, scoreboardBaseURL } from './firebase'
