/**
 * Définitions partagées du constructeur de formulaire de candidature.
 *
 * Le formulaire de recrutement est désormais personnalisable PAR JEU : chaque
 * jeu possède sa propre liste de champs (`RecruitmentField`). Ce fichier
 * regroupe les types et la validation, utilisés à la fois côté client
 * (formulaire public, admin) et côté serveur (API).
 */

export type RecruitFieldType = 'TEXT' | 'TEXTAREA' | 'URL' | 'NUMBER' | 'SELECT';

/** Définition d'un champ (sans les métadonnées de base). */
export type FormFieldDef = {
  key: string; // identifiant stable, utilisé comme nom de champ
  label: string;
  type: RecruitFieldType;
  placeholder?: string | null;
  helpText?: string | null;
  required: boolean;
  options?: string[]; // valeurs pour les listes déroulantes (SELECT)
};

/** Une réponse enregistrée sur la candidature (auto-descriptive). */
export type StoredAnswer = { label: string; value: string };

export const FIELD_TYPE_LABELS: Record<RecruitFieldType, string> = {
  TEXT: 'Texte court',
  TEXTAREA: 'Texte long',
  URL: 'Lien (URL)',
  NUMBER: 'Nombre',
  SELECT: 'Liste déroulante',
};

export const FIELD_TYPES = Object.keys(FIELD_TYPE_LABELS) as RecruitFieldType[];

/**
 * Champs par défaut (repris de l'ancien formulaire orienté WoW). Ils servent
 * de REPLI tant qu'un jeu n'a pas défini ses propres champs, et de MODÈLE de
 * départ proposé dans l'admin.
 */
export const DEFAULT_RECRUIT_FIELDS: FormFieldDef[] = [
  { key: 'characterId', label: 'BattleTag / ID', type: 'TEXT', placeholder: 'Pseudo#1234', required: false },
  { key: 'server', label: 'Serveur', type: 'TEXT', placeholder: 'Hyjal, Tarren Mill...', required: true },
  { key: 'className', label: 'Classe', type: 'TEXT', placeholder: 'Mage, Prêtre...', required: true },
  { key: 'role', label: 'Rôle', type: 'TEXT', placeholder: 'DPS, Heal, Tank', required: true },
  { key: 'experience', label: 'Expérience PvE', type: 'TEXTAREA', placeholder: 'Tes progress récents, guildes précédentes, ton niveau de jeu...', required: true },
  { key: 'availability', label: 'Disponibilités', type: 'TEXT', placeholder: 'Ex : lun/mer/jeu 20h-23h', required: true },
  { key: 'logsUrl', label: 'Logs / Armory', type: 'URL', placeholder: 'https://www.warcraftlogs.com/character/...', required: false },
  { key: 'motivation', label: 'Motivation', type: 'TEXTAREA', placeholder: "Pourquoi Absolution ? Qu'attends-tu de la guilde ?", required: true },
];

/** Limites de longueur par type (caractères). */
const MAX_LEN: Record<RecruitFieldType, number> = {
  TEXT: 200,
  TEXTAREA: 4000,
  URL: 500,
  NUMBER: 40,
  SELECT: 200,
};

/**
 * Valide une valeur saisie selon la définition du champ.
 * Renvoie un message d'erreur, ou `null` si la valeur est acceptable.
 */
export function validateFieldValue(field: FormFieldDef, raw: string): string | null {
  const value = (raw ?? '').trim();
  if (!value) return field.required ? `« ${field.label} » est requis.` : null;
  if (value.length > MAX_LEN[field.type]) return `« ${field.label} » est trop long.`;
  if (field.type === 'URL') {
    try {
      new URL(value);
    } catch {
      return `« ${field.label} » doit être un lien valide (https://…).`;
    }
  }
  if (field.type === 'NUMBER' && Number.isNaN(Number(value))) {
    return `« ${field.label} » doit être un nombre.`;
  }
  if (field.type === 'SELECT' && field.options?.length && !field.options.includes(value)) {
    return `« ${field.label} » : valeur non autorisée.`;
  }
  return null;
}

/** Transforme un libellé en clé stable (slug ascii). */
export function slugifyKey(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50);
}
