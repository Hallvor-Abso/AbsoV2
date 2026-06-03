'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Animation d'entrée discrète au scroll (scroll reveal).
 * Les éléments apparaissent en fondu + léger glissement vers le haut.
 * Utilisé uniquement pour les ENTRÉES (jamais en boucle), conformément
 * à la charte « animations sobres et maîtrisées ».
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
