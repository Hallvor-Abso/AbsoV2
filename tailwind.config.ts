import type { Config } from 'tailwindcss';

/**
 * Configuration Tailwind — identité visuelle Absolution.
 *
 * Toutes les couleurs de la charte graphique sont centralisées ici.
 * Si tu veux ajuster une teinte, modifie-la à cet endroit : elle sera
 * répercutée partout dans le site (classes `bg-ink`, `text-accent`, etc.).
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Fonds sombres (gris ardoise — plus du noir pur, pour gagner en lumière)
        ink: '#151922', // fond principal
        'ink-soft': '#1C2029', // fond secondaire
        // Cartes & séparateurs
        card: '#262B35', // gris anthracite clair — cartes
        border: '#3E4450', // bordure 1px (bien visible)
        // Couleur signature : bleu électrique froid
        accent: {
          DEFAULT: '#4A9EFF',
          bright: '#4A9EFF',
          deep: '#1A6EFF',
        },
        // Textes
        foreground: '#EDEFF5', // blanc cassé — corps de texte
        title: '#FFFFFF', // blanc pur — titres
        muted: '#AEB4C0', // gris doux — texte secondaire
      },
      fontFamily: {
        // Titres : Space Grotesk — Corps : Inter (chargées via next/font)
        display: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        // Lueur bleue discrète au hover
        glow: '0 0 24px rgba(74, 158, 255, 0.30)',
        'glow-strong': '0 0 40px rgba(74, 158, 255, 0.45)',
        // Liseré lumineux en haut des cartes (donne du relief)
        'card-top': 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
      },
      keyframes: {
        // Animation lente de l'arc électrique en fond de hero
        'arc-pulse': {
          '0%, 100%': { opacity: '0.15' },
          '50%': { opacity: '0.35' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'arc-pulse': 'arc-pulse 8s ease-in-out infinite',
        'fade-in': 'fade-in 0.6s ease-out',
      },
      transitionDuration: {
        DEFAULT: '250ms',
      },
    },
  },
  plugins: [],
};

export default config;
