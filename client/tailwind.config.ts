import type { Config } from 'tailwindcss';

const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        card: token('card'),
        text: token('text'),
        muted: token('muted'),
        line: token('line'),
        accent: token('accent'),
        onaccent: token('on-accent'),
        // Macro colours, taken from bumper plates.
        kcal: token('kcal'),
        protein: token('protein'),
        carbs: token('carbs'),
        fat: token('fat'),
      },
    },
  },
  plugins: [],
} satisfies Config;
