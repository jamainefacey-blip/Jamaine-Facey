import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        vst: {
          navy:    '#0B1120',
          slate:   '#1A2540',
          steel:   '#2C3E60',
          accent:  '#1D6FF2',
          muted:   '#8A99B8',
          border:  '#1E2D4A',
          surface: '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
