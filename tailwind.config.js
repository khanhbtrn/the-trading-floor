/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        pixel: ['"Press Start 2P"', 'monospace'],
      },
      colors: {
        surface: {
          DEFAULT: '#0d1117',
          card: '#161b22',
          panel: '#1c2333',
        },
        accent: '#4fc3f7',
        hud: '#22d3ee',
      },
    },
  },
  plugins: [],
};
