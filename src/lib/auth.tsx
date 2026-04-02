// Auth helper functions for OpenScoreboard v3
// Uses Firebase SDK v8 directly
// Adapted for Vite

import { firebaseConfig, acebaseConfig } from './firebase'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

// Firebase v8 imports (using namespace import style)
import firebase from 'firebase/app'
import 'firebase/auth'

// Initialize Firebase app only once
let firebaseApp: firebase.app.App | null = null

/**
 * Get or initialize Firebase app instance
 */
export function getFirebaseApp(): firebase.app.App {
  if (!firebaseApp) {
    firebaseApp = firebase.initializeApp(firebaseConfig)
  }
  return firebaseApp
}

/**
 * Get Firebase Auth instance
 */
export function getFirebaseAuth(): firebase.auth.Auth {
  return firebase.auth()
}

/**
 * Sync Firebase user to AceBase
 * Stores user info and returns AceBase auth token
 */
export async function syncUserToAceBase(firebaseUser: firebase.User): Promise<string | null> {
  try {
    const { AceBaseClient } = await import('acebase-client')
    
    const db = new AceBaseClient({
      host: acebaseConfig.host,
      port: acebaseConfig.port,
      dbname: acebaseConfig.dbname,
      https: acebaseConfig.ssl,
    })

    // Store user info in AceBase
    await db.ref(`users/${firebaseUser.uid}`).set({
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      firebaseUid: firebaseUser.uid,
      lastLogin: new Date().toISOString(),
      provider: firebaseUser.providerData.map(p => p.providerId).join(','),
    })

    // Get Firebase ID token for AceBase auth
    const idToken = await firebaseUser.getIdToken()

    // Sign in to AceBase with Firebase token
    try {
      const acebaseAuth = db.auth()
      const acebaseToken = await acebaseAuth.signInWithCustomToken(idToken)
      return acebaseToken.token
    } catch {
      // If AceBase doesn't support custom token auth, just return the Firebase token
      return idToken
    }
  } catch (error) {
    console.error('Failed to sync user to AceBase:', error)
    return null
  }
}

/**
 * Sign in with Google using popup
 */
export async function signInWithGoogle(): Promise<firebase.User> {
  const auth = getFirebaseAuth()
  const provider = new firebase.auth.GoogleAuthProvider()
  provider.addScope('email')
  provider.addScope('profile')
  
  const result = await auth.signInWithPopup(provider)
  await syncUserToAceBase(result.user)
  return result.user
}

/**
 * Sign in with Apple using popup
 */
export async function signInWithApple(): Promise<firebase.User> {
  const auth = getFirebaseAuth()
  const provider = new firebase.auth.OAuthProvider('apple.com')
  provider.addScope('email')
  provider.addScope('name')
  
  const result = await auth.signInWithPopup(provider)
  await syncUserToAceBase(result.user)
  return result.user
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<firebase.User> {
  const auth = getFirebaseAuth()
  const result = await auth.signInWithEmailAndPassword(email, password)
  await syncUserToAceBase(result.user)
  return result.user
}

/**
 * Create new account with email and password
 */
export async function signUpWithEmail(email: string, password: string): Promise<firebase.User> {
  const auth = getFirebaseAuth()
  const result = await auth.createUserWithEmailAndPassword(email, password)
  await syncUserToAceBase(result.user)
  return result.user
}

/**
 * Sign out
 */
export async function logOut(): Promise<void> {
  const auth = getFirebaseAuth()
  await auth.signOut()
}

/**
 * Get current user
 */
export function getCurrentUser(): firebase.User | null {
  const auth = getFirebaseAuth()
  return auth.currentUser
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null
}

/**
 * Handle redirect result (for OAuth redirects)
 */
export async function handleRedirectResult(): Promise<firebase.User | null> {
  const auth = getFirebaseAuth()
  try {
    const result = await auth.getRedirectResult()
    if (result?.user) {
      await syncUserToAceBase(result.user)
      return result.user
    }
  } catch (error) {
    console.error('Redirect result error:', error)
  }
  return null
}

// React Auth Context
interface AuthContextType {
  user: firebase.User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<firebase.User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined") {
      setLoading(false)
      return
    }

    // Initialize Firebase app if not already initialized
    try {
      getFirebaseApp()
    } catch (e) {
      // App already initialized
    }

    const auth = getFirebaseAuth()
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        await syncUserToAceBase(firebaseUser)
      }
      setUser(firebaseUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

// Re-export Firebase types for convenience
export type { firebase }
