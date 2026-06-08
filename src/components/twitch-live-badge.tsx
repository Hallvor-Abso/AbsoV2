'use client';

import { useEffect, useState } from 'react';

type Status = {
  live: boolean;
  login: string;
  title?: string;
  game?: string;
  viewers?: number;
};

/**
 * Badge « EN LIVE » : interroge /api/twitch/live et n'apparaît que lorsque la
 * chaîne diffuse. Rien ne s'affiche hors-ligne (ou si Twitch non configuré).
 */
export function TwitchLiveBadge() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    let active = true;
    const load = () =>
      fetch('/api/twitch/live')
        .then((r) => (r.ok ? r.json() : null))
        .then((d: Status | null) => {
          if (active) setStatus(d);
        })
        .catch(() => {});
    load();
    const id = setInterval(load, 90_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  if (!status?.live || !status.login) return null;
  const url = `https://twitch.tv/${status.login}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group inline-flex items-center gap-2.5 rounded-full border border-[#9146FF]/50 bg-[#9146FF]/10 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#9146FF]/20 transition hover:bg-[#9146FF]/20"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
      </span>
      <span className="tracking-wide">EN LIVE</span>
      {status.game && <span className="hidden font-normal text-white/70 sm:inline">· {status.game}</span>}
      {typeof status.viewers === 'number' && (
        <span className="hidden font-normal text-white/70 md:inline">· {status.viewers} 👁</span>
      )}
      <span className="text-white/80 transition group-hover:translate-x-0.5">↗</span>
    </a>
  );
}
