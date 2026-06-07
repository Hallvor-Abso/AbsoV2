import { prisma } from '../../prisma';
import type { ChatCtx } from './commands';

/** Modération automatique du chat : liens, majuscules, mots interdits. */

type ModConfig = {
  blockLinks: boolean;
  permitSeconds: number;
  capsEnabled: boolean;
  capsMinLength: number;
  capsPercent: number;
  blacklist: string[];
  timeoutSeconds: number;
  warnMessage: string | null;
  modsImmune: boolean;
};

const DEFAULT: ModConfig = {
  blockLinks: false,
  permitSeconds: 60,
  capsEnabled: false,
  capsMinLength: 12,
  capsPercent: 70,
  blacklist: [],
  timeoutSeconds: 30,
  warnMessage: null,
  modsImmune: true,
};

let cache: { value: ModConfig; exp: number } | null = null;

export async function getModConfig(): Promise<ModConfig> {
  if (cache && cache.exp > Date.now()) return cache.value;
  const row = await prisma.twitchModConfig.findUnique({ where: { id: 'default' } }).catch(() => null);
  const value: ModConfig = row ? { ...DEFAULT, ...row } : DEFAULT;
  cache = { value, exp: Date.now() + 30_000 };
  return value;
}

/** Un check est-il actif ? (sinon on ne traite pas les messages, par perf) */
export function modActive(cfg: ModConfig): boolean {
  return cfg.blockLinks || cfg.capsEnabled || cfg.blacklist.length > 0;
}

// --- Permis temporaires (un mod autorise un viewer à poster un lien) ---------
const permits = new Map<string, number>();
export function grantPermit(login: string, seconds: number): void {
  permits.set(login.toLowerCase(), Date.now() + seconds * 1000);
}
function isPermitted(login: string): boolean {
  const exp = permits.get(login.toLowerCase());
  if (!exp) return false;
  if (exp < Date.now()) {
    permits.delete(login.toLowerCase());
    return false;
  }
  permits.delete(login.toLowerCase()); // usage unique
  return true;
}

const LINK_RE = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|net|org|tv|gg|fr|io|co|gl|ly|me|dev|app|xyz)\b)/i;

function capsRatio(text: string): number {
  const letters = text.replace(/[^a-zA-ZÀ-ÿ]/g, '');
  if (letters.length === 0) return 0;
  const caps = (text.match(/[A-ZÀ-Þ]/g) ?? []).length;
  return (caps / letters.length) * 100;
}

/** Renvoie une raison de sanction, ou null si le message est OK. */
export function checkMessage(cfg: ModConfig, text: string, ctx: ChatCtx): string | null {
  if (cfg.modsImmune && ctx.isMod) return null;

  if (cfg.blockLinks && LINK_RE.test(text) && !isPermitted(ctx.login)) {
    return 'liens interdits';
  }
  if (cfg.capsEnabled && text.length >= cfg.capsMinLength && capsRatio(text) >= cfg.capsPercent) {
    return 'trop de majuscules';
  }
  if (cfg.blacklist.length > 0) {
    const lower = text.toLowerCase();
    if (cfg.blacklist.some((w) => w && lower.includes(w.toLowerCase()))) {
      return 'mot interdit';
    }
  }
  return null;
}
