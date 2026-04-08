import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        agro: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        earth: {
          50: '#fdf8f0',
          100: '#f5e6d0',
          200: '#e8cba0',
          300: '#d4a96e',
          400: '#c08c48',
          500: '#a67635',
          600: '#8b612c',
          700: '#704c24',
          800: '#5a3d1e',
          900: '#4a3219',
        },
      },
    },
  },
  plugins: [],
};

export default config;
