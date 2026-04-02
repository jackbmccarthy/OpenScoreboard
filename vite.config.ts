import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Load env variables - both base (FIREBASE_*) and VITE_* prefixed
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      host: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
    // Define VITE_ variables that inherit from base Firebase variables
    // If VITE_FIREBASE_API_KEY is not set, it will use FIREBASE_API_KEY
    define: {
      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(env.VITE_FIREBASE_API_KEY || env.FIREBASE_API_KEY || ''),
      'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN || env.FIREBASE_AUTH_DOMAIN || ''),
      'import.meta.env.VITE_FIREBASE_DATABASE_URL': JSON.stringify(env.VITE_FIREBASE_DATABASE_URL || env.FIREBASE_DATABASE_URL || ''),
      'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || ''),
      'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET || env.FIREBASE_STORAGE_BUCKET || ''),
      'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID || env.FIREBASE_MESSAGING_SENDER_ID || ''),
      'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(env.VITE_FIREBASE_APP_ID || env.FIREBASE_APP_ID || ''),
      'import.meta.env.VITE_USE_LOCAL_DB': JSON.stringify(env.VITE_USE_LOCAL_DB || env.USE_LOCAL_DB || 'false'),
      'import.meta.env.VITE_ACEBASE_HOST': JSON.stringify(env.VITE_ACEBASE_HOST || env.ACEBASE_HOST || 'localhost'),
      'import.meta.env.VITE_ACEBASE_PORT': JSON.stringify(env.VITE_ACEBASE_PORT || env.ACEBASE_PORT || '8080'),
      'import.meta.env.VITE_ACEBASE_USE_SSL': JSON.stringify(env.VITE_ACEBASE_USE_SSL || env.ACEBASE_USE_SSL || 'false'),
      'import.meta.env.VITE_DATABASE_NAME': JSON.stringify(env.VITE_DATABASE_NAME || env.DATABASE_NAME || 'openscoreboard'),
    },
  }
})
