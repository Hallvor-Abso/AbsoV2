'use client';

import { useEffect, useState } from 'react';

/**
 * Habillage de scène principale (par-dessus le jeu) — Browser Source OBS 1920×1080.
 * Fond TRANSPARENT : on ne voit que les décors (coins + plaques en bas).
 *   https://absolution-guild.com/overlay/scene
 *
 * Le cadre caméra est une source SÉPARÉE (/overlay/camera) pour rester déplaçable.
 *
 * Paramètres d'URL (optionnels) :
 *   ?name=Hallvor   ?live=LIVE   ?guild=0 (masque Absolution)
 *   ?site=1 (affiche le site)    ?siteUrl=absolution-guild.com
 */

const ACCENT = '#4A9EFF';

type Cfg = { name: string; live: string; plate: boolean; guild: boolean; site: boolean; siteUrl: string };

function readConfig(): Cfg {
  const p = new URLSearchParams(window.location.search);
  return {
    name: p.get('name') || 'Hallvor',
    live: p.get('live') || 'Live',
    plate: p.get('plate') !== '0', // ?plate=0 : masque la plaque pseudo intégrée
    guild: p.get('guild') !== '0', // ?guild=0 : masque « Absolution » intégré
    site: p.get('site') === '1',
    siteUrl: p.get('siteUrl') || 'absolution-guild.com',
  };
}

export default function SceneOverlay() {
  const [cfg, setCfg] = useState<Cfg | null>(null);
  useEffect(() => setCfg(readConfig()), []);
  if (!cfg) return <div className="sc-root" />;

  return (
    <div className="sc-root">
      {/* Coins décoratifs */}
      <span className="sc-corner sc-tl" />
      <span className="sc-corner sc-tr" />
      <span className="sc-corner sc-bl" />
      <span className="sc-corner sc-br" />

      {/* Plaque pseudo (bas gauche) */}
      {cfg.plate && (
        <div className="sc-plate sc-left">
          <span className="sc-live-dot" />
          <span className="sc-name">{cfg.name}</span>
          <span className="sc-live">{cfg.live}</span>
        </div>
      )}

      {/* Marque guilde (bas droite) */}
      {cfg.guild && (
        <div className="sc-plate sc-right">
          <span className="sc-brand">
            Abso<span style={{ color: ACCENT }}>lution</span>
          </span>
          {cfg.site && <span className="sc-site">Rejoins-nous : {cfg.siteUrl}</span>}
        </div>
      )}

      <style>{`
        .sc-root { position: fixed; inset: 0; overflow: hidden; background: transparent;
          pointer-events: none; font-family: var(--font-space-grotesk), system-ui, sans-serif; color: #fff; }

        /* Coins en équerre */
        .sc-corner { position: absolute; width: 64px; height: 64px; opacity: .85;
          filter: drop-shadow(0 0 6px rgba(74,158,255,.5)); }
        .sc-corner::before, .sc-corner::after { content: ''; position: absolute; background: ${ACCENT}; }
        .sc-corner::before { width: 100%; height: 4px; }
        .sc-corner::after { width: 4px; height: 100%; }
        .sc-tl { top: 28px; left: 28px; }
        .sc-tl::before { top: 0; left: 0; } .sc-tl::after { top: 0; left: 0; }
        .sc-tr { top: 28px; right: 28px; }
        .sc-tr::before { top: 0; right: 0; } .sc-tr::after { top: 0; right: 0; }
        .sc-bl { bottom: 28px; left: 28px; }
        .sc-bl::before { bottom: 0; left: 0; } .sc-bl::after { bottom: 0; left: 0; }
        .sc-br { bottom: 28px; right: 28px; }
        .sc-br::before { bottom: 0; right: 0; } .sc-br::after { bottom: 0; right: 0; }

        /* Plaques */
        .sc-plate { position: absolute; bottom: 44px; display: inline-flex; align-items: center; gap: 14px;
          padding: 14px 22px; border-radius: 14px;
          background: linear-gradient(180deg, rgba(20,26,38,.94), rgba(10,12,17,.94));
          backdrop-filter: blur(6px); box-shadow: 0 8px 30px rgba(0,0,0,.5); }
        .sc-left { left: 64px; }
        .sc-right { right: 64px; flex-direction: column; align-items: flex-end; gap: 2px; }

        .sc-live-dot { width: 12px; height: 12px; border-radius: 50%; background: #ff4d4d;
          box-shadow: 0 0 0 0 rgba(255,77,77,.7); animation: scBlink 1.6s ease-out infinite; }
        .sc-name { font-size: 26px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }
        .sc-live { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .25em;
          color: ${ACCENT}; padding: 3px 8px; border: 1px solid rgba(74,158,255,.5); border-radius: 6px; }

        .sc-brand { font-size: 22px; font-weight: 700; text-transform: uppercase; letter-spacing: .2em;
          color: rgba(255,255,255,.9); }
        .sc-site { font-family: var(--font-inter), system-ui, sans-serif; font-size: 13px;
          letter-spacing: .03em; color: rgba(255,255,255,.6); }

        @keyframes scBlink { 0% { box-shadow: 0 0 0 0 rgba(255,77,77,.7); }
          70% { box-shadow: 0 0 0 12px rgba(255,77,77,0); } 100% { box-shadow: 0 0 0 0 rgba(255,77,77,0); } }
      `}</style>
    </div>
  );
}
