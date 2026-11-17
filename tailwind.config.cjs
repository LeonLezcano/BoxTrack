/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.js'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Segoe UI Variable',
          'Segoe UI',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif'
        ],
        mono: [
          'Cascadia Mono',
          'Consolas',
          'ui-monospace',
          'SFMono-Regular',
          'monospace'
        ]
      }
    }
  },
  plugins: []
};
