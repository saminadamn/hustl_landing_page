/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#002B7F', // UF Blue
          dark: '#001F5C',
          light: '#0038FF',
        },
        secondary: {
          DEFAULT: '#FF4D23', // UF Orange
          light: '#FF5A1F',
          dark: '#E63A0B',
        },
        accent: {
          DEFAULT: '#FFFFFF', // White
          dark: '#F5F5F5',
          light: '#FFFFFF',
        },
        background: {
          DEFAULT: '#FFFFFF',
        },
        foreground: {
          DEFAULT: '#000000',
        },
        muted: {
          DEFAULT: '#F5F5F5',
        },
        border: {
          DEFAULT: '#E5E7EB',
        }
      },
      animation: {
        'star-movement-bottom': 'star-movement-bottom linear infinite alternate',
        'star-movement-top': 'star-movement-top linear infinite alternate',
      },
      keyframes: {
        'star-movement-bottom': {
          '0%': { transform: 'translate(0%, 0%)', opacity: '1' },
          '100%': { transform: 'translate(-100%, 0%)', opacity: '0' },
        },
        'star-movement-top': {
          '0%': { transform: 'translate(0%, 0%)', opacity: '1' },
          '100%': { transform: 'translate(100%, 0%)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};