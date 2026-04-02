import { AceBaseClient } from 'acebase-client';
import firebase from 'firebase';

// Firebase configuration from environment
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isLocalDatabase = process.env.NEXT_PUBLIC_USE_LOCAL_DB === "true";

let db: any;

if (typeof window !== "undefined" && isLocalDatabase) {
  // Use AceBase for local database
  db = new AceBaseClient({
    host: typeof window !== "undefined" ? window.location.hostname : "localhost",
    port: parseInt(process.env.NEXT_PUBLIC_ACEBASE_PORT || "8080"),
    dbname: process.env.NEXT_PUBLIC_DATABASE_NAME || "openscoreboard",
    https: typeof window !== "undefined" ? window.location.protocol.includes("https") : false,
  });
} else {
  // Use Firebase for cloud database
  if (typeof window !== "undefined" && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  db = firebase.database();
}

export default db;
