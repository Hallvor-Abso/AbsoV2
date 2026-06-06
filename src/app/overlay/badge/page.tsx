'use client';

import { useEffect, useState } from 'react';
import { useOverlayConfig, useSiteLogo } from '@/components/overlay/overlay-kit';

/**
 * Badge « Absolution » autonome et déplaçable — Browser Source OBS séparée
 * (fond transparent), à placer où tu veux sur le stream.
 *
 *   « Absolution » seul :        https://absolution-guild.com/overlay/badge
 *   « Absolution » + site :      https://absolution-guild.com/overlay/badge?site=1
 *
 * Autres paramètres : ?siteUrl=absolution-guild.com  ?bare=1 (sans cadre/fond)
 */

const ACCENT = '#4A9EFF';

type Cfg = { site: boolean; siteUrl: string; bare: boolean };

function readConfig(get: (k: string) => string | null): Cfg {
  return {
    site: get('site') === '1',
    siteUrl: get('siteUrl') || 'absolution-guild.com',
    bare: get('bare') === '1',
  };
}

export default function BadgeOverlay() {
  const { ready, get } = useOverlayConfig('badge');
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const siteLogo = useSiteLogo();
  useEffect(() => {
    if (ready) setCfg(readConfig(get));
  }, [ready, get]);
  if (!cfg) return <div className="bd-root" />;

  return (
    <div className="bd-root">
      <div className={`bd-card ${cfg.bare ? 'bd-bare' : ''}`}>
        {siteLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="bd-logo" src={siteLogo} alt="Absolution" />
        ) : (
          <span className="bd-name">
            Abso<span style={{ color: ACCENT }}>lution</span>
          </span>
        )}
        {cfg.site && <span className="bd-site">{cfg.siteUrl}</span>}
      </div>

      <style>{`
        .bd-root { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
          background: transparent; font-family: var(--font-space-grotesk), system-ui, sans-serif; color: #fff; }
        .bd-card { display: inline-flex; flex-direction: column; align-items: center; gap: 4px;
          padding: 14px 26px; border-radius: 14px;
          background: linear-gradient(180deg, rgba(20,26,38,.94), rgba(10,12,17,.94));
          backdrop-filter: blur(6px); box-shadow: 0 8px 30px rgba(0,0,0,.5); }
        .bd-bare { background: none; backdrop-filter: none; box-shadow: none; padding: 0; }
        .bd-name { font-size: 30px; font-weight: 700; text-transform: uppercase; letter-spacing: .22em;
          color: rgba(255,255,255,.92); }
        .bd-logo { height: 46px; width: auto; max-width: 280px; object-fit: contain; display: block;
          filter: drop-shadow(0 0 14px rgba(74,158,255,.35)); }
        .bd-bare .bd-logo { filter: drop-shadow(0 2px 8px rgba(0,0,0,.9)) drop-shadow(0 0 16px rgba(0,0,0,.6)); }
        .bd-bare .bd-name { text-shadow: 0 2px 8px rgba(0,0,0,.9), 0 0 18px rgba(0,0,0,.7); }
        .bd-bare .bd-site { text-shadow: 0 2px 6px rgba(0,0,0,.9); }
        .bd-site { font-family: var(--font-inter), system-ui, sans-serif; font-size: 15px;
          letter-spacing: .04em; color: ${ACCENT}; font-weight: 600; }
      `}</style>
    </div>
  );
}
