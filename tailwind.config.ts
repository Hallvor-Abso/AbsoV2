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
        // Fonds sombres
        ink: '#08090B', // noir profond — fond principal
        'ink-soft': '#0F1117', // gris très sombre — fond secondaire
        // Cartes & séparateurs
        card: '#1E222A', // gris anthracite — cartes (légèrement éclairci pour plus de lumière)
        border: '#30343D', // bordure 1px (un peu plus visible)
        // Couleur signature : bleu électrique froid
        accent: {
          DEFAULT: '#4A9EFF',
          bright: '#4A9EFF',
          deep: '#1A6EFF',
        },
        // Textes
        foreground: '#E8EAF0', // blanc cassé — corps de texte
        title: '#FFFFFF', // blanc pur — titres
        muted: '#9AA0AD', // gris doux — texte secondaire (plus lumineux)
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
