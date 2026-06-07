/**
 * Classes et spécialisations par jeu (WoW & SWTOR), partagées entre le site et
 * le bot. Chaque spé porte son rôle (Tank/Heal/DPS). Ce fichier est dupliqué
 * côté bot (`bot/features/classes.ts`) — garder les deux synchronisés.
 */

export type SpecRole = 'TANK' | 'HEAL' | 'DPS';
export type SpecDef = { id: string; label: string; role: SpecRole };
export type ClassDef = { id: string; label: string; specs: SpecDef[] };
export type GameKey = 'wow' | 'swtor';

export const ROLE_LABEL: Record<SpecRole, string> = { TANK: 'Tank', HEAL: 'Heal', DPS: 'DPS' };
export const ROLE_EMOJI: Record<SpecRole, string> = { TANK: '🛡️', HEAL: '💚', DPS: '⚔️' };
export const ROLE_ORDER: SpecRole[] = ['TANK', 'HEAL', 'DPS'];

const T: SpecRole = 'TANK';
const H: SpecRole = 'HEAL';
const D: SpecRole = 'DPS';

export const CLASSES: Record<GameKey, ClassDef[]> = {
  wow: [
    { id: 'guerrier', label: 'Guerrier', specs: [
      { id: 'armes', label: 'Armes', role: D },
      { id: 'fureur', label: 'Fureur', role: D },
      { id: 'protection', label: 'Protection', role: T },
    ] },
    { id: 'paladin', label: 'Paladin', specs: [
      { id: 'sacre', label: 'Sacré', role: H },
      { id: 'protection', label: 'Protection', role: T },
      { id: 'vindicte', label: 'Vindicte', role: D },
    ] },
    { id: 'chasseur', label: 'Chasseur', specs: [
      { id: 'maitrise_betes', label: 'Maîtrise des bêtes', role: D },
      { id: 'precision', label: 'Précision', role: D },
      { id: 'survie', label: 'Survie', role: D },
    ] },
    { id: 'voleur', label: 'Voleur', specs: [
      { id: 'assassinat', label: 'Assassinat', role: D },
      { id: 'hors_la_loi', label: 'Hors-la-loi', role: D },
      { id: 'subtilite', label: 'Subtilité', role: D },
    ] },
    { id: 'pretre', label: 'Prêtre', specs: [
      { id: 'discipline', label: 'Discipline', role: H },
      { id: 'sacre', label: 'Sacré', role: H },
      { id: 'ombre', label: 'Ombre', role: D },
    ] },
    { id: 'chaman', label: 'Chaman', specs: [
      { id: 'elementaire', label: 'Élémentaire', role: D },
      { id: 'amelioration', label: 'Amélioration', role: D },
      { id: 'restauration', label: 'Restauration', role: H },
    ] },
    { id: 'mage', label: 'Mage', specs: [
      { id: 'arcanes', label: 'Arcanes', role: D },
      { id: 'feu', label: 'Feu', role: D },
      { id: 'givre', label: 'Givre', role: D },
    ] },
    { id: 'demoniste', label: 'Démoniste', specs: [
      { id: 'affliction', label: 'Affliction', role: D },
      { id: 'demonologie', label: 'Démonologie', role: D },
      { id: 'destruction', label: 'Destruction', role: D },
    ] },
    { id: 'moine', label: 'Moine', specs: [
      { id: 'maitre_brasseur', label: 'Maître brasseur', role: T },
      { id: 'tisse_brume', label: 'Tisse-brume', role: H },
      { id: 'marche_vent', label: 'Marche-vent', role: D },
    ] },
    { id: 'druide', label: 'Druide', specs: [
      { id: 'equilibre', label: 'Équilibre', role: D },
      { id: 'farouche', label: 'Farouche', role: D },
      { id: 'gardien', label: 'Gardien', role: T },
      { id: 'restauration', label: 'Restauration', role: H },
    ] },
    { id: 'chasseur_demons', label: 'Chasseur de démons', specs: [
      { id: 'devastation', label: 'Dévastation', role: D },
      { id: 'vengeance', label: 'Vengeance', role: T },
      { id: 'devoreur', label: 'Dévoreur', role: H },
    ] },
    { id: 'chevalier_mort', label: 'Chevalier de la mort', specs: [
      { id: 'sang', label: 'Sang', role: T },
      { id: 'givre', label: 'Givre', role: D },
      { id: 'impie', label: 'Impie', role: D },
    ] },
    { id: 'evocateur', label: 'Évocateur', specs: [
      { id: 'devastation', label: 'Dévastation', role: D },
      { id: 'preservation', label: 'Préservation', role: H },
      { id: 'augmentation', label: 'Augmentation', role: D },
    ] },
  ],
  swtor: [
    { id: 'juggernaut', label: 'Juggernaut / Gardien', specs: [
      { id: 'immortal', label: 'Immortel', role: T },
      { id: 'vengeance', label: 'Vengeance', role: D },
      { id: 'rage', label: 'Rage', role: D },
    ] },
    { id: 'marauder', label: 'Marauder / Sentinelle', specs: [
      { id: 'annihilation', label: 'Annihilation', role: D },
      { id: 'carnage', label: 'Carnage', role: D },
      { id: 'fury', label: 'Furie', role: D },
    ] },
    { id: 'sorcerer', label: 'Sorcerer / Érudit', specs: [
      { id: 'lightning', label: 'Foudre', role: D },
      { id: 'madness', label: 'Folie', role: D },
      { id: 'corruption', label: 'Corruption', role: H },
    ] },
    { id: 'assassin', label: 'Assassin / Ombre', specs: [
      { id: 'darkness', label: 'Ténèbres', role: T },
      { id: 'deception', label: 'Duperie', role: D },
      { id: 'hatred', label: 'Haine', role: D },
    ] },
    { id: 'powertech', label: 'Powertech / Avant-garde', specs: [
      { id: 'shield_tech', label: 'Technicien du bouclier', role: T },
      { id: 'advanced_prototype', label: 'Prototype avancé', role: D },
      { id: 'pyrotech', label: 'Pyrotech', role: D },
    ] },
    { id: 'mercenary', label: 'Mercenary / Commando', specs: [
      { id: 'arsenal', label: 'Arsenal', role: D },
      { id: 'innovative_ordnance', label: 'Munitions innovantes', role: D },
      { id: 'bodyguard', label: 'Garde du corps', role: H },
    ] },
    { id: 'operative', label: 'Operative / Malfrat', specs: [
      { id: 'concealment', label: 'Dissimulation', role: D },
      { id: 'lethality', label: 'Léthalité', role: D },
      { id: 'medicine', label: 'Médecine', role: H },
    ] },
    { id: 'sniper', label: 'Sniper / Franc-tireur', specs: [
      { id: 'marksmanship', label: 'Précision', role: D },
      { id: 'engineering', label: 'Ingénierie', role: D },
      { id: 'virulence', label: 'Virulence', role: D },
    ] },
  ],
};

