/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'openscoreboard-primary': '#000000',
        'openscoreboard-secondary': '#0028ff',
        'openscoreboard-action': '#ff1122',
      },
    },
  },
  plugins: [],
}
