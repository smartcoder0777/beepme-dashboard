/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2563eb', 600: '#1d4ed8', 700: '#1d4ed8' },
      },
    },
  },
  plugins: [],
};
