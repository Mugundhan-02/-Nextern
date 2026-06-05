/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          900: '#070b16',
          800: '#0a0e1a',
          700: '#0f1629',
          600: '#141c35',
          500: '#1a2340',
        },
        accent: {
          purple: '#8b5cf6',
          indigo: '#6366f1',
          blue: '#3b82f6',
          cyan: '#06b6d4',
          pink: '#ec4899',
          green: '#10b981',
          yellow: '#f59e0b',
          red: '#ef4444',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-card': 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.05))',
      },
      boxShadow: {
        'glow-indigo': '0 0 20px rgba(99,102,241,0.3)',
        'glow-purple': '0 0 20px rgba(139,92,246,0.3)',
        'glow-cyan': '0 0 20px rgba(6,182,212,0.3)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'count-up': 'countUp 0.8s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
