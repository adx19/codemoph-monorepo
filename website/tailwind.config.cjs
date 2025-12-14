/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: {
            500: '#f97316',
            600: '#ea580c',
          },
        },
      },
      boxShadow: {
        glow: '0 0 40px rgba(249,115,22,0.35)',
      },
      backgroundImage: {
        'radial-grid':
          'radial-gradient(circle at top, rgba(249,115,22,0.22), transparent 60%)',
      },
    },
  },
  plugins: [],
};
