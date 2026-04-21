/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-syne)', 'sans-serif'],
        mono: ['var(--font-dm-mono)', 'monospace'],
      },
      colors: {
        bg: '#0d0d0f',
        surface: '#161618',
        surface2: '#1e1e21',
        border: 'rgba(255,255,255,0.08)',
        border2: 'rgba(255,255,255,0.14)',
        accent: '#7c5cfc',
        accent2: '#a78bfa',
        muted: '#888888',
      },
    },
  },
  plugins: [],
}
