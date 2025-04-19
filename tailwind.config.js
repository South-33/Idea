const { } = require('tailwindcss/defaultTheme');

module.exports = {
  mode: 'jit',
  purge: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'background-light-grey': '#E2E4D9',
        'dark-grey-text': '#525E5E',
        'border-grey': '#5F6249',
        'soft-gold': '#ffeb99',
      },
    },
  },
  variants: {
    extend: {},
  },
};