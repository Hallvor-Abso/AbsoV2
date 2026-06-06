'use client';

import { useEffect, useState } from 'react';

/**
 * Plaque pseudo « Hallvor ● LIVE » autonome et déplaçable — Browser Source OBS
 * séparée (fond transparent), à placer où tu veux.
 *
 *   Avec panneau :   https://absolution-guild.com/overlay/nameplate
 *   Texte seul :     https://absolution-guild.com/overlay/nameplate?bare=1
 *
 * Paramètres : ?name=Hallvor  ?live=Live  ?bare=1 (sans panneau)
 */

const ACCENT = '#4A9EFF';

type Cfg = { name: string; live: string; bare: boolean };

function readConfig(): Cfg {
  const p = new URLSearchParams(window.location.search);
  return {
    name: p.get('name') || 'Hallvor',
    live: p.get('live') || 'Live',
    bare: p.get('bare') === '1',
  };
}

export default function NameplateOverlay() {
  const [cfg, setCfg] = useState<Cfg | null>(null);
  useEffect(() => setCfg(readConfig()), []);
  if (!cfg) return <div className="np-root" />;

  return (
    <div className="np-root">
      <div className={`np-card ${cfg.bare ? 'np-bare' : ''}`}>
        <span className="np-dot" />
        <span className="np-name">{cfg.name}</span>
        <span className="np-live">{cfg.live}</span>
      </div>

      <style>{`
        .np-root { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
          background: transparent; font-family: var(--font-space-grotesk), system-ui, sans-serif; color: #fff; }
        .np-card { display: inline-flex; align-items: center; gap: 14px; padding: 14px 22px; border-radius: 14px;
          background: linear-gradient(180deg, rgba(20,26,38,.82), rgba(10,12,17,.82));
          backdrop-filter: blur(6px); box-shadow: 0 8px 30px rgba(0,0,0,.45); }
        /* Texte seul : pas de panneau, ombre forte pour rester lisible sur le jeu */
        .np-bare { background: none; backdrop-filter: none; box-shadow: none; padding: 0;
          text-shadow: 0 2px 8px rgba(0,0,0,.9), 0 0 18px rgba(0,0,0,.7); }
        .np-dot { width: 12px; height: 12px; border-radius: 50%; background: #ff4d4d;
          box-shadow: 0 0 0 0 rgba(255,77,77,.7); animation: npBlink 1.6s ease-out infinite; }
        .np-name { font-size: 26px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }
        .np-live { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .25em; color: ${ACCENT}; }
        .np-card:not(.np-bare) .np-live { padding: 3px 8px; border: 1px solid rgba(74,158,255,.5); border-radius: 6px; }
        @keyframes npBlink { 0% { box-shadow: 0 0 0 0 rgba(255,77,77,.7); }
          70% { box-shadow: 0 0 0 12px rgba(255,77,77,0); } 100% { box-shadow: 0 0 0 0 rgba(255,77,77,0); } }
      `}</style>
    </div>
  );
}
