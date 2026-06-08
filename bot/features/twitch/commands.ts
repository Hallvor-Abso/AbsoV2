import { prisma } from '../../prisma';
import { env } from '../../env';
import { getChannelInfo, getStreamStart, getUserByLogin } from './helix';

/** Contexte d'un message de chat Twitch. */
export type ChatCtx = {
  login: string;
  display: string;
  isMod: boolean;
  isSub: boolean;
  broadcasterId: string | null;
  channel: string;
};

const SITE = env.SITE_URL;

function siteLink(path = ''): string {
  return SITE ? `${SITE}${path}` : 'notre site';
}

async function uptime(ctx: ChatCtx): Promise<string> {
  if (!ctx.broadcasterId) return 'Uptime indisponible.';
  const start = await getStreamStart(ctx.broadcasterId);
  if (!start) return `${ctx.channel} est hors-ligne.`;
  const ms = Date.now() - start.getTime();
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `En live depuis ${h > 0 ? `${h}h` : ''}${String(m).padStart(2, '0')}min.`;
}

async function channelField(ctx: ChatCtx, field: 'game' | 'title'): Promise<string> {
  if (!ctx.broadcasterId) return 'Indisponible.';
  const info = await getChannelInfo(ctx.broadcasterId);
  if (!info) return 'Indisponible.';
  return field === 'game' ? `Jeu : ${info.game || '—'}` : `Titre : ${info.title || '—'}`;
}

async function shoutout(args: string[]): Promise<string> {
  const target = args[0]?.replace(/^@/, '').toLowerCase();
  if (!target) return 'Usage : !so @pseudo';
  const u = await getUserByLogin(target);
  if (!u) return `Utilisateur introuvable : ${target}`;
  const info = await getChannelInfo(u.id);
  const game = info?.game ? ` (dernier jeu : ${info.game})` : '';
  return `Soutenez @${u.display_name} → twitch.tv/${u.login}${game} 💜`;
}

async function progress(args: string[]): Promise<string> {
  const q = args.join(' ').toLowerCase().trim();
  const games = await prisma.game.findMany({
    where: { isActive: true },
    orderBy: [{ status: 'asc' }, { order: 'asc' }],
  });
  const game = q
    ? games.find((g) => g.slug.toLowerCase() === q || g.name.toLowerCase().includes(q))
    : games[0];
  if (!game) return 'Jeu introuvable.';
  const tier = await prisma.raidTier.findFirst({
    where: { gameId: game.id },
    orderBy: { createdAt: 'desc' },
    include: { bosses: true },
  });
  if (!tier) return `Aucune progression pour ${game.name}.`;
  const killed = tier.bosses.filter((b) => b.status === 'KILLED').length;
  return `${game.name} — ${tier.name} : ${killed}/${tier.bosses.length} boss vaincus. ${siteLink('/progression')}`;
}

async function discordLink(): Promise<string> {
  const row = await prisma.siteContent.findUnique({ where: { key: 'site.discordUrl' } });
  const url = row?.value;
  return url ? `Rejoins le Discord : ${url}` : 'Rejoins notre Discord !';
}

/** Remplace les variables d'une réponse custom : $(user), $(touser), $(channel). */
function interpolate(tpl: string, ctx: ChatCtx, args: string[]): string {
  const touser = args[0]?.replace(/^@/, '') || ctx.display;
  return tpl
    .replace(/\$\(user\)/g, ctx.display)
    .replace(/\$\(touser\)/g, touser)
    .replace(/\$\(channel\)/g, ctx.channel);
}

/** Renvoie le texte d'une commande personnalisée si elle existe, sinon undefined. */
async function customCommand(
  name: string,
  args: string[],
  ctx: ChatCtx,
): Promise<{ found: true; reply: string | null } | { found: false }> {
  const cmd = await prisma.twitchCommand.findUnique({ where: { name } });
  if (!cmd) return { found: false };
  if (!cmd.enabled) return { found: true, reply: null };
  if (cmd.userLevel === 'MOD' && !ctx.isMod) return { found: true, reply: null };
  if (cmd.userLevel === 'SUB' && !ctx.isSub && !ctx.isMod) return { found: true, reply: null };
  return { found: true, reply: interpolate(cmd.response, ctx, args) };
}

async function listCommands(): Promise<string> {
  const customs = await prisma.twitchCommand.findMany({ where: { enabled: true }, select: { name: true } });
  const builtin = ['uptime', 'jeu', 'titre', 'so', 'recrutement', 'progress', 'roster', 'site', 'discord'];
  const all = [...builtin, ...customs.map((c) => c.name)];
  return `Commandes : ${all.map((n) => `!${n}`).join(' ')}`;
}

/** Résout une commande (intégrée, guilde, ou custom). Renvoie le texte à poster, ou null. */
export async function resolveCommand(name: string, args: string[], ctx: ChatCtx): Promise<string | null> {
  // Une commande personnalisée du même nom REMPLACE l'intégrée (texte modifiable depuis l'admin).
  const custom = await customCommand(name, args, ctx);
  if (custom.found) return custom.reply;

  switch (name) {
    case 'uptime':
      return uptime(ctx);
    case 'jeu':
    case 'game':
      return channelField(ctx, 'game');
    case 'titre':
    case 'title':
      return channelField(ctx, 'title');
    case 'so':
    case 'shoutout':
      return shoutout(args);
    case 'recrutement':
    case 'recrute':
      return `On recrute ! Postule sur ${siteLink('/recrutement')} 🛡️`;
    case 'progress':
    case 'progression':
      return progress(args);
    case 'roster':
    case 'effectif':
      return `Notre effectif : ${siteLink('/roster')}`;
    case 'site':
      return `Le site de la guilde : ${siteLink()}`;
    case 'discord':
      return discordLink();
    case 'commandes':
    case 'commands':
      return listCommands();
    default:
      return null;
  }
}
