/**
 * Vérifie que les données de classes/spés sont identiques entre le site
 * (`src/lib/classes.ts`) et le bot (`bot/features/classes.ts`).
 * Ces deux fichiers sont volontairement dupliqués (projets séparés) ; ce script
 * empêche qu'ils divergent. Lancé en CI.
 */
import { CLASSES as lib, ROLE_LABEL as libRoles } from '../src/lib/classes';
import { CLASSES as bot, ROLE_LABEL as botRoles } from '../bot/features/classes';

const same =
  JSON.stringify(lib) === JSON.stringify(bot) &&
  JSON.stringify(libRoles) === JSON.stringify(botRoles);

if (!same) {
  console.error(
    '❌ Désynchronisation : src/lib/classes.ts et bot/features/classes.ts diffèrent.\n' +
      '   Mets à jour les DEUX fichiers de façon identique (données CLASSES + ROLE_LABEL).',
  );
  process.exit(1);
}
console.log('✅ Fichiers de classes synchronisés (site ↔ bot).');
