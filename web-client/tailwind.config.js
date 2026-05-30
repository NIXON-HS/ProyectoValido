/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#eef5ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        surface: {
          DEFAULT: 'rgba(255,255,255,0.9)',
          dark:    'rgba(15,23,42,0.85)',
        },
      },
      animation: {
        'fade-in':   'fadeIn 0.4s ease-out both',
        'slide-up':  'slideUp 0.45s ease-out both',
        'scale-in':  'scaleIn 0.35s ease-out both',
        'slide-right': 'slideRight 0.4s ease-out both',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-once': 'spin 0.5s ease-in-out 1',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 },                         to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        scaleIn:   { from: { opacity: 0, transform: 'scale(0.95)' },     to: { opacity: 1, transform: 'scale(1)' } },
        slideRight:{ from: { opacity: 0, transform: 'translateX(-16px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        'glass':      '0 8px 32px rgba(31,38,135,0.15)',
        'glass-dark': '0 8px 32px rgba(0,0,0,0.4)',
        'glow':       '0 0 20px rgba(59,130,246,0.35)',
        'glow-sm':    '0 0 12px rgba(59,130,246,0.25)',
        'card':       '0 4px 24px rgba(15,23,42,0.08)',
        'card-hover': '0 8px 40px rgba(15,23,42,0.14)',
      },
    },
  },
  plugins: [],
};
