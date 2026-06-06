'use client';

import { useEffect, useState } from 'react';
import { ACCENT, useOverlayConfig, useOverlayData } from '@/components/overlay/overlay-kit';
import { formatDate } from '@/lib/utils';

/**
 * « Derniers boss vaincus » — Browser Source OBS séparée (fond transparent),
 * alimentée par la progression réelle de la guilde (`/api/overlay/data`).
 * Se met à jour automatiquement pendant le stream.
 *   https://absolution-guild.com/overlay/kills?limit=5
 *
 * Paramètres : ?limit=5  ?title=Derniers boss vaincus  ?date=0 (masque les dates)
 */

type Cfg = { limit: number; title: string; showDate: boolean };

function readConfig(get: (k: string) => string | null): Cfg {
  const limit = Number(get('limit'));
  return {
    limit: Number.isFinite(limit) && limit > 0 ? limit : 5,
    title: get('title') || 'Derniers boss vaincus',
    showDate: get('date') !== '0',
  };
}

export default function KillsOverlay() {
  const { ready, get } = useOverlayConfig('kills');
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const data = useOverlayData();
  useEffect(() => {
    if (ready) setCfg(readConfig(get));
  }, [ready, get]);
  if (!cfg) return <div className="kl-root" />;

  const kills = (data?.recentKills ?? []).slice(0, cfg.limit);

  return (
    <div className="kl-root">
      <div className="kl-card">
        <div className="kl-head">
          <span className="kl-check">✓</span>
          {cfg.title}
        </div>
        {kills.length === 0 ? (
          <div className="kl-empty">En attente du prochain kill…</div>
        ) : (
          <ul className="kl-list">
            {kills.map((b, i) => (
              <li key={`${b.name}-${i}`} className="kl-row">
                <span className="kl-dot" style={{ backgroundColor: b.color, boxShadow: `0 0 10px ${b.color}` }} />
                <span className="kl-name">{b.name}</span>
                <span className="kl-game">{b.game}</span>
                {cfg.showDate && <span className="kl-date">{formatDate(b.date)}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <style>{`
        .kl-root { position: fixed; inset: 0; display: flex; align-items: flex-start; justify-content: flex-start;
          padding: 24px; background: transparent;
          font-family: var(--font-space-grotesk), system-ui, sans-serif; color: #fff; }
        .kl-card { width: min(420px, 92vw); padding: 16px 18px; border-radius: 16px;
          background: linear-gradient(180deg, rgba(20,26,38,.94), rgba(10,12,17,.94));
          backdrop-filter: blur(6px); box-shadow: 0 10px 34px rgba(0,0,0,.55); }
        .kl-head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px;
          font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: .14em;
          color: rgba(255,255,255,.92); }
        .kl-check { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px;
          border-radius: 50%; background: ${ACCENT}; color: #07090d; font-size: 14px; font-weight: 900;
          box-shadow: 0 0 14px rgba(74,158,255,.6); }
        .kl-empty { font-family: var(--font-inter), system-ui, sans-serif; font-size: 14px;
          color: rgba(255,255,255,.5); padding: 6px 2px; }
        .kl-list { display: flex; flex-direction: column; gap: 9px; }
        .kl-row { display: flex; align-items: center; gap: 10px; font-size: 16px;
          animation: klIn .5s ease both; }
        .kl-dot { flex: 0 0 auto; width: 10px; height: 10px; border-radius: 50%; }
        .kl-name { font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .kl-game { font-family: var(--font-inter), system-ui, sans-serif; font-size: 12px;
          color: rgba(255,255,255,.5); }
        .kl-date { margin-left: auto; flex: 0 0 auto; font-family: var(--font-inter), system-ui, sans-serif;
          font-size: 12px; color: ${ACCENT}; }
        @keyframes klIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}
