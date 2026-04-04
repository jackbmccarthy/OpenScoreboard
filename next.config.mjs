import path from 'path';

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  outputFileTracingRoot: path.resolve(process.cwd()),
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? process.env.VITE_FIREBASE_API_KEY ?? '',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? process.env.VITE_FIREBASE_AUTH_DOMAIN ?? process.env.VITE_FIREBASE_AUTHDOMAIN ?? '',
    NEXT_PUBLIC_FIREBASE_DATABASE_URL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ?? process.env.VITE_FIREBASE_DATABASE_URL ?? '',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? process.env.VITE_FIREBASE_PROJECT_ID ?? '',
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? process.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? process.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? process.env.VITE_FIREBASE_APP_ID ?? '',
    NEXT_PUBLIC_USE_LOCAL_DB: process.env.NEXT_PUBLIC_USE_LOCAL_DB ?? process.env.VITE_USE_LOCAL_DB ?? 'false',
    NEXT_PUBLIC_ACEBASE_HOST: process.env.NEXT_PUBLIC_ACEBASE_HOST ?? process.env.VITE_ACEBASE_HOST ?? 'localhost',
    NEXT_PUBLIC_ACEBASE_PORT: process.env.NEXT_PUBLIC_ACEBASE_PORT ?? process.env.VITE_ACEBASE_PORT ?? '8080',
    NEXT_PUBLIC_ACEBASE_USE_SSL: process.env.NEXT_PUBLIC_ACEBASE_USE_SSL ?? process.env.VITE_ACEBASE_USE_SSL ?? 'false',
    NEXT_PUBLIC_DATABASE_NAME: process.env.NEXT_PUBLIC_DATABASE_NAME ?? process.env.VITE_DATABASE_NAME ?? 'openscoreboard',
    NEXT_PUBLIC_FILE_UPLOAD_PATH: process.env.NEXT_PUBLIC_FILE_UPLOAD_PATH ?? process.env.VITE_FILE_UPLOAD_PATH ?? '',
    NEXT_PUBLIC_IS_LOCAL_DATABASE: process.env.NEXT_PUBLIC_IS_LOCAL_DATABASE ?? process.env.VITE_IS_LOCAL_DATABASE ?? 'false',
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(process.cwd(), 'src');
    config.resolve.alias['react-router-dom'] = path.resolve(process.cwd(), 'src/lib/router.tsx');
    return config;
  },
};

export default nextConfig;
