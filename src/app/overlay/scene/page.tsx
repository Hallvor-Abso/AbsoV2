'use client';

import { useEffect, useState } from 'react';
import { useOverlayConfig, useSiteLogo } from '@/components/overlay/overlay-kit';

/**
 * Habillage de scène — Browser Source OBS 1920×1080, fond TRANSPARENT.
 * Style « esport » : une barre basse pleine largeur, logo/guilde à gauche,
 * réseaux (Twitch / Discord) à droite.
 *   https://absolution-guild.com/overlay/scene
 *
 * Paramètres : ?guild=0 (masque la guilde)  ?site=1 ?siteUrl=
 *   ?twitch=  ?discord=
 */

const ACCENT = '#4A9EFF';

type Cfg = { guild: boolean; site: boolean; siteUrl: string; twitch: string; discord: string };

function readConfig(get: (k: string) => string | null): Cfg {
  return {
    guild: get('guild') !== '0',
    site: get('site') === '1',
    siteUrl: get('siteUrl') || 'absolution-guild.com',
    twitch: get('twitch') || '',
    discord: get('discord') || '',
  };
}

export default function SceneOverlay() {
  const { ready, get } = useOverlayConfig('scene');
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const siteLogo = useSiteLogo();
  useEffect(() => {
    if (ready) setCfg(readConfig(get));
  }, [ready, get]);
  if (!cfg) return <div className="sc-root" />;

  const hasSocials = Boolean(cfg.twitch || cfg.discord);

  return (
    <div className="sc-root">
      <div className="sc-bar">
        {/* Gauche : logo / guilde */}
        {cfg.guild && (
          <div className="sc-left">
            {siteLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="sc-logo" src={siteLogo} alt="Absolution" />
            ) : (
              <span className="sc-brand">
                Abso<span style={{ color: ACCENT }}>lution</span>
              </span>
            )}
            {cfg.site && <span className="sc-site">{cfg.siteUrl}</span>}
          </div>
        )}

        {/* Droite : réseaux */}
        {hasSocials && (
          <div className="sc-right">
            {cfg.twitch && (
              <span className="sc-chip">
                <svg viewBox="0 0 24 24" width="20" height="20" fill={ACCENT} aria-hidden>
                  <path d="M4 2 3 6v13h4v3h3l3-3h4l5-5V2H4zm16 11-3 3h-4l-3 3v-3H7V4h13v9z" />
                  <path d="M16 7h-2v5h2V7zm-5 0H9v5h2V7z" fill="#fff" />
                </svg>
                <span><b>Twitch</b> /{cfg.twitch}</span>
              </span>
            )}
            {cfg.discord && (
              <span className="sc-chip">
                <svg viewBox="0 0 24 24" width="20" height="20" fill={ACCENT} aria-hidden>
                  <path d="M20 4.5A18 18 0 0 0 15.5 3l-.3.5a13 13 0 0 1 3.9 1.9 12.5 12.5 0 0 0-10.3 0A13 13 0 0 1 12.7 3.5L12.5 3A18 18 0 0 0 8 4.5C5.2 8.6 4.4 12.6 4.8 16.5a18 18 0 0 0 5.5 2.8l.7-1.2c-.6-.2-1.2-.5-1.7-.9l.4-.3a9 9 0 0 0 8.6 0l.4.3c-.5.4-1.1.7-1.7.9l.7 1.2a18 18 0 0 0 5.5-2.8c.5-4.5-.8-8.5-3.5-12zM9.7 14.3c-.9 0-1.6-.8-1.6-1.8s.7-1.8 1.6-1.8 1.6.8 1.6 1.8-.7 1.8-1.6 1.8zm4.6 0c-.9 0-1.6-.8-1.6-1.8s.7-1.8 1.6-1.8 1.6.8 1.6 1.8-.7 1.8-1.6 1.8z" />
                </svg>
                <span><b>Discord</b> {cfg.discord}</span>
              </span>
            )}
          </div>
        )}
      </div>

      <style>{`
        .sc-root { position: fixed; inset: 0; overflow: hidden; background: transparent;
          pointer-events: none; font-family: var(--font-space-grotesk), system-ui, sans-serif; color: #fff; }

        /* Barre basse pleine largeur */
        .sc-bar { position: absolute; left: 0; right: 0; bottom: 0; height: 78px;
          display: flex; align-items: stretch; justify-content: space-between;
          background: linear-gradient(180deg, rgba(10,13,19,.45), rgba(8,10,15,.95));
          border-top: 2px solid rgba(74,158,255,.7);
          box-shadow: 0 -12px 44px rgba(0,0,0,.5), 0 -1px 0 rgba(74,158,255,.45);
          animation: scGlow 4.5s ease-in-out infinite; }

        /* Bloc gauche avec liseré accent (look esport) */
        .sc-left { position: relative; display: flex; align-items: center; gap: 18px; padding: 0 34px 0 30px; }
        .sc-left::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 6px;
          background: ${ACCENT}; box-shadow: 0 0 16px ${ACCENT}; }
        .sc-logo { height: 46px; width: auto; max-width: 260px; object-fit: contain; display: block;
          filter: drop-shadow(0 0 12px rgba(74,158,255,.4)); }
        .sc-brand { font-size: 27px; font-weight: 700; text-transform: uppercase; letter-spacing: .2em; color: #fff;
          text-shadow: 0 0 22px rgba(74,158,255,.3); }
        .sc-site { font-family: var(--font-inter), system-ui, sans-serif; font-size: 14px;
          letter-spacing: .03em; color: rgba(255,255,255,.55); }

        /* Bloc droit : chips réseaux */
        .sc-right { display: flex; align-items: center; gap: 14px; padding: 0 30px; }
        .sc-chip { display: inline-flex; align-items: center; gap: 10px; padding: 9px 16px; border-radius: 10px;
          font-size: 18px; font-weight: 600; color: rgba(255,255,255,.95);
          background: rgba(74,158,255,.10); border: 1px solid rgba(74,158,255,.35); }
        .sc-chip b { color: ${ACCENT}; font-weight: 700; margin-right: 2px; }
        .sc-chip svg { flex: 0 0 auto; }

        @keyframes scGlow { 0%,100% { box-shadow: 0 -12px 44px rgba(0,0,0,.5), 0 -1px 0 rgba(74,158,255,.35); }
          50% { box-shadow: 0 -12px 52px rgba(0,0,0,.55), 0 -1px 0 rgba(74,158,255,.7); } }
      `}</style>
    </div>
  );
}
