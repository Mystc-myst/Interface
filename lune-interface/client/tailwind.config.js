/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"], // Assuming shadcn/ui standard dark mode strategy
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    container: { // Added container settings often used with shadcn/ui
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Custom project colors (can be kept or integrated with CSS vars if desired)
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
        'brazen-gold': '#B8860B', // Added Brazen-Gold

        // Shadcn/ui style colors from CSS variables
        border: "oklch(var(--border) / <alpha-value>)",
        input: "oklch(var(--input) / <alpha-value>)",
        ring: "oklch(var(--ring) / <alpha-value>)",
        background: "oklch(var(--background) / <alpha-value>)",
        foreground: "oklch(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "oklch(var(--primary) / <alpha-value>)",
          foreground: "oklch(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary) / <alpha-value>)",
          foreground: "oklch(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "oklch(var(--destructive) / <alpha-value>)",
          foreground: "oklch(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "oklch(var(--muted) / <alpha-value>)",
          foreground: "oklch(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "oklch(var(--accent) / <alpha-value>)",
          foreground: "oklch(var(--accent-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "oklch(var(--popover) / <alpha-value>)",
          foreground: "oklch(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "oklch(var(--card) / <alpha-value>)",
          foreground: "oklch(var(--card-foreground) / <alpha-value>)",
        },
        // Sidebar specific colors from CSS variables
        sidebar: {
          DEFAULT: "oklch(var(--sidebar) / <alpha-value>)",
          foreground: "oklch(var(--sidebar-foreground) / <alpha-value>)",
          primary: {
            DEFAULT: "oklch(var(--sidebar-primary) / <alpha-value>)",
            foreground: "oklch(var(--sidebar-primary-foreground) / <alpha-value>)",
          },
          accent: {
            DEFAULT: "oklch(var(--sidebar-accent) / <alpha-value>)",
            foreground: "oklch(var(--sidebar-accent-foreground) / <alpha-value>)",
          },
          border: "oklch(var(--sidebar-border) / <alpha-value>)",
          ring: "oklch(var(--sidebar-ring) / <alpha-value>)",
        },
        // Added from prompt
        gold: {
          100: '#FFF6C2',
          200: '#FCD44D',
          300: '#E7B94C',
          400: '#C49835',
          500: '#8E6B2B',
        },
        royal: {
          900:'#1B0D49',
          700:'#35156D',
          500:'#6848B6',
        },
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
        lg: "var(--radius)", // from CSS variable
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Keep custom ones if needed, or rely on var(--radius) based ones
        'xl': '0.75rem', // This was lg before, now var(--radius) is lg
        '2xl': '1rem',
        '3xl': '1.5rem',
        pill: '24px', // Already present, matches prompt
      },
      backgroundImage: { // Added from prompt
        'gold-liquid': 'linear-gradient(140deg,#FFF6C2 0%,#FCD44D 15%,#E7B94C 50%,#C49835 80%,#FCD44D 100%)',
        'royal-sheen': 'linear-gradient(150deg,#35156D 0%,#1B0D49 70%)',
      },
      boxShadow: { // Added from prompt (merged with existing)
        gold: '0 0 10px 2px rgba(252,212,77,0.65)',
        insetSoft: 'inset 0 1px 3px rgba(255,255,255,0.08)',
        'lune-light': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lune-dark': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      keyframes: { // Required for tailwindcss-animate & new shine animation
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shine: { // Added from prompt
          '0%,100%': { 'background-position':'0% 50%' },
          '50%':     { 'background-position':'100% 50%' },
        }
      },
      animation: { // Required for tailwindcss-animate & new shine animation
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shine: 'shine 6s linear infinite', // Added from prompt
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
