'use client';

import { useEffect, useState } from 'react';
import { ACCENT, useOverlayConfig } from '@/components/overlay/overlay-kit';

/**
 * Barre d'objectif (followers, abonnés, dons…) — Browser Source OBS séparée,
 * fond transparent, à poser où tu veux. La valeur se met à jour en changeant
 * l'URL (ou via un script qui recharge la source).
 *   https://absolution-guild.com/overlay/goal?label=Abonnés&current=42&target=100
 *
 * Paramètres : ?label=  ?current=  ?target=  ?unit=  (ex. ?unit=€)
 */

type Cfg = { label: string; current: number; target: number; unit: string };

function readConfig(get: (k: string) => string | null): Cfg {
  const current = Number(get('current'));
  const target = Number(get('target'));
  return {
    label: get('label') || 'Objectif abonnés',
    current: Number.isFinite(current) ? current : 0,
    target: Number.isFinite(target) && target > 0 ? target : 100,
    unit: get('unit') || '',
  };
}

export default function GoalOverlay() {
  const { ready, get } = useOverlayConfig('goal');
  const [cfg, setCfg] = useState<Cfg | null>(null);
  useEffect(() => {
    if (ready) setCfg(readConfig(get));
  }, [ready, get]);
  if (!cfg) return <div className="gl-root" />;

  const ratio = Math.min(Math.max(cfg.current / cfg.target, 0), 1);
  const pct = Math.round(ratio * 100);
  const u = cfg.unit ? ` ${cfg.unit}` : '';

  return (
    <div className="gl-root">
      <div className="gl-card">
        <div className="gl-head">
          <span className="gl-label">{cfg.label}</span>
          <span className="gl-count">
            {cfg.current}
            {u} <span className="gl-sep">/</span> {cfg.target}
            {u}
          </span>
        </div>
        <div className="gl-track">
          <div className="gl-fill" style={{ width: `${ratio * 100}%` }}>
            <span className="gl-shine" />
          </div>
          <span className="gl-pct">{pct}%</span>
        </div>
      </div>

      <style>{`
        .gl-root { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
          background: transparent; font-family: var(--font-space-grotesk), system-ui, sans-serif; color: #fff; }
        .gl-card { width: min(620px, 86vw); padding: 18px 22px; border-radius: 16px;
          background: linear-gradient(180deg, rgba(20,26,38,.94), rgba(10,12,17,.94));
          backdrop-filter: blur(6px); box-shadow: 0 10px 34px rgba(0,0,0,.55); }
        .gl-head { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
        .gl-label { font-size: 22px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; }
        .gl-count { font-size: 20px; font-weight: 700; font-variant-numeric: tabular-nums; color: ${ACCENT}; }
        .gl-sep { color: rgba(255,255,255,.4); }
        .gl-track { position: relative; height: 30px; border-radius: 999px; overflow: hidden;
          background: rgba(255,255,255,.08); box-shadow: inset 0 0 0 1px rgba(255,255,255,.06); }
        .gl-fill { position: relative; height: 100%; border-radius: 999px;
          background: linear-gradient(90deg, #1A6EFF, #7CC0FF);
          box-shadow: 0 0 18px rgba(74,158,255,.6); transition: width .8s cubic-bezier(.22,1,.36,1); }
        .gl-shine { position: absolute; inset: 0; border-radius: 999px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent);
          background-size: 220px 100%; animation: glShine 2.2s linear infinite; }
        .gl-pct { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          font-size: 15px; font-weight: 700; letter-spacing: .04em; text-shadow: 0 1px 4px rgba(0,0,0,.7); }
        @keyframes glShine { 0% { background-position: -220px 0; } 100% { background-position: 620px 0; } }
      `}</style>
    </div>
  );
}
