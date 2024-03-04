// vite.config.js
import legacy from '@vitejs/plugin-legacy'

export default {
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
  
}