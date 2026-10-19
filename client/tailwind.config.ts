import type { Config } from 'tailwindcss';

const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      animation: { 'rise-in': 'rise-in 300ms cubic-bezier(0.16, 1, 0.3, 1)' },
      transitionTimingFunction: { spring: 'cubic-bezier(0.32, 0.72, 0, 1)' }, // settles like a mass on a spring; used for every interactive transition
      colors: {
        bg: token('bg'),
        card: token('card'),
        field: token('field'),
        raised: token('raised'),
        text: token('text'),
        muted: token('muted'),
        line: token('line'),
        'input-line': token('input-line'),
        accent: token('accent'),
        danger: token('danger'),
        onaccent: token('on-accent'),
        // Macro colours, taken from bumper plates.
        kcal: token('kcal'),
        protein: token('protein'),
        carbs: token('carbs'),
        fat: token('fat'),
        gold: token('gold'),
        board: token('board'),
        'on-board': token('on-board'),
        'board-muted': token('board-muted'),
        'board-line': token('board-line'),
        digit: token('digit'),
        'board-alert': token('board-alert'),
      },
    },
  },
  future: { hoverOnlyWhenSupported: true }, // hover styles would otherwise stick after a tap on a phone
  plugins: [],
} satisfies Config;
