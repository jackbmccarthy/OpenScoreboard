const parseIntOrFallback = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const firebaseClientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTHDOMAIN || '',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || process.env.VITE_FIREBASE_DATABASE_URL || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID || '',
};

export const isLocalDatabase = (process.env.NEXT_PUBLIC_USE_LOCAL_DB || process.env.VITE_USE_LOCAL_DB || '') === 'true';
export const isCompatLocalDatabase =
  (process.env.NEXT_PUBLIC_USE_LOCAL_DB ||
    process.env.VITE_USE_LOCAL_DB ||
    process.env.VITE_IS_LOCAL_DATABASE ||
    '') === 'true';

export const acebaseConfig = {
  host: process.env.NEXT_PUBLIC_ACEBASE_HOST || process.env.VITE_ACEBASE_HOST || 'localhost',
  port: parseIntOrFallback(process.env.NEXT_PUBLIC_ACEBASE_PORT || process.env.VITE_ACEBASE_PORT, 8080),
  ssl: (process.env.NEXT_PUBLIC_ACEBASE_USE_SSL || process.env.VITE_ACEBASE_USE_SSL || '') === 'true',
  dbname: process.env.NEXT_PUBLIC_DATABASE_NAME || process.env.VITE_DATABASE_NAME || 'openscoreboard',
};

export const fileUploadPath = process.env.NEXT_PUBLIC_FILE_UPLOAD_PATH || process.env.VITE_FILE_UPLOAD_PATH || '';

export const subFolderPath = isCompatLocalDatabase ? '/app' : '';

export function isProductionEnvironment() {
  return process.env.NODE_ENV === 'production';
}

export function getScoreboardBaseURL() {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.location.origin;
}
