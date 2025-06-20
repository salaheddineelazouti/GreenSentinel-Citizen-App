/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#E63946',
        secondary: '#457B9D',
        light: '#F1FAEE',
        dark: '#1D3557',
      },
    },
  },
  darkMode: 'class', // or 'media' for media preference
  plugins: [],
}

