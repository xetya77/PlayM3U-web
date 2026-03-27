/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:      { deep: '#0D1B24', card: '#16232A', panel: '#1C2F3A', hover: '#1F3340' },
        surface: '#1C2F3A',
        accent:  { DEFAULT: '#FF5B04', light: '#FF8A00', dim: '#C44A03' },
        teal:    { DEFAULT: '#0A5055', light: '#0D6B73', dark: '#07393D' },
        ice:     { DEFAULT: '#E4EEF0', dim: '#B8CDD1', muted: '#7A9BA3' },
        orange:  '#FF5B04',
      },
      fontFamily: { sans: ['Manrope', 'system-ui', 'sans-serif'] },
      borderRadius: { pill: '9999px', xl2: '20px', xl3: '24px' },
      fontSize: {
        '2xs': ['10px', '14px'],
      },
    },
  },
  plugins: [],
};
