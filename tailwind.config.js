/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2F7A52',
        surface: 'var(--surface)',
        text: 'var(--text)'
      },
      boxShadow: {
        card: 'var(--shadow)'
      },
      borderColor: {
        DEFAULT: 'var(--border)'
      }
    },
  },
  darkMode: ['class', '[data-theme="dark"]'],
  plugins: [],
}
