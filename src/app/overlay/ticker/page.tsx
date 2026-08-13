'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ACCENT, useOverlayConfig, useOverlayData, useSiteLogo } from '@/components/overlay/overlay-kit';

/**
 * Panneau d'infos — Browser Source OBS, fond transparent. Le panneau REMPLIT
 * sa source : dimensionne la source à la largeur de ta caméra et place-la
 * au-dessus. Affiche un message à la fois, avec un fondu doux entre chaque.
 * Le texte S'ADAPTE toujours à la taille de la source (jamais coupé) :
 * il rétrécit légèrement si le message est long. Messages perso + infos auto.
 *   https://absolution-guild.com/overlay/ticker
 *   https://absolution-guild.com/overlay/ticker?messages=Salut à tous|GG l'équipe
 *
 * Paramètres :
 *   ?messages=A|B|C   (messages personnalisés, séparés par « | »)
 *   ?auto=0           (désactive les infos automatiques de la guilde)
 *   ?interval=6       (durée d'affichage de chaque message, en secondes)
 *   ?logo=1           (carré fixe à gauche avec le logo de la guilde)
 */

type Cfg = { messages: string[]; auto: boolean; interval: number; logo: boolean };

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

/**
 * Texte sur UNE ligne qui s'ajuste à la largeur disponible : si le message
 * déborde, la police est réduite proportionnellement (plancher à 50 %, au-delà
 * points de suspension — cas extrême d'une source très étroite).
 */
function FitText({ text }: { text: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const box = boxRef.current;
    const span = spanRef.current;
    if (!box || !span) return;
    const fit = () => {
      span.style.fontSize = ''; // mesure à la taille de base héritée
      const avail = box.clientWidth;
      const need = span.scrollWidth;
      if (avail > 0 && need > avail) {
        span.style.fontSize = `${Math.max(Math.round((avail / need) * 100), 50)}%`;
      }
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, [text]);
  return (
    <div ref={boxRef} className="tk-fit">
      <span ref={spanRef} className="tk-text">{text}</span>
    </div>
  );
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

  // Rotation : un message à la fois, fondu à chaque changement.
  const [step, setStep] = useState(0);
  useEffect(() => {
    setStep(0);
    if (!cfg || items.length < 2) return;
    const id = setInterval(() => setStep((s) => s + 1), cfg.interval * 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, cfg?.interval]);

  if (!cfg) return <div className="tk-root" />;

  const message = items[step % items.length] ?? '';

  return (
    <div className="tk-root">
      <div className="tk-panel">
        <span className="tk-sheen" />
        {cfg.logo && (
          <div className="tk-side">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="tk-side-logo" src={logo} alt="" />
          </div>
        )}
        {/* key = step → l'animation d'entrée rejoue à chaque message */}
        <div className="tk-msg" key={step % items.length}>
          <span className="tk-bullet">◆</span>
          <FitText text={message} />
        </div>
      </div>

      <style>{`
        /* Toutes les tailles sont relatives à la hauteur de la source (vh) :
           redimensionner la source redimensionne tout le panneau. */
        .tk-root { position: fixed; inset: 0; background: transparent;
          font-family: var(--font-space-grotesk), system-ui, sans-serif; color: #fff; }
        .tk-panel { position: absolute; inset: 3px; display: flex; align-items: stretch;
          border-radius: 14px; overflow: hidden;
          background:
            radial-gradient(120% 140% at 50% -20%, rgba(74,158,255,.14), transparent 60%),
            linear-gradient(180deg, rgba(18,24,35,.96), rgba(8,10,15,.97));
          border: 1px solid rgba(74,158,255,.45);
          box-shadow: 0 0 18px rgba(74,158,255,.22), 0 10px 28px rgba(0,0,0,.5),
            inset 0 0 0 1px rgba(255,255,255,.04); }
        /* fine ligne d'accent en bas du panneau */
        .tk-panel::after { content: ''; position: absolute; left: 10%; right: 10%; bottom: 0; height: 2px;
          background: linear-gradient(90deg, transparent, ${ACCENT}, transparent); opacity: .8; }

        /* Ligne lumineuse qui balaie le haut du panneau. */
        .tk-sheen { position: absolute; top: 0; left: 0; right: 0; height: 2px; z-index: 3; pointer-events: none;
          background: linear-gradient(90deg, transparent, ${ACCENT}, transparent);
          background-size: 50% 100%; background-repeat: no-repeat;
          animation: tkSheen 4.5s ease-in-out infinite; }
        @keyframes tkSheen { 0% { background-position: -60% 0; } 100% { background-position: 160% 0; } }

        /* Carré du logo : fixe, accolé au panneau. */
        .tk-side { flex: none; aspect-ratio: 1 / 1; height: 100%; z-index: 2;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(180deg, rgba(40,56,82,.85), rgba(20,28,42,.92));
          border-right: 1px solid rgba(74,158,255,.35);
          box-shadow: inset 0 0 18px rgba(74,158,255,.10); }
        .tk-side-logo { width: 62%; height: 62%; object-fit: contain;
          filter: drop-shadow(0 0 6px rgba(74,158,255,.6)); }

        /* Message : centré, une ligne, fondu à l'arrivée. */
        .tk-msg { flex: 1; min-width: 0; display: flex; align-items: center; justify-content: center;
          gap: 3.5vh; padding: 0 5vh; animation: tkIn .55s cubic-bezier(.2,.9,.3,1) both; }
        .tk-bullet { color: ${ACCENT}; font-size: 13vh; flex: none;
          filter: drop-shadow(0 0 5px rgba(74,158,255,.8)); }
        .tk-fit { flex: 1; min-width: 0; display: flex; justify-content: center; font-size: 32vh; }
        .tk-text { display: inline-block; max-width: 100%; white-space: nowrap; overflow: hidden;
          text-overflow: ellipsis; font-weight: 500; line-height: 1.25; letter-spacing: .01em;
          color: rgba(255,255,255,.95); text-shadow: 0 1px 8px rgba(0,0,0,.5); }

        @keyframes tkIn { from { opacity: 0; transform: translateY(24%); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}
