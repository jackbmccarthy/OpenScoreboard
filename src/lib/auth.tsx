import firebase from 'firebase/app';
import 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { firebaseConfig } from './firebase';

// Re-export User type for convenience
export type User = firebase.User;

interface AuthContextType {
  user: firebase.User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  return firebase.auth().signInWithPopup(provider);
}

export function signInWithGoogleRedirect() {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  provider.setCustomParameters({ prompt: 'select_account' });
  return firebase.auth().signInWithRedirect(provider);
}

export function signInWithApple() {
  const provider = new firebase.auth.OAuthProvider('apple.com');
  return firebase.auth().signInWithPopup(provider);
}

export function signInWithAppleRedirect() {
  const provider = new firebase.auth.OAuthProvider('apple.com');
  return firebase.auth().signInWithRedirect(provider);
}

export function signInWithEmail(email: string, password: string) {
  return firebase.auth().signInWithEmailAndPassword(email, password);
}

export function signUpWithEmail(email: string, password: string) {
  return firebase.auth().createUserWithEmailAndPassword(email, password);
}

export function logOut() {
  return firebase.auth().signOut();
}

export function getCurrentUser() {
  return firebase.auth().currentUser;
}

export function isAuthenticated() {
  return !!firebase.auth().currentUser;
}

export function handleRedirectResult() {
  return firebase.auth().getRedirectResult();
}
