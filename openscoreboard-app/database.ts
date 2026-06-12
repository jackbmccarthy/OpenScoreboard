import { AceBaseClient } from 'acebase-client';
import { getFirebaseConfig, isFirebaseAuthRequired, isLocalDatabase } from './openscoreboard.config';
import firebase from 'firebase';

let firebaseConfig = getFirebaseConfig()
let db: AceBaseClient | firebase.database.Database
let firebaseApp = isFirebaseAuthRequired ? (firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig)) : null
const legacyLocalUserPath = "mylocalserver"
const activeAuthProviderStorageKey = "openscoreboard.activeAuthProvider"
let activeLocalUserPath = legacyLocalUserPath
let activeAuthProvider = ""

if (typeof window !== "undefined" && isLocalDatabase) {
    db = new AceBaseClient({
        host: window.location.hostname,
        port: process.env.NODE_ENV === "production" ? parseInt(window.location.port) : 8080,
        dbname: process.env.EXPO_PUBLIC_DATABASE_NAME || "mydb",
        https: window.location.protocol.includes("https") ? true : false,
    });
}
else {
    const analytics = firebase.analytics(firebaseApp)
    db = firebase.database()
}

export function authStateListener(callbackFunction) {
    if (!isFirebaseAuthRequired) {
        return () => { }
    }

    return firebase.auth().onAuthStateChanged((user) => {
        callbackFunction(user)
    })
}

export async function loginToFirebase(email, password) {
    let result = {
        error: false,
        success: true,
        errorMessage: "",
        user: {},
        isEmailVerified: true
    }
    try {
        let res = await firebase.auth().signInWithEmailAndPassword(email, password)
        if (!res.user.emailVerified) {
            result.isEmailVerified = false
            result.success = false
            result.error = true
            result.errorMessage = "You must first verify your email address."
            result.user = firebase.auth().currentUser
            setActiveAuthProvider(firebase.auth.EmailAuthProvider.PROVIDER_ID)
        }
        else {
            setActiveAuthProvider(firebase.auth.EmailAuthProvider.PROVIDER_ID)
            result.user = firebase.auth().currentUser
            return result
        }
    } catch (err) {
        result.success = false
        result.error = true
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
    }



    return result

}

export async function loginToFirebaseWithGoogle() {
    let result = {
        error: false,
        success: true,
        errorMessage: "",
        user: {}
    }

    try {
        const provider = new firebase.auth.GoogleAuthProvider()
        const authResult = await firebase.auth().signInWithPopup(provider)
        const providerId = authResult?.additionalUserInfo?.providerId ||
            authResult?.credential?.providerId ||
            firebase.auth.GoogleAuthProvider.PROVIDER_ID

        setActiveAuthProvider(providerId)
        result.user = firebase.auth().currentUser
        return result
    }
    catch (err) {
        result.success = false
        result.error = true

        switch (err.code) {
            case "auth/popup-closed-by-user":
                result.errorMessage = "Google sign in was closed before it finished."
                break;
            case "auth/popup-blocked":
                result.errorMessage = "Your browser blocked the Google sign in popup."
                break;
            case "auth/account-exists-with-different-credential":
                result.errorMessage = "An account already exists with this email using a different sign in method."
                break;
            default:
                result.errorMessage = err.message
                break;
        }
    }

    return result
}

export async function registerToFirebase(email, password) {
    let result = {
        error: false,
        success: true,
        errorMessage: "",
        user: {},
        isEmailVerified: false
    }
    try {
        let res = await firebase.auth().createUserWithEmailAndPassword(email, password)
        await res.user.sendEmailVerification()
        result.user = firebase.auth().currentUser
        setActiveAuthProvider(firebase.auth.EmailAuthProvider.PROVIDER_ID)
        return result
    } catch (err) {
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

export async function sendFirebasePasswordResetEmail(email) {
    await firebase.auth().sendPasswordResetEmail(email)
}

export async function signOut() {
    if (!isFirebaseAuthRequired) {
        return
    }

    setActiveAuthProvider("")
    return firebase.auth().signOut()
}

export function setActiveAuthProvider(providerId) {
    activeAuthProvider = providerId || ""

    if (typeof window === "undefined") {
        return
    }

    if (activeAuthProvider) {
        window.sessionStorage?.setItem(activeAuthProviderStorageKey, activeAuthProvider)
    }
    else {
        window.sessionStorage?.removeItem(activeAuthProviderStorageKey)
    }
}

export function getActiveAuthProvider() {
    if (activeAuthProvider) {
        return activeAuthProvider
    }

    if (typeof window === "undefined") {
        return ""
    }

    return window.sessionStorage?.getItem(activeAuthProviderStorageKey) || ""
}

export function getCurrentUser() {
    if (!isFirebaseAuthRequired) {
        return null
    }

    return firebase.auth().currentUser
}

export async function reloadCurrentUser() {
    const user = getCurrentUser()

    if (!user) {
        return null
    }

    await user.reload()
    return getCurrentUser()
}

export async function updateCurrentUserProfile(profile) {
    const user = getCurrentUser()

    if (!user) {
        throw new Error("You must be signed in to update your profile.")
    }

    await user.updateProfile(profile)
    return await reloadCurrentUser()
}

export async function uploadCurrentUserProfilePhoto(file) {
    const user = getCurrentUser()

    if (!user) {
        throw new Error("You must be signed in to upload a profile photo.")
    }

    if (!firebaseConfig.storageBucket) {
        const err = new Error("Firebase Storage bucket is not configured.")
        err.code = "storage/bucket-not-found"
        throw err
    }

    const extension = file.name?.includes(".") ? `.${file.name.split(".").pop()}` : ""
    const photoRef = firebase.storage().ref(`users/${user.uid}/profile/photo-${Date.now()}${extension}`)
    let photoURL = ""

    try {
        await photoRef.put(file, {
            contentType: file.type || undefined,
        })
        photoURL = await photoRef.getDownloadURL()
        await updateCurrentUserProfile({
            displayName: user.displayName || "",
            photoURL,
        })
    }
    catch (err) {
        if (err?.code === "storage/unknown" && err?.serverResponse?.includes("404")) {
            err.code = "storage/bucket-not-found"
        }

        throw err
    }

    return photoURL
}

export async function sendCurrentUserEmailVerification() {
    const user = getCurrentUser()

    if (!user) {
        throw new Error("You must be signed in to send a verification email.")
    }

    await user.sendEmailVerification()
}

export async function sendCurrentUserPasswordResetEmail() {
    const user = getCurrentUser()

    if (!user?.email) {
        throw new Error("Your account does not have an email address.")
    }

    await firebase.auth().sendPasswordResetEmail(user.email)
}

export async function updateCurrentUserEmail(email) {
    const user = getCurrentUser()

    if (!user) {
        throw new Error("You must be signed in to update your email.")
    }

    await user.updateEmail(email)
    return await reloadCurrentUser()
}

export async function updateCurrentUserPassword(password) {
    const user = getCurrentUser()

    if (!user) {
        throw new Error("You must be signed in to update your password.")
    }

    await user.updatePassword(password)
}

function isMergeableObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value)
}

