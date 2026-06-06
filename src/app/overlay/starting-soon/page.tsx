'use client';

import { useEffect, useState } from 'react';

/**
 * Overlay « Starting soon » pour Twitch (stream perso de Hallvor).
 * À utiliser comme Browser Source OBS en 1920×1080 :
 *   https://absolution-guild.com/overlay/starting-soon
 *
 * Tout est configurable par paramètres d'URL (optionnels) :
 *   ?name=Hallvor               nom affiché
 *   ?title=...                  gros titre
 *   ?subtitle=...               sous-titre
 *   ?min=10                     minuteur : minutes depuis l'ouverture
 *   ?to=2026-06-06T20:00:00     OU compte à rebours vers une heure précise
 *   ?twitch=hallvor             handle affiché en bas
 *   ?discord=Absolution         handle affiché en bas
 *   ?guild=0                    masque la mention discrète « Absolution »
 */

type Config = {
  name: string;
  title: string;
  subtitle: string;
  twitch: string;
  discord: string;
  guild: boolean;
  site: boolean;
  siteUrl: string;
  totalMs: number;
  targetTs: number;
};

function readConfig(): Config {
  const p = new URLSearchParams(window.location.search);
  const now = Date.now();
  let targetTs: number;
  let totalMs: number;

  const to = p.get('to');
  if (to) {
    const t = new Date(to).getTime();
    targetTs = Number.isNaN(t) ? now + 10 * 60000 : t;
    totalMs = Math.max(targetTs - now, 1);
  } else {
    const min = Number(p.get('min'));
    const mins = Number.isFinite(min) && min > 0 ? min : 10;
    totalMs = mins * 60000;
    targetTs = now + totalMs;
  }

  return {
    name: p.get('name') || 'Hallvor',
    title: p.get('title') || 'Le stream commence bientôt',
    subtitle: p.get('subtitle') || '',
    twitch: p.get('twitch') || '',
    discord: p.get('discord') || '',
    guild: p.get('guild') !== '0',
    site: p.get('site') === '1', // lien du site masqué par défaut (activer avec ?site=1)
    siteUrl: p.get('siteUrl') || 'https://absolution-guild.com/',
    totalMs,
    targetTs,
  };
}

const ACCENT = '#4A9EFF';
const R = 168;
const CIRC = 2 * Math.PI * R;

