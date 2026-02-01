/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: '#D4AF37',
        mint: '#A8E6CF',
        cream: '#FFF9F0',
      },
    },
  },
  plugins: [],
}

