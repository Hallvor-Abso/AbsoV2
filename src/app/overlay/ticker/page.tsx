'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ACCENT, useOverlayConfig, useOverlayData, useSiteLogo } from '@/components/overlay/overlay-kit';

/**
 * Panneau d'infos — Browser Source OBS, fond transparent. Le panneau REMPLIT
 * sa source : dimensionne la source à la largeur de ta caméra et place-la
 * au-dessus. Affiche un message à la fois ; pour passer au suivant, le panneau
 * pivote en 3D comme un cube. Messages perso + infos auto de la guilde.
 *   https://absolution-guild.com/overlay/ticker
 *   https://absolution-guild.com/overlay/ticker?messages=Salut à tous|GG l'équipe
 *
 * Paramètres :
 *   ?messages=A|B|C   (messages personnalisés, séparés par « | »)
 *   ?auto=0           (désactive les infos automatiques de la guilde)
 *   ?interval=6       (durée d'affichage de chaque message, en secondes)
 *   ?logo=1           (affiche le logo de la guilde devant le message)
 */

type Cfg = { messages: string[]; auto: boolean; interval: number; logo: boolean };

const FACE_ROT = [0, 90, 180, 270];

function readConfig(get: (k: string) => string | null): Cfg {
  const interval = Number(get('interval'));
  const raw = get('messages') || '';
  return {
    messages: raw.split('|').map((s) => s.trim()).filter(Boolean),
    auto: get('auto') !== '0',
    interval: Number.isFinite(interval) && interval > 0 ? interval : 6,
    logo: get('logo') === '1',
  };
}

function buildItems(cfg: Cfg | null, data: ReturnType<typeof useOverlayData>): string[] {
  if (!cfg) return [];
  const items = [...cfg.messages];
  if (cfg.auto && data) {
    if (data.nextEvent) items.push(`Prochain raid : ${data.nextEvent.title} · ${data.nextEvent.game}`);
    if (data.latestNews) items.push(`News : ${data.latestNews.title}`);
    if (data.recentKills[0]) items.push(`Dernier boss tombé : ${data.recentKills[0].name} · ${data.recentKills[0].game}`);
  }
  if (items.length === 0) items.push('Absolution — Progression. Cohésion. Excellence.');
  return items;
}

