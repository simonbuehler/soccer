/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {
      screens: {
        'print': {'raw': 'print'},
      },
      keyframes: {
        'pulse-scale': {
          '0%, 100%': { transform: 'translate(-50%, -50%) scale(1)' },
          '50%': { transform: 'translate(-50%, -50%) scale(1.25)' }, // Zentrierung beibehalten und Skalierung angepasst
        },
      },
      animation: {
        'pulse-scale': 'pulse-scale 1s infinite ease-in-out',
      },
    },
  },
  plugins: [],
}
