import type { Config } from 'tailwindcss'

// Design tokens live here — single source of truth.
// Any change here propagates to every utility class in the app.
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Base surfaces
        app:    '#08080F',
        panel:  '#0D0D18',
        surf:   '#13131F',
        input:  '#181826',
        // Borders
        brd:    '#252538',
        brdLt:  '#303048',
        // Accent — violet
        acc:    '#7C3AED',
        accD:   '#5B21B6',
        accGlow:'#7C3AED26',
        // Text
        hi:     '#EAEAF5',
        sec:    '#8A8AAB',
        muted:  '#48486A',
        // Semantic
        ok:     '#10B981',
        warn:   '#F59E0B',
        err:    '#EF4444',
        gold:   '#F5CA48',
        // Chat bubbles
        uBg:    '#1A1035',
        aiBg:   '#0F0F1A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', '14px'],
        xs:    ['11px', '16px'],
        sm:    ['12px', '18px'],
        base:  ['13px', '20px'],
        md:    ['14px', '22px'],
        lg:    ['15px', '24px'],
        xl:    ['17px', '26px'],
        '2xl': ['20px', '30px'],
        '3xl': ['24px', '32px'],
      },
      borderRadius: {
        sm:  '6px',
        md:  '10px',
        lg:  '14px',
        xl:  '18px',
        '2xl':'24px',
      },
      boxShadow: {
        sm:   '0 1px 3px rgba(0,0,0,.4)',
        md:   '0 4px 16px rgba(0,0,0,.5)',
        lg:   '0 8px 32px rgba(0,0,0,.6)',
        glow: '0 0 20px rgba(124,58,237,.25)',
        ok:   '0 0 12px rgba(16,185,129,.3)',
      },
      keyframes: {
        'bounce-dot': {
          '0%, 60%, 100%': { transform: 'translateY(0)', opacity: '0.4' },
          '30%':            { transform: 'translateY(-5px)', opacity: '1' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
      },
      animation: {
        'bounce-dot':  'bounce-dot 1.2s ease-in-out infinite',
        'fade-up':     'fade-up .2s ease forwards',
        'scale-in':    'scale-in .15s ease forwards',
        'shimmer':     'shimmer 2s linear infinite',
      },
      backgroundImage: {
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}

export default config
