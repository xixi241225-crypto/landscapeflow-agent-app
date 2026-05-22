/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Dark theme foundation
        dark: {
          900: '#070807',
          800: '#0B0C0B',
          700: '#0E0F0E',
          600: '#101211',
          500: '#151716',
          400: '#1A1C1B',
          300: '#2B2E2A',
          200: '#3D403C',
          100: '#555955',
        },
        // Green accent — used ONLY for status, completion, tags, primary buttons
        green: {
          500: '#14532D',
          400: '#166534',
          300: '#16A34A',
          200: '#22C55E',
          100: '#4ADE80',
          50: '#86EFAC',
        },
        // Gold accent — used for curated results, recommended schemes, star highlights
        gold: {
          500: '#8B6914',
          400: '#A67C1E',
          300: '#C49B2A',
          200: '#D6B56D',
          100: '#E8CF94',
          50: '#F5E6C0',
        },
        // Text colors
        text: {
          primary: '#F5F1E8',
          secondary: '#A8A29A',
          muted: '#78716C',
        },
        // Border colors
        border: {
          DEFAULT: '#2B2E2A',
          light: 'rgba(255,255,255,0.08)',
          gold: 'rgba(214,181,109,0.35)',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.6s ease-out',
        'typewriter': 'typewriter 1.5s steps(20) forwards',
        'spin-slow': 'spin 3s linear infinite',
        'step-pulse': 'stepPulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(34, 197, 94, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(34, 197, 94, 0.6)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        typewriter: {
          '0%': { maxWidth: '0' },
          '100%': { maxWidth: '100%' },
        },
        stepPulse: {
          '0%, 100%': { opacity: '0.7', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
};