export default function TickerOverlay() {
  const { ready, get } = useOverlayConfig('ticker');
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const data = useOverlayData();
  const logo = useSiteLogo() || '/absolution-emblem.svg';
  useEffect(() => {
    if (ready) setCfg(readConfig(get));
  }, [ready, get]);

  const items = useMemo(() => buildItems(cfg, data), [cfg, data]);
  const itemsKey = items.join('§');

  // Profondeur du cube = moitié de la hauteur du panneau (mesurée) → cube parfait
  // quelle que soit la taille de la source.
  const sceneRef = useRef<HTMLDivElement>(null);
  const [depth, setDepth] = useState(28);
  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    const update = () => setDepth(Math.max(8, el.clientHeight / 2));
    const ro = new ResizeObserver(update);
    ro.observe(el);
    update();
    return () => ro.disconnect();
  }, []);

  // Cube à 4 faces : la face visible affiche items[step % len] ; à chaque pas on
  // pivote de 90° et on charge le message suivant sur la face entrante (de profil).
  const [faces, setFaces] = useState<string[]>(['', '', '', '']);
  const [rot, setRot] = useState(0);
  const stepRef = useRef(0);

  useEffect(() => {
    if (items.length === 0) return;
    stepRef.current = 0;
    setRot(0);
    setFaces([0, 1, 2, 3].map((k) => items[k % items.length]));
    if (items.length < 2) return;

    const id = setInterval(() => {
      const ns = stepRef.current + 1;
      stepRef.current = ns;
      setFaces((f) => {
        const c = [...f];
        c[ns % 4] = items[ns % items.length]; // face entrante (encore de profil)
        return c;
      });
      setRot(-90 * ns);
    }, cfg!.interval * 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, cfg?.interval]);

  if (!cfg) return <div className="tk-root" />;

  return (
    <div className="tk-root">
      <div className="tk-panel">
        <span className="tk-sheen" />
        <span className="tk-c tk-tl" />
        <span className="tk-c tk-tr" />
        <span className="tk-c tk-bl" />
        <span className="tk-c tk-br" />
        <div className="tk-scene" ref={sceneRef}>
          <div className="tk-cube" style={{ transform: `translateZ(-${depth}px) rotateX(${rot}deg)` }}>
            {faces.map((text, i) => (
              <div
                key={i}
                className="tk-face"
                style={{ transform: `rotateX(${FACE_ROT[i]}deg) translateZ(${depth}px)` }}
              >
                {cfg.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="tk-logo" src={logo} alt="" />
                ) : (
                  <span className="tk-bullet">◆</span>
                )}
                <span className="tk-text">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .tk-root { position: fixed; inset: 0; background: transparent;
          font-family: var(--font-space-grotesk), system-ui, sans-serif; color: #fff; }
        .tk-panel { position: absolute; inset: 0; border-radius: 16px; overflow: hidden;
          background:
            radial-gradient(120% 140% at 50% -20%, rgba(74,158,255,.16), transparent 60%),
            linear-gradient(180deg, rgba(18,24,35,.97), rgba(8,10,15,.97));
          border: 2px solid rgba(74,158,255,.85);
          box-shadow: 0 0 18px rgba(74,158,255,.38), 0 10px 28px rgba(0,0,0,.5),
            inset 0 0 0 1px rgba(255,255,255,.05), inset 0 0 34px rgba(0,0,0,.32);
          animation: tkGlow 3.6s ease-in-out infinite; }
        @keyframes tkGlow {
          0%,100% { box-shadow: 0 0 16px rgba(74,158,255,.30), 0 10px 28px rgba(0,0,0,.5),
            inset 0 0 0 1px rgba(255,255,255,.05), inset 0 0 34px rgba(0,0,0,.32); }
          50% { box-shadow: 0 0 26px rgba(74,158,255,.55), 0 10px 28px rgba(0,0,0,.5),
            inset 0 0 0 1px rgba(255,255,255,.07), inset 0 0 34px rgba(0,0,0,.32); }
        }

        /* Ligne lumineuse qui balaie le haut du panneau. */
        .tk-sheen { position: absolute; top: 0; left: 0; right: 0; height: 2px; z-index: 3; pointer-events: none;
          background: linear-gradient(90deg, transparent, ${ACCENT}, transparent);
          background-size: 50% 100%; background-repeat: no-repeat;
          animation: tkSheen 4.5s ease-in-out infinite; }
        @keyframes tkSheen { 0% { background-position: -60% 0; } 100% { background-position: 160% 0; } }

        /* Coins en équerre, comme le cadre caméra. */
        .tk-c { position: absolute; width: 20px; height: 20px; z-index: 3; pointer-events: none; }
        .tk-c::before, .tk-c::after { content: ''; position: absolute; background: ${ACCENT};
          box-shadow: 0 0 8px rgba(74,158,255,.7); }
        .tk-c::before { width: 100%; height: 3px; } .tk-c::after { width: 3px; height: 100%; }
        .tk-tl { top: 4px; left: 4px; } .tk-tl::before, .tk-tl::after { top: 0; left: 0; }
        .tk-tr { top: 4px; right: 4px; } .tk-tr::before { top: 0; right: 0; } .tk-tr::after { top: 0; right: 0; }
        .tk-bl { bottom: 4px; left: 4px; } .tk-bl::before { bottom: 0; left: 0; } .tk-bl::after { bottom: 0; left: 0; }
        .tk-br { bottom: 4px; right: 4px; } .tk-br::before { bottom: 0; right: 0; } .tk-br::after { bottom: 0; right: 0; }

        .tk-scene { width: 100%; height: 100%; perspective: 1100px; }
        .tk-cube { position: relative; width: 100%; height: 100%; transform-style: preserve-3d;
          transition: transform .8s cubic-bezier(.62,.04,.2,1); }
        .tk-face { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          gap: 11px; padding: 6px 24px; backface-visibility: hidden; }
        .tk-bullet { color: ${ACCENT}; font-size: 11px; flex: none; filter: drop-shadow(0 0 5px rgba(74,158,255,.8)); }
        .tk-logo { height: 64%; max-height: 32px; width: auto; flex: none;
          filter: drop-shadow(0 0 6px rgba(74,158,255,.65)); }
        .tk-text { font-size: 19px; font-weight: 500; line-height: 1.2; text-align: center; letter-spacing: .01em;
          color: rgba(255,255,255,.95); text-shadow: 0 1px 8px rgba(0,0,0,.5);
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
}
