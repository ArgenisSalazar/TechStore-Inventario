/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { 50:'#EFF6FF', 100:'#DBEAFE', 500:'#3B82F6', 600:'#2563EB', 700:'#1D4ED8', 800:'#1E40AF', 900:'#1E3A5F' },
        brand:   { DEFAULT:'#1F4E79', light:'#2E6DA4', dark:'#163558' },
        accent:  { DEFAULT:'#C55A11', light:'#E8722A' },
      },
    },
  },
  plugins: [],
}
