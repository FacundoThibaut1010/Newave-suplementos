
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
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
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
  plugins: [
    'tailwindcss-animate'
  ],
}
