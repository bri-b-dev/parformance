/** @type {import('tailwindcss').Config} */
// Design tokens live in src/assets/theme.css (:root / [data-theme="dark"]); Tailwind only references them.
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        'primary-ink': 'var(--primary-ink)',
        surface: 'var(--surface)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        'app-bg': 'var(--bg)',
        'app-sub': 'var(--muted)',
        danger: 'var(--danger)',
        'danger-ink': 'var(--danger-ink)',
      },
      boxShadow: {
        card: 'var(--shadow)'
      },
      borderColor: {
        DEFAULT: 'var(--border)',
        strong: 'var(--border-strong)'
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        pill: 'var(--radius-pill)'
      },
      zIndex: {
        header: 'var(--z-header)',
        overlay: 'var(--z-overlay)',
        sheet: 'var(--z-sheet)',
        modal: 'var(--z-modal)'
      }
    },
  },
  darkMode: ['class', '[data-theme="dark"]'],
  plugins: [],
}
