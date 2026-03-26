/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          deep: '#0D1B2A',
          card: '#16232A',
          panel: '#1A2B35',
          hover: '#1F3340',
        },
        accent: {
          DEFAULT: '#0EA5E9',
          dim: '#075056',
          glow: '#00D4FF',
        },
        muted: '#64748B',
        surface: '#243342',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'aurora': 'aurora 8s ease-in-out infinite alternate',
        'vinyl': 'vinyl 4s linear infinite',
        'eq-bar': 'eqBar 0.8s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideRight: { from: { opacity: 0, transform: 'translateX(-12px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        aurora: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
        vinyl: { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
        eqBar: { from: { scaleY: 0.2 }, to: { scaleY: 1 } },
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
};
