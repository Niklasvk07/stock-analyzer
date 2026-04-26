import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        space: ['var(--font-space)', 'sans-serif'],
        sans: ['var(--font-dm)', 'DM Sans', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      colors: {
        bg: '#090b16',
        surface: '#111422',
        'surface-hover': '#161929',
        amber: '#f59e0b',
        sky: '#38bdf8',
        gain: '#4ade80',
        loss: '#f87171',
      },
      animation: {
        'drawer-in': 'drawerIn 0.22s cubic-bezier(0.22,1,0.36,1)',
        'fade-up': 'fadeUp 0.3s ease-out',
      },
      keyframes: {
        drawerIn: {
          '0%': { transform: 'translateX(50px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
