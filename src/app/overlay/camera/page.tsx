'use client';

import { useEffect, useState } from 'react';
import { useOverlayConfig, useSiteLogo } from '@/components/overlay/overlay-kit';

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

type Cfg = { name: string; plate: boolean; fill: boolean; image: string; label: string };

function readConfig(get: (k: string) => string | null): Cfg {
  const image = get('image') || '';
  return {
    name: get('name') || 'Hallvor',
    plate: get('plate') !== '0',
    fill: get('fill') === '1' || Boolean(image), // remplit l'intérieur si demandé
    image,
    label: get('label') || 'Caméra bientôt',
  };
}

export default function CameraFrame() {
  const { ready, get } = useOverlayConfig('camera');
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const siteLogo = useSiteLogo();
  useEffect(() => {
    if (ready) setCfg(readConfig(get));
  }, [ready, get]);
  if (!cfg) return <div className="cam-root" />;

  // Logo réel téléversé dans l'admin, sinon emblème embarqué.
  const placeholderLogo = siteLogo || '/absolution-emblem.svg';

  return (
    <div className="cam-root">
      {cfg.fill && (
        <div
          className="cam-fill"
          style={cfg.image ? { backgroundImage: `url(${cfg.image})` } : undefined}
        >
          {!cfg.image && (
            <div className="cam-ph">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="cam-ph-logo" src={placeholderLogo} alt="" />
              <div className="cam-ph-text">{cfg.label}</div>
            </div>
          )}
        </div>
      )}
      <div className="cam-frame">
        <span className="cam-sheen" />
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

        /* Remplissage de l'intérieur (placeholder ou image) quand pas de webcam.
           Même ambiance que le panneau d'infos. */
        .cam-fill { position: absolute; inset: 0; border-radius: 14px; overflow: hidden;
          background:
            radial-gradient(120% 140% at 50% -20%, rgba(74,158,255,.14), transparent 60%),
            linear-gradient(180deg, rgba(18,24,35,.96), rgba(8,10,15,.97));
          background-size: cover; background-position: center;
          display: flex; align-items: center; justify-content: center; }
        .cam-ph { display: flex; flex-direction: column; align-items: center; gap: 14px; }
        .cam-ph-logo { width: 38%; max-width: 130px; min-width: 64px; opacity: .92;
          filter: drop-shadow(0 0 10px rgba(74,158,255,.35)); }
        .cam-ph-text { font-size: 16px; letter-spacing: .18em; text-transform: uppercase;
          color: rgba(255,255,255,.55); }

        /* Cadre : même langage que le panneau d'infos — bordure fine, lueur
           douce, ligne d'accent en bas, balayage lumineux. Centre transparent. */
        .cam-frame { position: absolute; inset: 0; border-radius: 14px; overflow: hidden;
          border: 1px solid rgba(74,158,255,.45);
          box-shadow: 0 0 18px rgba(74,158,255,.22), 0 10px 28px rgba(0,0,0,.4),
            inset 0 0 0 1px rgba(255,255,255,.04); }
        /* fine ligne d'accent en bas du cadre */
        .cam-frame::after { content: ''; position: absolute; left: 10%; right: 10%; bottom: 0; height: 2px;
          background: linear-gradient(90deg, transparent, ${ACCENT}, transparent); opacity: .8; }

        /* Ligne lumineuse qui balaie le haut du cadre (comme le panneau). */
        .cam-sheen { position: absolute; top: 0; left: 0; right: 0; height: 2px; pointer-events: none;
          background: linear-gradient(90deg, transparent, ${ACCENT}, transparent);
          background-size: 50% 100%; background-repeat: no-repeat;
          animation: camSheen 4.5s ease-in-out infinite; }
        @keyframes camSheen { 0% { background-position: -60% 0; } 100% { background-position: 160% 0; } }

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
