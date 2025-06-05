/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        lunePurple: '#6B46C1',
        luneLightPurple: '#9F7AEA',
        luneDarkPurple: '#553C9A',
        luneGreen: '#68D391',
        luneLightGreen: '#9AE6B4',
        luneDarkGreen: '#38A169',
        luneGray: '#E2E8F0',
        luneDarkGray: '#A0AEC0',
        luneText: '#2D3748',
        resistorBlue: '#3b4252',
        memoryGoldAmber: '#fcd34d',
        expressionYellow: '#fef3c7',
        animusRed: '#b91c1c',
        animaPink: '#fbcfe81a',
      },
      fontFamily: {
        literata: ['Literata', 'serif'],
        ebGaramond: ['EB Garamond', 'serif'],
        ibmPlexSans: ['IBM Plex Sans', 'sans-serif'],
        ibmPlexMono: ['IBM Plex Mono', 'monospace'],
      },
      spacing: {
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'lune-light': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lune-dark': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
}
