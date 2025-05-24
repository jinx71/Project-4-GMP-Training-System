/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1C2733',
        navy: '#1B4F72',
        navydeep: '#143A56',
        paper: '#F4F6F7',
        passed: '#0E7C57',
        pending: '#B45309',
        assigned: '#1A6FA3',
        failed: '#B3261E'
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace']
      }
    }
  },
  plugins: []
};
