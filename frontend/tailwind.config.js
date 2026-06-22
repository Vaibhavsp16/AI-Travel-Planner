/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',   // Very light blue for app background
          100: '#e0effe',  // Light blue for cards
          200: '#bae0fd',  // Border blue
          300: '#7cc7fb',
          400: '#38a9f8',
          500: '#0e8ee9',  // Primary blue
          600: '#0270c9',
          700: '#0359a3',
          800: '#074c85',
          900: '#0c406e',
        }
      }
    },
  },
  plugins: [],
}
