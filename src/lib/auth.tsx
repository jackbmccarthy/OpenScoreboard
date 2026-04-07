import firebase from 'firebase/app';
import 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { hasValidConfig, isLocalDatabase } from './firebase';

// Re-export User type for convenience
export type User = firebase.User;

interface AuthContextType {
  user: firebase.User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });
const localUser = {
  uid: 'mylocalserver',
  email: 'local@openscoreboard.dev',
  displayName: 'Local User',
} as firebase.User;

function missingFirebaseConfigError() {
  return new Error('Firebase auth is not configured. Set the NEXT_PUBLIC_FIREBASE_* environment variables for this environment.');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLocalDatabase) {
      setUser(localUser);
      setLoading(false);
      return undefined;
    }

    if (!hasValidConfig) {
      setUser(null);
      setLoading(false);
      return undefined;
    }

    const unsubscribe = firebase.auth().onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function signInWithGoogle() {
  if (!hasValidConfig) {
    return Promise.reject(missingFirebaseConfigError());
  }
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  return firebase.auth().signInWithPopup(provider);
}

export function signInWithGoogleRedirect() {
  if (!hasValidConfig) {
    return Promise.reject(missingFirebaseConfigError());
  }
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  provider.setCustomParameters({ prompt: 'select_account' });
  return firebase.auth().signInWithRedirect(provider);
}

export function signInWithApple() {
  if (!hasValidConfig) {
    return Promise.reject(missingFirebaseConfigError());
  }
  const provider = new firebase.auth.OAuthProvider('apple.com');
  return firebase.auth().signInWithPopup(provider);
}

export function signInWithAppleRedirect() {
  if (!hasValidConfig) {
    return Promise.reject(missingFirebaseConfigError());
  }
  const provider = new firebase.auth.OAuthProvider('apple.com');
  return firebase.auth().signInWithRedirect(provider);
}

export function signInWithEmail(email: string, password: string) {
  if (!hasValidConfig) {
    return Promise.reject(missingFirebaseConfigError());
  }
  return firebase.auth().signInWithEmailAndPassword(email, password);
}

export function signUpWithEmail(email: string, password: string) {
  if (!hasValidConfig) {
    return Promise.reject(missingFirebaseConfigError());
  }
  return firebase.auth().createUserWithEmailAndPassword(email, password);
}

export function logOut() {
  if (isLocalDatabase || !hasValidConfig) {
    return Promise.resolve();
  }
  return firebase.auth().signOut();
}

export function getCurrentUser() {
  if (isLocalDatabase) {
    return localUser;
  }
  if (!hasValidConfig) {
    return null;
  }
  return firebase.auth().currentUser;
}

export function isAuthenticated() {
  if (isLocalDatabase) {
    return true;
  }
  if (!hasValidConfig) {
    return false;
  }
  return !!firebase.auth().currentUser;
}

export function handleRedirectResult() {
  if (!hasValidConfig) {
    return Promise.reject(missingFirebaseConfigError());
  }
  return firebase.auth().getRedirectResult();
}