export default function StartingSoonOverlay() {
  const [cfg, setCfg] = useState<Config | null>(null);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const c = readConfig();
    setCfg(c);
    const tick = () => setRemaining(Math.max(c.targetTs - Date.now(), 0));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, []);

  if (!cfg) return <div className="ov-root" />;

  const done = remaining <= 0;
  const totalSec = Math.ceil(remaining / 1000);
  const hh = Math.floor(totalSec / 3600);
  const mm = Math.floor((totalSec % 3600) / 60);
  const ss = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  const time = hh > 0 ? `${hh}:${pad(mm)}:${pad(ss)}` : `${pad(mm)}:${pad(ss)}`;

  const progress = cfg.totalMs > 0 ? 1 - remaining / cfg.totalMs : 1;
  const dashOffset = CIRC * Math.min(Math.max(progress, 0), 1);

  return (
    <div className="ov-root">
      {/* Décor de fond */}
      <div className="ov-glow ov-glow-1" />
      <div className="ov-glow ov-glow-2" />
      <div className="ov-grid" />
      <div className="ov-particles">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className={`ov-dot ov-dot-${i % 7}`} />
        ))}
      </div>

      {/* Contenu central */}
      <div className="ov-center">
        <div className="ov-eyebrow">
          <span className="ov-live-dot" />
          {done ? 'En direct' : 'En direct dans'}
        </div>

        {/* Anneau du compte à rebours */}
        <div className="ov-ring">
          <svg width="380" height="380" viewBox="0 0 380 380">
            <defs>
              <linearGradient id="ovGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7CC0FF" />
                <stop offset="100%" stopColor="#1A6EFF" />
              </linearGradient>
            </defs>
            <circle cx="190" cy="190" r={R} className="ov-ring-track" />
            <circle
              cx="190"
              cy="190"
              r={R}
              className="ov-ring-progress"
              stroke="url(#ovGrad)"
              strokeDasharray={CIRC}
              strokeDashoffset={done ? CIRC : dashOffset}
            />
          </svg>
          <div className="ov-ring-content">
            {done ? (
              <span className="ov-go">ÇA COMMENCE !</span>
            ) : (
              <>
                <span className="ov-time">{time}</span>
                <span className="ov-time-label">avant le live</span>
              </>
            )}
          </div>
        </div>

        <h1 className="ov-name">{cfg.name}</h1>
        <p className="ov-title">{cfg.title}</p>
        {cfg.subtitle && <p className="ov-subtitle">{cfg.subtitle}</p>}
      </div>

      {/* Bas : réseaux + mention discrète de la guilde */}
      <div className="ov-footer">
        <div className="ov-socials">
          {cfg.twitch && (
            <span className="ov-social">
              <b>Twitch</b> /{cfg.twitch}
            </span>
          )}
          {cfg.discord && (
            <span className="ov-social">
              <b>Discord</b> {cfg.discord}
            </span>
          )}
        </div>
        {cfg.guild && (
          <div className="ov-brand">
            <span className="ov-brand-name">
              Abso<span style={{ color: ACCENT }}>lution</span>
            </span>
            {cfg.site && (
              <span className="ov-join">
                Rejoins-nous : <span className="ov-join-url">{cfg.siteUrl}</span>
              </span>
            )}
          </div>
        )}
      </div>

      <style>{`
        .ov-root {
          position: fixed; inset: 0; overflow: hidden;
          background:
            radial-gradient(1200px 800px at 50% 30%, #141a26 0%, #0a0c11 60%, #07090d 100%);
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          color: #fff;
        }
        .ov-glow { position: absolute; border-radius: 50%; filter: blur(90px); opacity: .55; }
        .ov-glow-1 { width: 720px; height: 720px; left: 50%; top: 38%;
          transform: translate(-50%,-50%);
          background: radial-gradient(circle, rgba(74,158,255,.45), transparent 70%);
          animation: ovPulse 6s ease-in-out infinite; }
        .ov-glow-2 { width: 520px; height: 520px; right: -120px; bottom: -120px;
          background: radial-gradient(circle, rgba(26,110,255,.30), transparent 70%);
          animation: ovPulseB 8s ease-in-out infinite; }
        .ov-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: radial-gradient(circle at 50% 40%, #000 30%, transparent 80%);
          -webkit-mask-image: radial-gradient(circle at 50% 40%, #000 30%, transparent 80%);
        }
        .ov-particles { position: absolute; inset: 0; }
        .ov-dot { position: absolute; width: 5px; height: 5px; border-radius: 50%;
          background: ${ACCENT}; box-shadow: 0 0 10px ${ACCENT};
          opacity: .5; animation: ovFloat 9s ease-in-out infinite; }
        .ov-dot-0 { left: 12%; top: 28%; animation-delay: 0s; }
        .ov-dot-1 { left: 84%; top: 22%; animation-delay: 1.2s; }
        .ov-dot-2 { left: 22%; top: 72%; animation-delay: 2.1s; }
        .ov-dot-3 { left: 70%; top: 78%; animation-delay: .6s; }
        .ov-dot-4 { left: 8%; top: 54%; animation-delay: 3s; }
        .ov-dot-5 { left: 92%; top: 60%; animation-delay: 1.8s; }
        .ov-dot-6 { left: 50%; top: 12%; animation-delay: 2.6s; }

        .ov-center { position: absolute; inset: 0; display: flex; flex-direction: column;
          align-items: center; justify-content: center; text-align: center; gap: 4px; }

        .ov-eyebrow { display: inline-flex; align-items: center; gap: 12px;
          text-transform: uppercase; letter-spacing: .42em; font-weight: 600;
          font-size: 20px; color: ${ACCENT}; margin-bottom: 30px; padding-left: .42em; }
        .ov-live-dot { width: 12px; height: 12px; border-radius: 50%; background: ${ACCENT};
          box-shadow: 0 0 0 0 rgba(74,158,255,.7); animation: ovBlink 1.6s ease-out infinite; }

        .ov-ring { position: relative; width: 380px; height: 380px; }
        .ov-ring svg { transform: rotate(-90deg); }
        .ov-ring-track { fill: none; stroke: rgba(255,255,255,.08); stroke-width: 10; }
        .ov-ring-progress { fill: none; stroke-width: 12; stroke-linecap: round;
          transition: stroke-dashoffset .3s linear;
          filter: drop-shadow(0 0 10px rgba(74,158,255,.55)); }
        .ov-ring-content { position: absolute; inset: 0; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 6px; }
        .ov-time { font-size: 92px; font-weight: 700; line-height: 1;
          font-variant-numeric: tabular-nums; letter-spacing: .02em;
          text-shadow: 0 0 30px rgba(74,158,255,.35); }
        .ov-time-label { text-transform: uppercase; letter-spacing: .3em; font-size: 15px;
          color: rgba(255,255,255,.55); }
        .ov-go { font-size: 46px; font-weight: 700; color: ${ACCENT};
          text-shadow: 0 0 30px rgba(74,158,255,.6); animation: ovPulseText 1.2s ease-in-out infinite; }

        .ov-name { margin: 34px 0 0; font-size: 84px; font-weight: 700; line-height: 1;
          text-transform: uppercase; letter-spacing: .04em;
          text-shadow: 0 4px 40px rgba(74,158,255,.25); }
        .ov-title { margin: 16px 0 0; font-size: 30px; font-weight: 500; color: rgba(255,255,255,.92); }
        .ov-subtitle { margin: 8px 0 0; font-size: 21px; color: rgba(255,255,255,.55);
          font-family: var(--font-inter), system-ui, sans-serif; }

        .ov-footer { position: absolute; left: 0; right: 0; bottom: 56px;
          display: flex; flex-direction: column; align-items: center; gap: 18px; }
        .ov-socials { display: flex; gap: 40px; }
        .ov-social { font-size: 22px; color: rgba(255,255,255,.8); letter-spacing: .02em; }
        .ov-social b { color: ${ACCENT}; font-weight: 700; margin-right: 6px; }
        .ov-brand { display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; }
        .ov-brand-name { font-family: var(--font-space-grotesk), sans-serif; font-weight: 700;
          font-size: 32px; letter-spacing: .22em; text-transform: uppercase; color: rgba(255,255,255,.88);
          text-shadow: 0 0 26px rgba(74,158,255,.28); }
        .ov-join { font-family: var(--font-inter), system-ui, sans-serif; font-size: 19px;
          letter-spacing: .03em; color: rgba(255,255,255,.6); }
        .ov-join-url { color: ${ACCENT}; font-weight: 600; }

        @keyframes ovPulse { 0%,100% { opacity: .4; transform: translate(-50%,-50%) scale(1); }
          50% { opacity: .65; transform: translate(-50%,-50%) scale(1.08); } }
        @keyframes ovPulseB { 0%,100% { opacity: .3; transform: scale(1); }
          50% { opacity: .55; transform: scale(1.1); } }
        @keyframes ovFloat { 0%,100% { transform: translateY(0); opacity: .4; }
          50% { transform: translateY(-26px); opacity: .9; } }
        @keyframes ovBlink { 0% { box-shadow: 0 0 0 0 rgba(74,158,255,.7); }
          70% { box-shadow: 0 0 0 14px rgba(74,158,255,0); } 100% { box-shadow: 0 0 0 0 rgba(74,158,255,0); } }
        @keyframes ovPulseText { 0%,100% { opacity: 1; transform: scale(1); }
          50% { opacity: .75; transform: scale(1.03); } }
      `}</style>
    </div>
  );
}
