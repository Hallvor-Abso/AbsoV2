import type { Client } from 'discord.js';
import { SignupStatus } from '@prisma/client';
import { prisma } from '../prisma';
import { env } from '../env';
import { sweepRaidRosters } from './raid-roster';
import { publishScheduledEvents } from './calendar';

/**
 * Rappels de raid en message privé :
 *  - ~24h avant → MP aux inscrits « Peut-être » (penser à confirmer)
 *  - ~1h avant  → MP aux inscrits « Présent » (prépare-toi)
 * Chaque rappel est horodaté sur l'événement → envoyé une seule fois.
 * Les MP qui échouent (MP fermés) sont ignorés silencieusement.
 */

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // toutes les 5 minutes

function fmt(d: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Europe/Paris',
  }).format(d);
}

async function dm(client: Client, discordId: string, content: string): Promise<void> {
  try {
    const user = await client.users.fetch(discordId);
    await user.send(content);
  } catch {
    // MP fermés / utilisateur introuvable → on ignore.
  }
}

async function sendReminders(client: Client): Promise<void> {
  const now = new Date();
  const in1h = new Date(now.getTime() + 60 * 60 * 1000);
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // 24h avant (entre 1h et 24h).
  const events24 = await prisma.event.findMany({
    where: { startDate: { gt: in1h, lte: in24h }, reminder24hSentAt: null },
    include: { game: true, signups: true },
  });
  for (const ev of events24) {
    // a) « Peut-être » → pense à confirmer.
    const maybes = ev.signups.filter((s) => s.status === SignupStatus.MAYBE);
    for (const s of maybes) {
      await dm(
        client,
        s.discordId,
        `📅 **Rappel — ${ev.title}** (${ev.game.name})\nLe raid approche : **${fmt(ev.startDate)}**.\nTu es inscrit **Peut-être** — pense à confirmer ta présence ! ✅`,
      );
    }

    // b) Membres+ du jeu (grade Membre/Roster/Officier) qui n'ont pas répondu → pense à t'inscrire.
    const responded = new Set(ev.signups.map((s) => s.discordId));
    const members = await prisma.user.findMany({
      where: { discordId: { not: null }, discordRoles: { has: `membre:${ev.gameId}` } },
      select: { discordId: true },
    });
    const link = env.SITE_URL ? `\nDonne ta réponse : ${env.SITE_URL}/calendrier` : '';
    let nNotif = 0;
    for (const m of members) {
      if (!m.discordId || responded.has(m.discordId)) continue;
      await dm(
        client,
        m.discordId,
        `📅 **Rappel — ${ev.title}** (${ev.game.name})\nLe raid approche : **${fmt(ev.startDate)}**.\nTu n'as pas encore répondu — inscris-toi si tu peux venir ! 🛡️${link}`,
      );
      nNotif += 1;
    }

    await prisma.event.update({ where: { id: ev.id }, data: { reminder24hSentAt: now } });
    if (maybes.length || nNotif) {
      console.log(`⏳ Rappel 24h : ${ev.title} → ${maybes.length} « peut-être » + ${nNotif} non-inscrit(s)`);
    }
  }

  // 1h avant (dans l'heure) → MP aux « Présent ».
  const events1 = await prisma.event.findMany({
    where: { startDate: { gt: now, lte: in1h }, reminder1hSentAt: null },
    include: { game: true, signups: { where: { status: SignupStatus.GOING } } },
  });
  for (const ev of events1) {
    for (const s of ev.signups) {
      await dm(
        client,
        s.discordId,
        `🔔 **Rappel — ${ev.title}** (${ev.game.name})\nÇa commence dans moins d'une heure : **${fmt(ev.startDate)}**.\nTu es **Présent** — prépare-toi ! 🛡️`,
      );
    }
    await prisma.event.update({ where: { id: ev.id }, data: { reminder1hSentAt: now } });
    if (ev.signups.length) console.log(`🔔 Rappel 1h : ${ev.title} → ${ev.signups.length} MP`);
  }
}

/** Démarre la boucle de rappels (vérification périodique). */
export function startReminderLoop(client: Client): void {
  const run = () => {
    sendReminders(client).catch((e) => console.error('Rappels raid :', e));
    sweepRaidRosters(client).catch((e) => console.error('Nettoyage groupes raid :', e));
    publishScheduledEvents(client).catch((e) => console.error('Publication planifiée :', e));
  };
  run();
  setInterval(run, CHECK_INTERVAL_MS);
}
