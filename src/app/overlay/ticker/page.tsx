'use client';

import { useEffect, useState } from 'react';
import { ACCENT, useOverlayConfig, useOverlayData } from '@/components/overlay/overlay-kit';

/**
 * Bandeau d'infos défilant (bas de l'écran) — Browser Source OBS, fond
 * transparent. Combine des messages personnalisés et, automatiquement, les
 * infos réelles de la guilde (prochain raid, dernière news, dernier boss).
 *   https://absolution-guild.com/overlay/ticker
 *   https://absolution-guild.com/overlay/ticker?messages=Salut à tous|GG l'équipe
 *
 * Paramètres :
 *   ?messages=A|B|C   (messages personnalisés, séparés par « | »)
 *   ?auto=0           (désactive les infos automatiques de la guilde)
 *   ?speed=40         (durée d'un défilement complet, en secondes)
 *   ?guild=0          (masque la pastille « Absolution »)
 */

type Cfg = { messages: string[]; auto: boolean; speed: number; guild: boolean };

function readConfig(get: (k: string) => string | null): Cfg {
  const speed = Number(get('speed'));
  const raw = get('messages') || '';
  return {
    messages: raw.split('|').map((s) => s.trim()).filter(Boolean),
    auto: get('auto') !== '0',
    speed: Number.isFinite(speed) && speed > 0 ? speed : 40,
    guild: get('guild') !== '0',
  };
}

export default function TickerOverlay() {
  const { ready, get } = useOverlayConfig('ticker');
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const data = useOverlayData();
  useEffect(() => {
    if (ready) setCfg(readConfig(get));
  }, [ready, get]);
  if (!cfg) return <div className="tk-root" />;

  // Items personnalisés + infos automatiques de la guilde.
  const items: string[] = [...cfg.messages];
  if (cfg.auto && data) {
    if (data.nextEvent) items.push(`Prochain raid : ${data.nextEvent.title} · ${data.nextEvent.game}`);
    if (data.latestNews) items.push(`News : ${data.latestNews.title}`);
    if (data.recentKills[0]) items.push(`Dernier boss tombé : ${data.recentKills[0].name} · ${data.recentKills[0].game}`);
  }
  if (items.length === 0) items.push('Absolution — Progression. Cohésion. Excellence.');

  // On duplique la séquence pour un défilement continu et sans couture.
  const sequence = [...items, ...items];

  return (
    <div className="tk-root">
      <div className="tk-bar">
        {cfg.guild && (
          <div className="tk-brand">
            Abso<span style={{ color: ACCENT }}>lution</span>
          </div>
        )}
        <div className="tk-viewport">
          <div className="tk-track" style={{ animationDuration: `${cfg.speed}s` }}>
            {sequence.map((msg, i) => (
              <span key={i} className="tk-item">
                <span className="tk-bullet">◆</span>
                {msg}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .tk-root { position: fixed; inset: 0; display: flex; align-items: flex-end;
          background: transparent; font-family: var(--font-space-grotesk), system-ui, sans-serif; color: #fff; }
        .tk-bar { display: flex; align-items: stretch; width: 100%; height: 58px;
          background: linear-gradient(180deg, rgba(16,21,31,.96), rgba(8,10,15,.96));
          border-top: 2px solid rgba(74,158,255,.55); box-shadow: 0 -8px 30px rgba(0,0,0,.5); }
        .tk-brand { display: flex; align-items: center; padding: 0 24px; font-weight: 700; font-size: 22px;
          text-transform: uppercase; letter-spacing: .18em; white-space: nowrap;
          background: rgba(74,158,255,.10); border-right: 1px solid rgba(74,158,255,.35); }
        .tk-viewport { position: relative; flex: 1; overflow: hidden; }
        .tk-track { position: absolute; top: 0; left: 0; height: 100%; display: flex; align-items: center;
          white-space: nowrap; will-change: transform; animation: tkScroll linear infinite; }
        .tk-item { display: inline-flex; align-items: center; gap: 18px; padding: 0 26px; font-size: 21px;
          font-weight: 500; color: rgba(255,255,255,.92); }
        .tk-bullet { color: ${ACCENT}; font-size: 13px; }
        @keyframes tkScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      `}</style>
    </div>
  );
}
