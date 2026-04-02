// Database configuration for OpenScoreboard v3
// Adapted for Vite - uses import.meta.env
// Maintains identical API as original openscoreboard-app/database.ts

import { AceBaseClient } from 'acebase-client'
import firebase from 'firebase/app'
import 'firebase/database'
import 'firebase/auth'
import { isLocalDatabase, firebaseConfig } from './firebase'

let db: AceBaseClient | firebase.database.Database | null = null

if (typeof window !== "undefined" && isLocalDatabase) {
  // Use AceBase for local database
  db = new AceBaseClient({
    host: typeof window !== "undefined" ? window.location.hostname : "localhost",
    port: parseInt(import.meta.env.VITE_ACEBASE_PORT || "8080"),
    dbname: import.meta.env.VITE_DATABASE_NAME || "openscoreboard",
    https: typeof window !== "undefined" ? window.location.protocol.includes("https") : false,
  })
} else if (typeof window !== "undefined") {
  // Use Firebase for cloud database
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig)
  }
  db = firebase.database()
}

export function authStateListener(callbackFunction: (user: firebase.User | null) => void) {
  firebase.auth().onAuthStateChanged((user) => {
    callbackFunction(user)
  })
}

export async function loginToFirebase(email: string, password: string): Promise<{
  error: boolean
  success: boolean
  errorMessage: string
  user: firebase.User | null
  isEmailVerified: boolean
}> {
  let result = {
    error: false,
    success: true,
    errorMessage: "",
    user: null as firebase.User | null,
    isEmailVerified: true
  }
  try {
    let res = await firebase.auth().signInWithEmailAndPassword(email, password)
    if (!res.user.emailVerified) {
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
  await firebase.auth().signOut()
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
