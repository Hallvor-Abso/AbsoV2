/**
 * Classes et spécialisations par jeu (WoW & SWTOR) — copie côté bot de
 * `src/lib/classes.ts`. Garder les deux fichiers synchronisés.
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

// Icônes WoW : CDN Wowhead (hotlinkable par Discord à la création de l'emoji).
const zam = (icon: string) => `https://wow.zamimg.com/images/wow/icons/large/${icon}.jpg`;
const WOW_SPEC_ICONS: Record<string, string> = {
  wow_guerrier_armes: 'ability_warrior_savageblow',
  wow_guerrier_fureur: 'ability_warrior_innerrage',
  wow_guerrier_protection: 'ability_warrior_defensivestance',
  wow_paladin_sacre: 'spell_holy_holybolt',
  wow_paladin_protection: 'ability_paladin_shieldofthetemplar',
  wow_paladin_vindicte: 'spell_holy_auraoflight',
  wow_chasseur_maitrise_betes: 'ability_hunter_bestialdiscipline',
  wow_chasseur_precision: 'ability_hunter_focusedaim',
  wow_chasseur_survie: 'ability_hunter_camouflage',
  wow_voleur_assassinat: 'ability_rogue_eviscerate',
  wow_voleur_hors_la_loi: 'ability_rogue_waylay',
  wow_voleur_subtilite: 'ability_stealth',
  wow_pretre_discipline: 'spell_holy_powerwordshield',
  wow_pretre_sacre: 'spell_holy_guardianspirit',
  wow_pretre_ombre: 'spell_shadow_shadowwordpain',
  wow_chaman_elementaire: 'spell_nature_lightning',
  wow_chaman_amelioration: 'spell_shaman_improvedstormstrike',
  wow_chaman_restauration: 'spell_nature_magicimmunity',
  wow_mage_arcanes: 'spell_holy_magicalsentry',
  wow_mage_feu: 'spell_fire_firebolt02',
  wow_mage_givre: 'spell_frost_frostbolt02',
  wow_demoniste_affliction: 'spell_shadow_deathcoil',
  wow_demoniste_demonologie: 'spell_shadow_metamorphosis',
  wow_demoniste_destruction: 'spell_shadow_rainoffire',
  wow_moine_maitre_brasseur: 'spell_monk_brewmaster_spec',
  wow_moine_tisse_brume: 'spell_monk_mistweaver_spec',
  wow_moine_marche_vent: 'spell_monk_windwalker_spec',
  wow_druide_equilibre: 'spell_nature_starfall',
  wow_druide_farouche: 'ability_druid_catform',
  wow_druide_gardien: 'ability_racial_bearform',
  wow_druide_restauration: 'spell_nature_healingtouch',
  wow_chasseur_demons_devastation: 'ability_demonhunter_specdps',
  wow_chasseur_demons_vengeance: 'ability_demonhunter_spectank',
  wow_chevalier_mort_sang: 'spell_deathknight_bloodpresence',
  wow_chevalier_mort_givre: 'spell_deathknight_frostpresence',
  wow_chevalier_mort_impie: 'spell_deathknight_unholypresence',
  wow_evocateur_devastation: 'classicon_evoker_devastation',
  wow_evocateur_preservation: 'classicon_evoker_preservation',
  wow_evocateur_augmentation: 'classicon_evoker_augmentation',
};

/**
 * URLs des icônes de SPÉCIALISATION pour `/setup-class-emojis`. WoW est
 * pré-rempli (CDN Wowhead). SWTOR reste à compléter avec des URLs publiques.
 * Clé = nom d'emoji de spé (`wow_mage_givre`, `swtor_juggernaut_immortal`…).
 */
export const SPEC_EMOJI_URLS: Record<string, string> = {};
for (const name of SPEC_EMOJI_NAMES.values()) {
  SPEC_EMOJI_URLS[name] = WOW_SPEC_ICONS[name] ? zam(WOW_SPEC_ICONS[name]) : '';
}

/** Nom d'emoji Discord au niveau CLASSE (repli quand pas d'icône de spé). */
export function classEmojiName(key: GameKey, classId: string): string {
  return `${key}_${classId}`.replace(/[^a-z0-9_]/gi, '').toLowerCase().slice(0, 32);
}

/**
 * URLs des icônes au niveau CLASSE. Utile pour SWTOR (une icône par classe,
 * réutilisée pour ses spés). Clé = `swtor_juggernaut`, `swtor_sorcerer`…
 */
const SWTOR_CLASS_ICONS: Record<string, string> = {
  swtor_juggernaut: 'https://w5twhbqprmpdjcud.public.blob.vercel-storage.com/uploads/1780840434691-ntsq6dh.png', // Gardien
  swtor_marauder: 'https://w5twhbqprmpdjcud.public.blob.vercel-storage.com/uploads/1780840451174-cgxq38b.png', // Sentinelle
  swtor_sorcerer: 'https://w5twhbqprmpdjcud.public.blob.vercel-storage.com/uploads/1780840464820-ds8dqvi.png', // Érudit
  swtor_assassin: 'https://w5twhbqprmpdjcud.public.blob.vercel-storage.com/uploads/1780840477558-5oxmf7a.png', // Ombre
  swtor_mercenary: 'https://w5twhbqprmpdjcud.public.blob.vercel-storage.com/uploads/1780840488819-hvi180o.png', // Commando
  swtor_powertech: 'https://w5twhbqprmpdjcud.public.blob.vercel-storage.com/uploads/1780840501944-qno1b02.png', // Avant-Garde
  swtor_sniper: 'https://w5twhbqprmpdjcud.public.blob.vercel-storage.com/uploads/1780840517968-dlkyxl3.png', // Franc-Tireur
  swtor_operative: 'https://w5twhbqprmpdjcud.public.blob.vercel-storage.com/uploads/1780840531476-on5f0im.png', // Malfrat
};

export const CLASS_EMOJI_URLS: Record<string, string> = {};
for (const key of Object.keys(CLASSES) as GameKey[]) {
  for (const c of CLASSES[key]) {
    const name = classEmojiName(key, c.id);
    CLASS_EMOJI_URLS[name] = SWTOR_CLASS_ICONS[name] ?? '';
  }
}
