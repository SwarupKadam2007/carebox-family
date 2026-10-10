/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#2E7D79',
          50: '#F0F7F6',
          100: '#DDEFEB',
          200: '#BDDFD9',
          600: '#2E7D79',
          700: '#246562',
          800: '#1F4E4B',
          900: '#153634',
        },
        cream: {
          DEFAULT: '#FCF6EE',
          50: '#FFFCF8',
          100: '#FCF6EE',
          200: '#F5EADB',
        },
        taken: {
          DEFAULT: '#27A348',
          light: '#EBF7EE',
          dark: '#1E8238',
        },
        amber: {
          DEFAULT: '#F2B33D',
          light: '#FEF7EC',
          dark: '#D89825',
        },
        later: {
          DEFAULT: '#C3CDCC',
          light: '#F3F6F6',
          dark: '#8D9E9C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Poppins', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(46, 125, 121, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'card': '0 2px 12px rgba(0, 0, 0, 0.04)',
        'float': '0 12px 32px -4px rgba(31, 78, 75, 0.15)',
      },
      borderRadius: {
        'card': '16px',
        'pill': '9999px',
      }
    },
  },
  plugins: [],
}