function mergeUserData(legacyData, currentData) {
    if (!isMergeableObject(legacyData)) {
        return currentData ?? legacyData
    }

    if (!isMergeableObject(currentData)) {
        return legacyData
    }

    return Object.entries(legacyData).reduce((mergedData, [key, legacyValue]) => {
        const currentValue = mergedData[key]

        if (isMergeableObject(legacyValue) && isMergeableObject(currentValue)) {
            mergedData[key] = mergeUserData(legacyValue, currentValue)
        }
        else if (currentValue === undefined || currentValue === null) {
            mergedData[key] = legacyValue
        }

        return mergedData
    }, { ...currentData })
}

async function migrateReferencedOwnerFields(userData, userID) {
    if (!isMergeableObject(userData)) {
        return
    }

    const updates = []

    if (isMergeableObject(userData.myTables)) {
        updates.push(...Object.values(userData.myTables)
            .filter((tableID) => typeof tableID === "string" && tableID.length > 0)
            .map((tableID) => db.ref(`tables/${tableID}/creatorID`).set(userID)))
    }

    if (isMergeableObject(userData.myScoreboards)) {
        updates.push(...Object.values(userData.myScoreboards)
            .map((scoreboard) => scoreboard?.id)
            .filter((scoreboardID) => typeof scoreboardID === "string" && scoreboardID.length > 0)
            .map((scoreboardID) => db.ref(`scoreboards/${scoreboardID}/ownerID`).set(userID)))
    }

    if (isMergeableObject(userData.mydynamicurls)) {
        updates.push(...Object.values(userData.mydynamicurls)
            .map((dynamicURL) => dynamicURL?.id)
            .filter((dynamicURLID) => typeof dynamicURLID === "string" && dynamicURLID.length > 0)
            .map((dynamicURLID) => db.ref(`dynamicurls/${dynamicURLID}/owner`).set(userID)))
    }

    await Promise.all(updates)
}

export async function migrateLocalUserDataToFirebaseUser(user = getCurrentUser()) {
    if (!isFirebaseAuthRequired || !isLocalDatabase || !user?.uid || user.uid === legacyLocalUserPath) {
        return
    }

    const userID = user.uid
    const legacyUserRef = db.ref(`users/${legacyLocalUserPath}`)
    const firebaseUserRef = db.ref(`users/${userID}`)
    const [legacyUserSnap, firebaseUserSnap] = await Promise.all([
        legacyUserRef.get(),
        firebaseUserRef.get(),
    ])
    const legacyUserData = legacyUserSnap.val()
    const firebaseUserData = firebaseUserSnap.val()
    const migratedUserData = mergeUserData(legacyUserData, firebaseUserData)

    if (legacyUserData !== null && legacyUserData !== undefined) {
        await firebaseUserRef.set(migratedUserData)
    }

    activeLocalUserPath = userID

    if (legacyUserData !== null && legacyUserData !== undefined) {
        try {
            await legacyUserRef.remove()
        }
        catch (err) {
            console.error(err)
        }
    }

    try {
        await migrateReferencedOwnerFields(migratedUserData, userID)
    }
    catch (err) {
        console.error(err)
    }
}


/**
 * 
 * @returns string User ID
 */
export function getUserPath() {
    if (isLocalDatabase) {
        return activeLocalUserPath
    }
    else {
        let userPath = firebase.auth().currentUser?.uid
        if (userPath) {
            return userPath
        }
        else {
            return false
        }

    }


}





export default db
