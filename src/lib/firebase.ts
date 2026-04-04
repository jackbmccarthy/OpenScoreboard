// Firebase configuration for OpenScoreboard v3
// Using Firebase SDK v8 (firebase@8.10.1)

import firebase from 'firebase/app';
import 'firebase/auth';

import {
  acebaseConfig as sharedAcebaseConfig,
  firebaseClientConfig,
  getScoreboardBaseURL,
  isCompatLocalDatabase as sharedIsLocalDatabase,
} from './env';

const firebaseConfig = firebaseClientConfig

// Only initialize Firebase if we have valid config
export const hasValidConfig = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.databaseURL?.startsWith('https://')
)

// Initialize Firebase app
if (typeof window !== 'undefined' && hasValidConfig && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export { firebaseConfig }
export default firebase;

// Check if using local database (AceBase)
export const isLocalDatabase = sharedIsLocalDatabase

// AceBase configuration for local database
export const acebaseConfig = sharedAcebaseConfig

export const subFolderPath = isLocalDatabase ? '/app' : ''

export const scoreboardBaseURL = getScoreboardBaseURL()
