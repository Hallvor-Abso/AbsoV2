'use client';

import { useEffect, useState } from 'react';

/**
 * Cadre caméra SEUL — source Browser OBS séparée, à poser sur ta webcam et à
 * déplacer/redimensionner librement. Le centre est TRANSPARENT (la webcam, placée
 * en dessous dans OBS, apparaît au travers). Le cadre remplit toute la source.
 *   https://absolution-guild.com/overlay/camera
 *
 * Astuce OBS : règle la taille de la source à ton format webcam (ex. 480×270),
 * le cadre s'adapte automatiquement.
 *
 * Paramètres d'URL : ?name=Hallvor   ?plate=0 (masque la plaque pseudo)
 */

const ACCENT = '#4A9EFF';

type Cfg = { name: string; plate: boolean };

function readConfig(): Cfg {
  const p = new URLSearchParams(window.location.search);
  return { name: p.get('name') || 'Hallvor', plate: p.get('plate') !== '0' };
}

export default function CameraFrame() {
  const [cfg, setCfg] = useState<Cfg | null>(null);
  useEffect(() => setCfg(readConfig()), []);
  if (!cfg) return <div className="cam-root" />;

  return (
    <div className="cam-root">
      <div className="cam-frame">
        <span className="cam-c cam-tl" />
        <span className="cam-c cam-tr" />
        <span className="cam-c cam-bl" />
        <span className="cam-c cam-br" />
      </div>

      {cfg.plate && (
        <div className="cam-plate">
          <span className="cam-dot" />
          {cfg.name}
        </div>
      )}

      <style>{`
        .cam-root { position: fixed; inset: 0; background: transparent; pointer-events: none;
          font-family: var(--font-space-grotesk), system-ui, sans-serif; color: #fff; }

        /* Cadre : bordure + lueur, centre transparent */
        .cam-frame { position: absolute; inset: 0; border-radius: 16px;
          border: 3px solid rgba(74,158,255,.85);
          box-shadow: 0 0 22px rgba(74,158,255,.4), inset 0 0 0 1px rgba(255,255,255,.06),
            inset 0 0 36px rgba(0,0,0,.28); }

        /* Équerres de coin (par-dessus la bordure) */
        .cam-c { position: absolute; width: 30px; height: 30px; }
        .cam-c::before, .cam-c::after { content: ''; position: absolute; background: ${ACCENT};
          box-shadow: 0 0 8px rgba(74,158,255,.7); }
        .cam-c::before { width: 100%; height: 5px; }
        .cam-c::after { width: 5px; height: 100%; }
        .cam-tl { top: -2px; left: -2px; }
        .cam-tl::before { top: 0; left: 0; border-top-left-radius: 4px; }
        .cam-tl::after { top: 0; left: 0; }
        .cam-tr { top: -2px; right: -2px; }
        .cam-tr::before { top: 0; right: 0; } .cam-tr::after { top: 0; right: 0; }
        .cam-bl { bottom: -2px; left: -2px; }
        .cam-bl::before { bottom: 0; left: 0; } .cam-bl::after { bottom: 0; left: 0; }
        .cam-br { bottom: -2px; right: -2px; }
        .cam-br::before { bottom: 0; right: 0; } .cam-br::after { bottom: 0; right: 0; }

        /* Plaque pseudo en bas du cadre */
        .cam-plate { position: absolute; left: 14px; bottom: 14px; display: inline-flex; align-items: center; gap: 9px;
          padding: 7px 14px; border-radius: 10px; font-size: 18px; font-weight: 700;
          text-transform: uppercase; letter-spacing: .08em;
          background: linear-gradient(180deg, rgba(20,26,38,.9), rgba(10,12,17,.9));
          border: 1px solid rgba(74,158,255,.45); box-shadow: 0 6px 18px rgba(0,0,0,.5); }
        .cam-dot { width: 10px; height: 10px; border-radius: 50%; background: #ff4d4d;
          box-shadow: 0 0 0 0 rgba(255,77,77,.7); animation: camBlink 1.6s ease-out infinite; }

        @keyframes camBlink { 0% { box-shadow: 0 0 0 0 rgba(255,77,77,.7); }
          70% { box-shadow: 0 0 0 10px rgba(255,77,77,0); } 100% { box-shadow: 0 0 0 0 rgba(255,77,77,0); } }
      `}</style>
    </div>
  );
}