/** Déduit la clé de jeu (wow/swtor) depuis le slug ou le nom du jeu. */
export function gameKey(slugOrName: string): GameKey | null {
  const s = slugOrName.toLowerCase();
  if (s.includes('wow') || s.includes('warcraft')) return 'wow';
  if (s.includes('swtor') || s.includes('old republic') || s.includes('star wars')) return 'swtor';
  return null;
}

export function findClass(key: GameKey, classId: string): ClassDef | null {
  return CLASSES[key].find((c) => c.id === classId) ?? null;
}

export function findSpec(key: GameKey, classId: string, specId: string): SpecDef | null {
  return findClass(key, classId)?.specs.find((s) => s.id === specId) ?? null;
}

export function findSpecByLabel(key: GameKey, classId: string, label: string): SpecDef | null {
  return findClass(key, classId)?.specs.find((s) => s.label === label) ?? null;
}

// Registre déterministe des noms d'emoji par spé (≤ 32 caractères, uniques).
// Construit dans le même ordre côté site et bot → noms stables et identiques.
function rawEmoji(key: GameKey, classId: string, specId: string): string {
  return `${key}_${classId}_${specId}`.replace(/[^a-z0-9_]/gi, '').toLowerCase();
}
const SPEC_EMOJI_NAMES = new Map<string, string>();
const _usedEmojiNames = new Set<string>();
for (const key of Object.keys(CLASSES) as GameKey[]) {
  for (const c of CLASSES[key]) {
    for (const s of c.specs) {
      let name = rawEmoji(key, c.id, s.id).slice(0, 32);
      if (_usedEmojiNames.has(name)) {
        const base = name.slice(0, 30);
        let i = 1;
        while (_usedEmojiNames.has(`${base}${i}`)) i++;
        name = `${base}${i}`;
      }
      _usedEmojiNames.add(name);
      SPEC_EMOJI_NAMES.set(`${key}:${c.id}:${s.id}`, name);
    }
  }
}

/** Nom d'emoji Discord attendu pour l'icône d'une spé (ex. « wow_mage_givre »). */
export function specEmojiName(key: GameKey, classId: string, specId: string): string {
  return SPEC_EMOJI_NAMES.get(`${key}:${classId}:${specId}`) ?? rawEmoji(key, classId, specId).slice(0, 32);
}

/** Liste de tous les noms d'emoji de spé (pour la configuration des icônes). */
export const ALL_SPEC_EMOJI_NAMES: string[] = [...SPEC_EMOJI_NAMES.values()];
