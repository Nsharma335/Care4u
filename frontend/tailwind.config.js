/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f7f7',
          100: '#b3e6e6',
          200: '#80d5d5',
          300: '#4dc4c4',
          400: '#1ab3b3',
          500: '#00a2a2',
          600: '#008282',
          700: '#006161',
          800: '#004141',
          900: '#002020',
        },
        secondary: {
          50: '#f0f9f4',
          100: '#d4ede1',
          200: '#a9dbc3',
          300: '#7fc9a5',
          400: '#54b787',
          500: '#2aa569',
          600: '#228454',
          700: '#1a633f',
          800: '#11422a',
          900: '#092115',
        },
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

