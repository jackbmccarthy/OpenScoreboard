import { AceBaseClient } from 'acebase-client';
import firebase from 'firebase';


let db;
console.log(import.meta.env)
const isLocalDatabase = import.meta.env.VITE_IS_LOCAL_DATABASE !== "true" ? false : true
if (typeof window !== "undefined" && isLocalDatabase) {
    db = new AceBaseClient({
        host: window.location.hostname,
        port: parseInt(process.env.NODE_ENV === "production" ? window.location.port : "8080"),
        dbname: import.meta.env.VITE_DATABASE_NAME || 'mydb',
        https: window.location.protocol.includes("https") ? true : false,
    });
}
else {
    //let config = getFirebaseConfig()
    firebase.initializeApp({

        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTHDOMAIN,
        databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID

    });
    db = firebase.database();
}

export default db;
