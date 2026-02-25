/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        bp: '920px',
      },
      colors: {
        // Premium warm palette — мангалы, камины, Old Money
        premium: {
          espresso: '#1A0F0A',
          walnut: '#2C1810',
          mahogany: '#3D2314',
          cognac: '#5C3825',
          caramel: '#8B5A2B',
          gold: '#ffffff',
          brass: '#B8860B',
          cream: '#F5F0E8',
          ivory: '#EDE8E0',
          charcoal: '#1A1210',
        },
        wood: {
          dark: '#4A2C1A',
          medium: '#8B5A2B',
          light: '#A67C52',
        },
        forest: {
          green: '#4A6B57',
          sage: '#6B8E6B',
        },
        natural: {
          cream: '#F5F0E6',
          beige: '#EDE6D9',
          brown: '#6D5D4A',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
