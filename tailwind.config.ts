import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          950: '#0a1a2f',
          900: '#0f2542',
          800: '#153357',
          700: '#1c4570',
          600: '#255a8f',
          500: '#3573ad',
          100: '#e6edf5',
          50: '#f3f7fb',
        },
        gold: {
          600: '#a8802e',
          500: '#c79a3f',
          400: '#d9b869',
          100: '#f6ecd6',
        },
        certainty: {
          confirmado: '#1e7d3c',
          probable: '#b8860b',
          nodeterminado: '#6b7280',
          inferido: '#2563eb',
          contradictorio: '#c0392b',
        },
        risk: {
          bajo: '#1e7d3c',
          medio: '#b8860b',
          alto: '#c0392b',
          critico: '#7f1d1d',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'Segoe UI', 'Arial', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
