/**
 * Notifications Discord sortantes (site → Discord) via un webhook entrant.
 *
 * Indépendant du futur bot : le site pousse un message dans un salon dès qu'un
 * événement intéressant survient (nouvelle candidature, etc.). C'est un no-op
 * silencieux si `DISCORD_WEBHOOK_URL` n'est pas configuré, et un échec d'envoi
 * n'interrompt jamais le flux applicatif.
 */
type EmbedField = { name: string; value: string; inline?: boolean };

export async function notifyDiscord(opts: {
  title: string;
  description?: string;
  url?: string;
  fields?: EmbedField[];
  color?: number;
}): Promise<void> {
  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) return;

  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [
          {
            title: opts.title.slice(0, 256),
            description: opts.description?.slice(0, 4000),
            url: opts.url,
            color: opts.color ?? 0x4a9eff,
            fields: opts.fields?.slice(0, 25).map((f) => ({
              name: f.name.slice(0, 256),
              value: (f.value || '—').slice(0, 1024),
              inline: f.inline ?? false,
            })),
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
  } catch {
    // Volontairement silencieux : une notif ratée ne doit rien casser.
  }
}
