import legacy from '@vitejs/plugin-legacy'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

export default {
  envDir: '..',
  server: {
    port:3001,
    strictPort:true,
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..'],
    },
  },
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
  ],
  base:"/scoreboard/",
  build: {
    rollupOptions: {
      input: {
        main: resolve(rootDir, 'index.html'),
        brackets: resolve(rootDir, 'brackets/index.html'),
        groups: resolve(rootDir, 'groups/index.html'),
      },
    },
  },
  
}
