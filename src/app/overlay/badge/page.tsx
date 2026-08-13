'use client';

import { useEffect, useMemo, useState } from 'react';
import { ACCENT, useOverlayConfig, useOverlayData, useSiteLogo } from '@/components/overlay/overlay-kit';

/**
 * Badge « Absolution » — Browser Source OBS séparée (fond transparent),
 * à placer où tu veux sur le stream. Pilule horizontale : logo à gauche,
 * infos à droite qui alternent en douceur (site, Discord, prochain raid,
 * dernier boss tombé). REMPLIT sa source : dimensionne la source pour choisir
 * la taille du badge (conseillé : 520×80).
 *
 *   https://absolution-guild.com/overlay/badge
 *
 * Paramètres :
 *   ?site=1&siteUrl=absolution-guild.com   (afficher le site)
 *   ?discord=discord.gg/abso               (afficher l'invitation Discord)
 *   ?auto=0        (désactive les infos auto : prochain raid, dernier boss)
 *   ?interval=8    (durée d'affichage de chaque info, en secondes)
 *   ?bare=1        (sans cadre/fond)
 */

type Cfg = { site: boolean; siteUrl: string; discord: string; auto: boolean; interval: number; bare: boolean };

function readConfig(get: (k: string) => string | null): Cfg {
  const interval = Number(get('interval'));
  return {
    site: get('site') === '1',
    siteUrl: get('siteUrl') || 'absolution-guild.com',
    discord: (get('discord') || '').trim(),
    auto: get('auto') !== '0',
    interval: Number.isFinite(interval) && interval > 0 ? interval : 8,
    bare: get('bare') === '1',
  };
}

/** « jeu. 21:00 » pour un event de la semaine, sinon « 24 août · 21:00 ». */
function formatEventDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const inWeek = d.getTime() - Date.now() < 7 * 24 * 3600 * 1000;
  const fmt = new Intl.DateTimeFormat('fr-FR', inWeek
    ? { weekday: 'short', hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  return fmt.format(d).replace(':', 'h');
}

type Info = { label: string; value: string };

function buildInfos(cfg: Cfg, data: ReturnType<typeof useOverlayData>): Info[] {
  const infos: Info[] = [];
  if (cfg.site) infos.push({ label: 'Site', value: cfg.siteUrl });
  if (cfg.discord) infos.push({ label: 'Discord', value: cfg.discord });
  if (cfg.auto && data) {
    if (data.nextEvent) {
      const when = formatEventDate(data.nextEvent.startDate);
      infos.push({ label: 'Prochain raid', value: `${data.nextEvent.title}${when ? ` · ${when}` : ''}` });
    }
    if (data.recentKills[0]) {
      infos.push({ label: 'Boss down', value: data.recentKills[0].name });
    }
  }
  return infos;
}

export default function BadgeOverlay() {
  const { ready, get } = useOverlayConfig('badge');
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [idx, setIdx] = useState(0);
  const siteLogo = useSiteLogo();
  const data = useOverlayData();

  useEffect(() => {
    if (ready) setCfg(readConfig(get));
  }, [ready, get]);

  const infos = useMemo(() => (cfg ? buildInfos(cfg, data) : []), [cfg, data]);

  // Rotation des infos (uniquement s'il y en a plusieurs).
  useEffect(() => {
    if (!cfg || infos.length < 2) return;
    const id = setInterval(() => setIdx((i) => i + 1), cfg.interval * 1000);
    return () => clearInterval(id);
  }, [cfg, infos.length]);

  if (!cfg) return <div className="bd-root" />;

  const info = infos.length ? infos[idx % infos.length] : null;

  return (
    <div className="bd-root">
      <div className={`bd-card ${cfg.bare ? 'bd-bare' : ''} ${info ? '' : 'bd-solo'}`}>
        <div className="bd-brand">
          {siteLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="bd-logo" src={siteLogo} alt="Absolution" />
          ) : (
            <span className="bd-name">
              Abso<span style={{ color: ACCENT }}>lution</span>
            </span>
          )}
        </div>

        {info && (
          <>
            <div className="bd-sep" />
            {/* key = index → l'animation d'entrée rejoue à chaque rotation */}
            <div className="bd-info" key={idx % infos.length}>
              <span className="bd-label">{info.label}</span>
              <span className="bd-value">{info.value}</span>
            </div>
          </>
        )}
      </div>

      <style>{`
        /* Le badge REMPLIT sa source OBS : toutes les tailles sont relatives à
           la hauteur de la source (vh) → dimensionne la source, tout suit.
           Taille conseillée : 520×80 (élargis-la si tes titres sont longs). */
        .bd-root { position: fixed; inset: 0; display: flex; align-items: stretch; justify-content: stretch;
          background: transparent; font-family: var(--font-space-grotesk), system-ui, sans-serif; color: #fff; }
        .bd-card { position: relative; flex: 1; display: flex; align-items: center; gap: 4.5vh;
          margin: 4px; padding: 0 8vh 0 5vh; border-radius: 999px; overflow: hidden;
          border: 1px solid rgba(255,255,255,.08);
          background: linear-gradient(135deg, rgba(20,26,38,.95), rgba(10,12,17,.95));
          backdrop-filter: blur(6px); box-shadow: 0 8px 30px rgba(0,0,0,.5); }
        /* fine ligne d'accent en bas de la pilule */
        .bd-card::after { content: ''; position: absolute; left: 12%; right: 12%; bottom: 0; height: 2px;
          background: linear-gradient(90deg, transparent, ${ACCENT}, transparent); opacity: .8; }
        .bd-bare { background: none; border: none; backdrop-filter: none; box-shadow: none; }
        .bd-bare::after { display: none; }
        .bd-solo { justify-content: center; }

        .bd-brand { display: flex; align-items: center; flex: none; }
        .bd-logo { height: 62vh; width: auto; max-width: 40vw; object-fit: contain; display: block;
          filter: drop-shadow(0 0 12px rgba(74,158,255,.35)); }
        .bd-name { font-size: 34vh; font-weight: 700; text-transform: uppercase; letter-spacing: .2em;
          color: rgba(255,255,255,.92); white-space: nowrap; }

        .bd-sep { width: 1px; height: 52vh; flex: none;
          background: linear-gradient(180deg, transparent, rgba(255,255,255,.25), transparent); }

        /* La zone d'infos prend TOUTE la place restante ; le texte ne peut se
           couper (…) que si la source est vraiment trop étroite. */
        .bd-info { display: flex; flex-direction: column; justify-content: center; gap: 2vh;
          flex: 1; min-width: 0; animation: bdIn .45s cubic-bezier(.2,.9,.3,1) both; }
        .bd-label { font-size: 15vh; font-weight: 700; text-transform: uppercase; letter-spacing: .18em;
          color: ${ACCENT}; white-space: nowrap; line-height: 1; }
        .bd-value { font-family: var(--font-inter), system-ui, sans-serif; font-size: 25vh; font-weight: 600;
          color: rgba(255,255,255,.92); white-space: nowrap; line-height: 1.15;
          overflow: hidden; text-overflow: ellipsis; }

        .bd-bare .bd-logo { filter: drop-shadow(0 2px 8px rgba(0,0,0,.9)) drop-shadow(0 0 16px rgba(0,0,0,.6)); }
        .bd-bare .bd-name { text-shadow: 0 2px 8px rgba(0,0,0,.9), 0 0 18px rgba(0,0,0,.7); }
        .bd-bare .bd-label, .bd-bare .bd-value { text-shadow: 0 2px 6px rgba(0,0,0,.9); }

        @keyframes bdIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}
