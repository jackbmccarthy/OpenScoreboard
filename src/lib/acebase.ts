// AceBase client configuration for OpenScoreboard
// Used when isLocalDatabase is true
// Adapted for Vite

import { AceBaseClient } from 'acebase-client'
import { isLocalDatabase, acebaseConfig } from './firebase'

let db: AceBaseClient | null = null

export function getAceBaseClient(): AceBaseClient {
  if (typeof window === "undefined") {
    throw new Error("AceBaseClient can only be used in browser environment")
  }

  if (!db) {
    db = new AceBaseClient({
      host: acebaseConfig.host,
      port: acebaseConfig.port,
      dbname: acebaseConfig.dbname || "openscoreboard",
      https: acebaseConfig.ssl,
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
