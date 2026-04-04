// Database configuration for OpenScoreboard v3.
// Client reads stay local for realtime subscriptions.
// Firebase writes are proxied through Next route handlers to preserve existing paths and payloads.

import { AceBaseClient } from 'acebase-client'
import firebase from 'firebase/app'
import 'firebase/database'
import 'firebase/auth'
import { isLocalDatabase, firebaseConfig, hasValidConfig } from './firebase'
import { runServerDatabaseActions } from './serverDatabaseClient'

let clientDb: AceBaseClient | firebase.database.Database | null = null

if (typeof window !== "undefined" && isLocalDatabase) {
  // Use AceBase for local database
  clientDb = new AceBaseClient({
    host: typeof window !== "undefined" ? window.location.hostname : "localhost",
    port: parseInt(process.env.NEXT_PUBLIC_ACEBASE_PORT || process.env.VITE_ACEBASE_PORT || "8080"),
    dbname: process.env.NEXT_PUBLIC_DATABASE_NAME || process.env.VITE_DATABASE_NAME || "openscoreboard",
    https: typeof window !== "undefined" ? window.location.protocol.includes("https") : false,
  })
} else if (typeof window !== "undefined" && hasValidConfig) {
  // Use Firebase for cloud database - only if we have valid config
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig)
    }
    clientDb = firebase.database()
  } catch (error) {
    console.error('Firebase initialization failed:', error)
    clientDb = null
  }
}

function getClientRef(path: string) {
  if (!clientDb) {
    throw new Error('Database is not initialized for the current runtime')
  }

  return clientDb.ref(path)
}

function createWriteReceipt(key?: string, value: unknown = null) {
  return {
    key,
    val() {
      return value
    }
  }
}

function createRef(path: string) {
  const clientRef = () => getClientRef(path)

  return {
    get: () => clientRef().get(),
    on: (...args: any[]) => (clientRef().on as any)(...args),
    off: (...args: any[]) => (clientRef().off as any)(...args),
    child: (childPath: string) => createRef(`${path}/${childPath}`),
    set: async (value: unknown) => {
      if (isLocalDatabase) {
        const result = await clientRef().set(value)
        return createWriteReceipt(undefined, typeof result?.val === 'function' ? result.val() : value)
      }
      const [result] = await runServerDatabaseActions([{ type: 'set', path, value }])
      return createWriteReceipt(undefined, result?.value ?? null)
    },
    update: async (value: Record<string, unknown>) => {
      if (isLocalDatabase) {
        const result = await clientRef().update(value)
        return createWriteReceipt(undefined, typeof result?.val === 'function' ? result.val() : value)
      }
      const [result] = await runServerDatabaseActions([{ type: 'update', path, value }])
      return createWriteReceipt(undefined, result?.value ?? null)
    },
    remove: async () => {
      if (isLocalDatabase) {
        const result = await clientRef().remove()
        return createWriteReceipt(undefined, typeof result?.val === 'function' ? result.val() : null)
      }
      const [result] = await runServerDatabaseActions([{ type: 'remove', path }])
      return createWriteReceipt(undefined, result?.value ?? null)
    },
    push: async (value: unknown) => {
      if (isLocalDatabase) {
        return clientRef().push(value)
      }
      const [result] = await runServerDatabaseActions([{ type: 'push', path, value }])
      return createWriteReceipt(result?.key, result?.value ?? null)
    },
  }
}

const db = {
  ref(path: string) {
    return createRef(path)
  }
}

export function authStateListener(callbackFunction: (user: firebase.User | null) => void) {
  if (hasValidConfig) {
    firebase.auth().onAuthStateChanged((user) => {
      callbackFunction(user)
    })
  } else {
    callbackFunction(null)
  }
}

export async function loginToFirebase(email: string, password: string): Promise<{
  error: boolean
  success: boolean
  errorMessage: string
  user: firebase.User | null
  isEmailVerified: boolean
}> {
  if (!hasValidConfig) {
    return {
      error: true,
      success: false,
      errorMessage: "Firebase not configured. Please set NEXT_PUBLIC_FIREBASE_* or VITE_FIREBASE_* environment variables.",
      user: null,
      isEmailVerified: false
    }
  }

  let result = {
    error: false,
    success: true,
    errorMessage: "",
    user: null as firebase.User | null,
    isEmailVerified: true
  }
  try {
    let res = await firebase.auth().signInWithEmailAndPassword(email, password)
    if (!res.user) {
      result.error = true
      result.success = false
      result.errorMessage = "Authentication failed"
    }
    else if (!res.user.emailVerified) {
      result.isEmailVerified = false
      result.errorMessage = "You must first verify your email address."
    }
    else {
      result.user = firebase.auth().currentUser
      return result
    }
  } catch (err: any) {
    switch (err.code) {
      case "auth/user-not-found":
        result.errorMessage = "Invalid Username/Password"
        break;
      case "auth/invalid-email":
        result.errorMessage = "Invalid Email"
        break;
      case "auth/wrong-password":
        result.errorMessage = "Invalid Username/Password"
        break;
      default:
        result.errorMessage = err.message
        break;
    }
    result.error = true
    result.success = false
  }
  return result
}

export async function registerToFirebase(email: string, password: string): Promise<{
  error: boolean
  success: boolean
  errorMessage: string
  user: firebase.User | null
}> {
  if (!hasValidConfig) {
    return {
      error: true,
      success: false,
      errorMessage: "Firebase not configured. Please set NEXT_PUBLIC_FIREBASE_* or VITE_FIREBASE_* environment variables.",
      user: null
    }
  }

  let result = {
    error: false,
    success: true,
    errorMessage: "",
    user: null as firebase.User | null
  }
  try {
    let res = await firebase.auth().createUserWithEmailAndPassword(email, password)
    firebase.auth().currentUser?.sendEmailVerification()
    result.user = firebase.auth().currentUser
    return result
  } catch (err: any) {
    result.error = true
    result.success = false
    switch (err.code) {
      case "auth/email-already-in-use":
        result.errorMessage = "Account already exists. Please login."
        break;
      case "auth/invalid-email":
        result.errorMessage = "Invalid Email"
        break;
      case "auth/weak-password":
        result.errorMessage = "Password must be at least 6 characters."
        break;
      default:
        result.errorMessage = err.message
        break;
    }
  }
  return result
}

export async function signOut() {
  if (hasValidConfig) {
    await firebase.auth().signOut()
  }
}

/**
 * 
 * @returns string User ID or "mylocalserver" for local database
 */
export function getUserPath(): string {
  if (isLocalDatabase) {
    return "mylocalserver"
  }
  else {
    let userPath = firebase.auth().currentUser?.uid
    if (userPath) {
      return userPath
    }
    else {
      return "anonymous"
    }
  }
}

export default db
