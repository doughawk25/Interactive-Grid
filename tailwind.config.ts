import type { Config } from 'tailwindcss'

const token = (name: string) => `rgb(var(--color-${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        foreground: token('foreground'),
        'foreground-muted': token('foreground-muted'),
        background: token('background'),
        surface: token('surface'),
        raised: token('raised'),
        'brand-surface': token('brand-surface'),
        'brand-foreground': token('brand-foreground'),
        'aqua-surface': token('aqua-surface'),
        'aqua-foreground': token('aqua-foreground'),
      },
    },
  },
  plugins: [],
} satisfies Config
