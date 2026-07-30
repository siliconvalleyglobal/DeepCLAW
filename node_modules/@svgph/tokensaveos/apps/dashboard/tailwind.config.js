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
          50: '#f0f4ff',
          500: '#6366f1',
          600: '#4f46e5',
          900: '#1e1b4b',
        },
        surface: {
          card: 'rgba(17, 24, 39, 0.75)',
          border: 'rgba(255, 255, 255, 0.1)',
        }
      }
    },
  },
  plugins: [],
};
