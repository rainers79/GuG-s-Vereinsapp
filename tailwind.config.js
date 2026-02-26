/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',

  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {

      /* ===============================
         DESIGN TOKENS
      =============================== */

      colors: {

        brand: {
          gold: '#B5A47A',
          dark: '#1A1A1A',
        },

        pos: {
          background: '#F4F1E8',
          surface: '#FFFFFF',
          border: '#E5E2D8',

          text: '#1A1A1A',
          muted: '#6B7280',

          primary: '#1A1A1A',
          accent: '#B5A47A',

          food: '#C97A40',
          drink: '#3A6EA5',
          gug: '#2E8B57',

          danger: '#C0392B',
          success: '#2E8B57'
        }
      },

      borderRadius: {
        pos: '18px',
        posSm: '12px',
        posLg: '22px'
      },

      boxShadow: {
        pos: '0 4px 20px rgba(0,0,0,0.05)',
        posHover: '0 6px 28px rgba(0,0,0,0.08)'
      },

      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },

      screens: {
        'xs': '480px',
      },
    },
  },

  plugins: [],
}
