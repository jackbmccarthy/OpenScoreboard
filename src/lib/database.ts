// Database configuration for OpenScoreboard v3.
// Client reads stay local for realtime subscriptions.
// Firebase writes are proxied through Next route handlers to preserve existing paths and payloads.

import { AceBaseClient } from 'acebase-client'
import firebase from 'firebase/app'
import 'firebase/database'
import 'firebase/auth'
import { isLocalDatabase, firebaseConfig, hasValidConfig } from './firebase'
import { getCurrentCapabilityToken } from './capabilitySession'
import { runServerDatabaseActions } from './serverDatabaseClient'
import type {
  ArchivedMatchSummary,
  Match as MatchRecord,
  MatchPlayerKey,
  MatchSide,
  Player,
  ScheduledMatch,
  Table as TableRecord,
  TeamMatch,
} from '@/types/matches'

export type DatabaseSnapshot<T> = {
  val(): T
}

export type DatabaseWriteReceipt<T> = {
  key?: string
  val(): T | null
}

export type DatabaseRef<T = any> = {
  get(): Promise<DatabaseSnapshot<T | null>>
  on(event: string, callback: (snapshot: DatabaseSnapshot<T | null>) => void, ...args: unknown[]): unknown
  off(...args: unknown[]): unknown
  child<TChild = unknown>(childPath: string): DatabaseRef<TChild>
  set(value: T): Promise<DatabaseWriteReceipt<T>>
  compareSet(expected: unknown, value: T): Promise<DatabaseWriteReceipt<T>>
  update(value: Partial<T> & Record<string, unknown>): Promise<DatabaseWriteReceipt<Partial<T>>>
  remove(): Promise<DatabaseWriteReceipt<null>>
  push(value: T): Promise<DatabaseWriteReceipt<T>>
}

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

function createWriteReceipt<T>(key?: string, value: T | null = null) {
  return {
    key,
    val() {
      return value
    }
  }
}

function createReadSnapshot<T>(value: T) {
  return {
    val() {
      return value
    }
  }
}

function shouldUseServerReadProxy() {
  if (isLocalDatabase) {
    return false
  }

  const capabilityToken = getCurrentCapabilityToken()
  if (!capabilityToken) {
    return false
  }

  const currentUser = firebase.apps.length ? firebase.auth().currentUser : null
  return !currentUser
}

function createRef<T = any>(path: string): DatabaseRef<T> {
  const clientRef = () => getClientRef(path)
  const pollingIntervals = new Set<number>()

  const readViaServer = async () => {
    const [result] = await runServerDatabaseActions<T>([{ type: 'get', path }])
    return createReadSnapshot<T | null>(result?.value ?? null)
  }

  const clearPollingIntervals = () => {
    for (const intervalID of pollingIntervals) {
      window.clearInterval(intervalID)
    }
    pollingIntervals.clear()
  }

  return {
    get: async () => {
      if (shouldUseServerReadProxy()) {
        return readViaServer()
      }
      return clientRef().get() as Promise<DatabaseSnapshot<T | null>>
    },
    on: (event: string, callback: (snapshot: DatabaseSnapshot<T | null>) => void, ...args: unknown[]) => {
      if (shouldUseServerReadProxy() && event === 'value' && typeof window !== 'undefined') {
        const poll = async () => {
          const snapshot = await readViaServer()
          callback(snapshot)
        }
        void poll()
        const intervalID = window.setInterval(() => {
          void poll()
        }, 1500)
        pollingIntervals.add(intervalID)
        return callback
      }
      return (clientRef().on as (...onArgs: unknown[]) => unknown)(event, callback, ...args)
    },
    off: (...args: unknown[]) => {
      if (pollingIntervals.size > 0 && typeof window !== 'undefined') {
        clearPollingIntervals()
        return
      }
      return (clientRef().off as (...offArgs: unknown[]) => unknown)(...args)
    },
    child: <TChild = unknown>(childPath: string) => createRef<TChild>(`${path}/${childPath}`),
    set: async (value: T) => {
      if (isLocalDatabase) {
        const result = await clientRef().set(value)
        return createWriteReceipt<T>(undefined, typeof result?.val === 'function' ? result.val() as T : value)
      }
      const [result] = await runServerDatabaseActions<T>([{ type: 'set', path, value }])
      return createWriteReceipt<T>(undefined, result?.value ?? null)
    },
    compareSet: async (expected: unknown, value: T) => {
      const [result] = await runServerDatabaseActions<T>([{ type: 'compareSet', path, expected, value }])
      return createWriteReceipt<T>(undefined, result?.value ?? null)
    },
    update: async (value: Partial<T> & Record<string, unknown>) => {
      if (isLocalDatabase) {
        const result = await clientRef().update(value)
        return createWriteReceipt<Partial<T>>(undefined, typeof result?.val === 'function' ? result.val() as Partial<T> : value)
      }
      const [result] = await runServerDatabaseActions<Partial<T>>([{ type: 'update', path, value }])
      return createWriteReceipt<Partial<T>>(undefined, result?.value ?? null)
    },
    remove: async () => {
      if (isLocalDatabase) {
        const result = await clientRef().remove()
        return createWriteReceipt<null>(undefined, typeof result?.val === 'function' ? result.val() as null : null)
      }
      const [result] = await runServerDatabaseActions<null>([{ type: 'remove', path }])
      return createWriteReceipt<null>(undefined, result?.value ?? null)
    },
    push: async (value: T) => {
      if (isLocalDatabase) {
        return clientRef().push(value) as unknown as Promise<DatabaseWriteReceipt<T>>
      }
      const [result] = await runServerDatabaseActions<T>([{ type: 'push', path, value }])
      return createWriteReceipt<T>(result?.key, result?.value ?? null)
    },
  }
}

