'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ACCENT, useOverlayConfig, useOverlayData } from '@/components/overlay/overlay-kit';

/**
 * Panneau d'infos (bas de l'écran) — Browser Source OBS, fond transparent.
 * Affiche UN message à la fois ; pour passer au suivant, le panneau pivote
 * en 3D comme un cube. Combine des messages personnalisés et, automatiquement,
 * les infos réelles de la guilde (prochain raid, dernière news, dernier boss).
 *   https://absolution-guild.com/overlay/ticker
 *   https://absolution-guild.com/overlay/ticker?messages=Salut à tous|GG l'équipe
 *
 * Paramètres :
 *   ?messages=A|B|C   (messages personnalisés, séparés par « | »)
 *   ?auto=0           (désactive les infos automatiques de la guilde)
 *   ?interval=6       (durée d'affichage de chaque message, en secondes)
 *   ?guild=0          (masque la pastille « Absolution »)
 */

type Cfg = { messages: string[]; auto: boolean; interval: number; guild: boolean };

const PANEL_H = 66; // hauteur du panneau (px) — sert aussi de profondeur au cube
const MSG_W = 560; // largeur de la zone message (px)

function readConfig(get: (k: string) => string | null): Cfg {
  const interval = Number(get('interval'));
  const raw = get('messages') || '';
  return {
    messages: raw.split('|').map((s) => s.trim()).filter(Boolean),
    auto: get('auto') !== '0',
    interval: Number.isFinite(interval) && interval > 0 ? interval : 6,
    guild: get('guild') !== '0',
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
  useEffect(() => {
    if (ready) setCfg(readConfig(get));
  }, [ready, get]);

  const items = useMemo(() => buildItems(cfg, data), [cfg, data]);
  const itemsKey = items.join('§');

  // Cube à 4 faces : la face visible affiche items[step % len] ; à chaque pas on
  // pivote de 90° et on charge le message suivant sur la face entrante (de profil,
  // donc invisible) — pas de saut ni de doublon.
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
        {cfg.guild && (
          <div className="tk-brand">
            Abso<span style={{ color: ACCENT }}>lution</span>
          </div>
        )}
        <div className="tk-scene">
          <div className="tk-cube" style={{ transform: `translateZ(-${PANEL_H / 2}px) rotateX(${rot}deg)` }}>
            {faces.map((text, i) => (
              <div key={i} className={`tk-face tk-f${i}`}>
                <span className="tk-bullet">◆</span>
                <span className="tk-text">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .tk-root { position: fixed; inset: 0; display: flex; align-items: flex-end; justify-content: flex-start;
          background: transparent; font-family: var(--font-space-grotesk), system-ui, sans-serif; color: #fff; }
        .tk-panel { display: flex; align-items: stretch; height: ${PANEL_H}px; margin: 0 0 30px 30px;
          border-radius: 12px; overflow: hidden;
          background: linear-gradient(180deg, rgba(16,21,31,.96), rgba(8,10,15,.96));
          border: 1px solid rgba(74,158,255,.45); box-shadow: 0 12px 34px rgba(0,0,0,.55); }
        .tk-brand { display: flex; align-items: center; padding: 0 22px; font-weight: 700; font-size: 21px;
          text-transform: uppercase; letter-spacing: .18em; white-space: nowrap;
          background: rgba(74,158,255,.12); border-right: 1px solid rgba(74,158,255,.35); }

        /* Scène 3D : le cube pivote autour de l'axe X (vertical). */
        .tk-scene { width: ${MSG_W}px; height: ${PANEL_H}px; perspective: 1100px; }
        .tk-cube { position: relative; width: 100%; height: 100%; transform-style: preserve-3d;
          transition: transform .8s cubic-bezier(.62,.04,.2,1); }
        .tk-face { position: absolute; inset: 0; display: flex; align-items: center; gap: 14px;
          padding: 0 24px; backface-visibility: hidden; }
        .tk-f0 { transform: rotateX(0deg)   translateZ(${PANEL_H / 2}px); }
        .tk-f1 { transform: rotateX(90deg)  translateZ(${PANEL_H / 2}px); }
        .tk-f2 { transform: rotateX(180deg) translateZ(${PANEL_H / 2}px); }
        .tk-f3 { transform: rotateX(270deg) translateZ(${PANEL_H / 2}px); }
        .tk-bullet { color: ${ACCENT}; font-size: 13px; flex: none; }
        .tk-text { font-size: 21px; font-weight: 500; line-height: 1.25; color: rgba(255,255,255,.94);
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
}
