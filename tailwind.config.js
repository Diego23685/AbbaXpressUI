/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f2f3fc',
          100: '#e5e6f8',
          200: '#cecef2',
          300: '#ababeb',
          400: '#8487e0',
          DEFAULT: '#656cc5',
          600: '#5157b5',
          700: '#424698',
          800: '#383b7c',
          900: '#313364',
          dark: '#1e2038',
          darker: '#141625',
        }
      }
    },
  },
  plugins: [],
}