import legacy from '@vitejs/plugin-legacy'

export default {
  envDir: '..',
  root: 'brackets',
  publicDir: '../public',
  server: {
    host: '0.0.0.0',
    port: 3003,
    strictPort: true,
    fs: {
      allow: ['..'],
    },
  },
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
  ],
  base: '/brackets/',
  build: {
    emptyOutDir: true,
    outDir: '../dist-brackets',
  },
}
