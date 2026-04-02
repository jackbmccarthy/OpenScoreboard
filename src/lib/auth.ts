import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  signInWithRedirect,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  handleRedirectResult 
} from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { firebaseConfig } from './firebase';

export { User, handleRedirectResult };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider('apple.com');

googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Auth Provider Context
interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
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
  return signInWithPopup(auth, googleProvider);
}

export function signInWithGoogleRedirect() {
  return signInWithRedirect(auth, googleProvider);
}

export function signInWithApple() {
  return signInWithPopup(auth, appleProvider);
}

export function signInWithAppleRedirect() {
  return signInWithRedirect(auth, appleProvider);
}

export function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function signUpWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function logOut() {
  return firebaseSignOut(auth);
}

export function getCurrentUser() {
  return auth.currentUser;
}

export function isAuthenticated() {
  return !!auth.currentUser;
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
