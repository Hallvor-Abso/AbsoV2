import { getRecentKills, getPublishedNews, getEvents } from '@/lib/data';

export const runtime = 'nodejs';
// Données toujours fraîches : un overlay OBS doit refléter l'état réel
// de la guilde sans dépendre du cache de build.
export const dynamic = 'force-dynamic';

/**
 * Données publiques consommées par les overlays dynamiques de stream
 * (bandeau d'infos `/overlay/ticker`, derniers boss `/overlay/kills`).
 * Ne renvoie que des informations déjà publiques sur le site. En cas
 * d'erreur (BDD indisponible), renvoie des listes vides : les overlays
 * retombent alors proprement sur leurs valeurs par défaut.
 */
export async function GET() {
  try {
    const now = Date.now();
    const [kills, news, events] = await Promise.all([
      getRecentKills(8),
      getPublishedNews(),
      getEvents(),
    ]);

    const recentKills = kills.map((b) => ({
      name: b.name,
      game: b.tier.game.name,
      color: b.tier.game.color,
      date: b.firstKillDate,
    }));

    const nextEvent =
      events
        .filter((e) => new Date(e.startDate).getTime() >= now)
        .map((e) => ({ title: e.title, game: e.game.name, startDate: e.startDate }))[0] ?? null;

    const latestNews = news[0]
      ? { title: news[0].title, game: news[0].game?.name ?? null }
      : null;

    return Response.json({ recentKills, nextEvent, latestNews });
  } catch {
    return Response.json({ recentKills: [], nextEvent: null, latestNews: null });
  }
}
