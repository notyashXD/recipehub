/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#FF6B35', light: '#FF8C61', dark: '#E5501A' },
        forest: { DEFAULT: '#2D4A3E', light: '#3D6B5A', dark: '#1A2E25' },
        surface: { DEFAULT: '#0F1117', card: '#1A1D27', border: '#2A2D3A', muted: '#3A3D4A' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(16px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        pulseGlow: { '0%,100%': { boxShadow: '0 0 0 0 rgba(255,107,53,0.3)' }, '50%': { boxShadow: '0 0 0 12px rgba(255,107,53,0)' } },
      },
    },
  },
  plugins: [],
};
