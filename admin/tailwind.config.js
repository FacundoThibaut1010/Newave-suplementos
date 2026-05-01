/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Barlow"', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 10px 40px -10px rgba(0,0,0,0.04)',
      },
      borderRadius: {
        '3xl': '1.5rem',
      },
      colors: {
        navy: {
          DEFAULT: '#202A36',
          light: '#2D3A4A',
        },
        gold: {
          DEFAULT: '#CAA959',
          light: '#D4B875',
        },
      },
    },
  },
  plugins: [],
}