const db = {
  ref<T = any>(path: string) {
    return createRef<T>(path)
  }
}

export async function getValue<T>(path: string) {
  const snapshot = await db.ref<T>(path).get()
  return snapshot.val()
}

export async function getNumberValue(path: string, fallback = 0) {
  const value = await getValue<number | string>(path)
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export async function getStringValue(path: string, fallback = '') {
  const value = await getValue<string>(path)
  return typeof value === 'string' ? value : fallback
}

export function setValue<T>(path: string, value: T) {
  return db.ref<T>(path).set(value)
}

export function updateValue<T extends Record<string, unknown>>(path: string, value: Partial<T>) {
  return db.ref<T>(path).update(value)
}

export function pushValue<T>(path: string, value: T) {
  return db.ref<T>(path).push(value)
}

type FirebaseAuthError = {
  code?: string
  message?: string
}

function getFirebaseAuthError(error: unknown): FirebaseAuthError {
  if (error && typeof error === 'object') {
    return error as FirebaseAuthError
  }
  return {}
}

export function matchPath(matchID: string) {
  return `matches/${matchID}`
}

export function matchScorePath(matchID: string, gameNumber: number, side: MatchSide) {
  return `${matchPath(matchID)}/game${gameNumber}${side}Score`
}

export function matchPlayerPath(matchID: string, playerKey: MatchPlayerKey) {
  return `${matchPath(matchID)}/${playerKey}`
}

export function tablePath(tableID: string) {
  return `tables/${tableID}`
}

export function teamMatchPath(teamMatchID: string) {
  return `teamMatches/${teamMatchID}`
}

export function matchRef(matchID: string) {
  return db.ref<MatchRecord>(matchPath(matchID))
}

export function matchScoreRef(matchID: string, gameNumber: number, side: MatchSide) {
  return db.ref<number>(matchScorePath(matchID, gameNumber, side))
}

export function matchPlayerRef(matchID: string, playerKey: MatchPlayerKey) {
  return db.ref<Player>(matchPlayerPath(matchID, playerKey))
}

export function tableRef(tableID: string) {
  return db.ref<TableRecord>(tablePath(tableID))
}

export function tableCurrentMatchRef(tableID: string) {
  return db.ref<string>(`${tablePath(tableID)}/currentMatch`)
}

export function scheduledTableMatchesRef(tableID: string) {
  return db.ref<Record<string, ScheduledMatch>>(`${tablePath(tableID)}/scheduledMatches`)
}

export function archivedTableMatchesRef(tableID: string) {
  return db.ref<Record<string, ArchivedMatchSummary>>(`${tablePath(tableID)}/archivedMatches`)
}

export function teamMatchRef(teamMatchID: string) {
  return db.ref<TeamMatch>(teamMatchPath(teamMatchID))
}

export function archivedTeamMatchesRef(teamMatchID: string) {
  return db.ref<Record<string, ArchivedMatchSummary>>(`${teamMatchPath(teamMatchID)}/archivedMatches`)
}

export function rootUpdateRef() {
  return db.ref<Record<string, unknown>>('')
}

export function getMatchValue(matchID: string) {
  return getValue<MatchRecord>(matchPath(matchID))
}

export function getTableValue(tableID: string) {
  return getValue<TableRecord>(tablePath(tableID))
}

export function getTeamMatchValue(teamMatchID: string) {
  return getValue<TeamMatch>(teamMatchPath(teamMatchID))
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
  } catch (err: unknown) {
    const authError = getFirebaseAuthError(err)
    switch (authError.code) {
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
        result.errorMessage = authError.message || "Authentication failed"
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
  } catch (err: unknown) {
    const authError = getFirebaseAuthError(err)
    result.error = true
    result.success = false
    switch (authError.code) {
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
        result.errorMessage = authError.message || "Registration failed"
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
