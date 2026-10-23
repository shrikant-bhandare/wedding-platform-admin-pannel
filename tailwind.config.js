/** @type {import('tailwindcss').Config} */

// Sohalaa brand accents (shared with the customer site). The panels stay light working
// screens; green/primary now resolve to the brand teal so existing classes follow the brand.
const ink = {
  50: '#EEF5F4',
  100: '#D5E6E3',
  200: '#AFCFCA',
  300: '#82B2AB',
  400: '#57928A',
  500: '#3A7670',
  600: '#2A5E5A',
  700: '#1F4A48',
  800: '#163937',
  900: '#0F2B2B',
  950: '#081B1C',
};

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink,
        primary: ink,
        green: ink,
        gold: {
          50: '#FBF6E9',
          100: '#F5E9C9',
          200: '#ECD69F',
          300: '#E2C27A',
          400: '#D4AE5F',
          500: '#C49A47',
          600: '#A67E35',
          700: '#86642A',
          800: '#6A4F22',
          900: '#4F3B1A',
        },
        rose: {
          50: '#FDF0F4',
          100: '#FADCE6',
          200: '#F4B4C9',
          300: '#EC85A6',
          400: '#DE5583',
          500: '#C8285E',
          600: '#AD1F50',
          700: '#8E1A43',
          800: '#701637',
          900: '#55122B',
        },
        ivory: {
          DEFAULT: '#FBF6EC',
          100: '#F6EEDD',
          200: '#EEE2C8',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', '"Noto Sans Devanagari"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
