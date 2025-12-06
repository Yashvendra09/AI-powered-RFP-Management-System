/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        fontFamily: {
          sans: ['Inter', 'sans-serif'],
        },
        colors: {
          primary: {
            50: '#f0f9ff',
            100: '#e0f2fe',
            // Indigo-Cyan Gradient ends
            600: '#4f46e5', // Indigo
            700: '#4338ca',
          },
          accent: {
            400: '#22d3ee', // Cyan
          }
        }
      },
    },
    plugins: [],
  }