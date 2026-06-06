'use client';

import { useEffect, useRef, useState } from 'react';
import { useOverlayConfig, useSiteLogo } from '@/components/overlay/overlay-kit';

/**
 * Overlay d'alertes (follow / sub / resub / gift / raid) — Browser Source OBS,
 * fond transparent. Interroge la file `/api/overlay/alerts` et affiche les
 * nouvelles alertes l'une après l'autre, avec animation et son optionnel.
 *   https://absolution-guild.com/overlay/alert
 *
 * Paramètres : ?duration=6 (secondes)  ?sound=1
 *   Messages : ?followMsg= ?subMsg= ?resubMsg= ?giftMsg= ?raidMsg=
 *   ({user}, {amount} sont remplacés ; {amount} = mois/abos offerts/viewers)
 */

type AlertType = 'FOLLOW' | 'SUB' | 'RESUB' | 'SUBGIFT' | 'RAID' | 'TEST';
type Alert = { id: number; type: AlertType; username: string; message: string; amount: number; tier: string };

const STYLE: Record<AlertType, { icon: string; accent: string; def: string }> = {
  FOLLOW: { icon: '❤', accent: '#4A9EFF', def: 'vient de suivre la chaîne !' },
  SUB: { icon: '★', accent: '#C792FF', def: 's’abonne à la chaîne !' },
  RESUB: { icon: '★', accent: '#C792FF', def: '{amount} mois d’abonnement !' },
  SUBGIFT: { icon: '🎁', accent: '#FF8AD8', def: 'offre {amount} abonnement(s) !' },
  RAID: { icon: '⚔', accent: '#FFB454', def: 'débarque avec {amount} viewers !' },
  TEST: { icon: '✨', accent: '#4A9EFF', def: 'ceci est une alerte de test' },
};

const MSG_KEY: Partial<Record<AlertType, string>> = {
  FOLLOW: 'followMsg',
  SUB: 'subMsg',
  RESUB: 'resubMsg',
  SUBGIFT: 'giftMsg',
  RAID: 'raidMsg',
};

function fill(tpl: string, a: Alert): string {
  return tpl.replace(/\{user\}/g, a.username || 'Quelqu’un').replace(/\{amount\}/g, String(a.amount));
}

function playChime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(660, ctx.currentTime);
    o.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.55);
    o.start();
    o.stop(ctx.currentTime + 0.55);
  } catch {
    /* audio indisponible : on ignore */
  }
}

export default function AlertOverlay() {
  const { ready, get } = useOverlayConfig('alert');
  const siteLogo = useSiteLogo();
  const cursorRef = useRef(0);
  const [queue, setQueue] = useState<Alert[]>([]);
  const [current, setCurrent] = useState<Alert | null>(null);
  const [cfg, setCfg] = useState<{ durationMs: number; sound: boolean } | null>(null);

  // Configuration (durée + son).
  useEffect(() => {
    if (!ready) return;
    const d = Number(get('duration'));
    setCfg({ durationMs: (Number.isFinite(d) && d > 0 ? d : 6) * 1000, sound: get('sound') === '1' });
  }, [ready, get]);

  // Initialisation du curseur (on ne rejoue pas l'historique) + polling.
  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const r = await fetch('/api/overlay/alerts');
        const j = await r.json();
        cursorRef.current = j.lastId ?? 0;
      } catch {
        /* ignore */
      }
    };
    const poll = async () => {
      try {
        const r = await fetch(`/api/overlay/alerts?after=${cursorRef.current}`);
        const j = await r.json();
        if (active && Array.isArray(j.alerts) && j.alerts.length) {
          cursorRef.current = j.lastId;
          setQueue((q) => [...q, ...j.alerts]);
        }
      } catch {
        /* ignore */
      }
    };
    init();
    const iv = setInterval(poll, 1500);
    return () => {
      active = false;
      clearInterval(iv);
    };
  }, []);

  // Lecteur : affiche une alerte à la fois.
  useEffect(() => {
    if (!cfg || current || queue.length === 0) return;
    const [next, ...rest] = queue;
    setQueue(rest);
    setCurrent(next);
    if (cfg.sound) playChime();
    const t = setTimeout(() => setCurrent(null), cfg.durationMs);
    return () => clearTimeout(t);
  }, [cfg, current, queue]);

  if (!current) return <div className="al-root" />;

  const s = STYLE[current.type];
  const tplKey = MSG_KEY[current.type];
  const subtitleTpl = (tplKey && get(tplKey)) || s.def;

  return (
    <div className="al-root">
      <div
        key={current.id}
        className="al-card"
        style={{ '--ac': s.accent, '--hold': `${Math.max((cfg?.durationMs ?? 6000) - 500, 0) / 1000}s` } as React.CSSProperties}
      >
        <div className="al-icon">{s.icon}</div>
        {siteLogo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="al-logo" src={siteLogo} alt="" />
        )}
        <div className="al-user">{current.username || 'Quelqu’un'}</div>
        <div className="al-sub">{fill(subtitleTpl, current)}</div>
        {current.type === 'RESUB' && current.message && <div className="al-msg">« {current.message} »</div>}
      </div>

      <style>{`
        .al-root { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
          background: transparent; font-family: var(--font-space-grotesk), system-ui, sans-serif; color: #fff;
          pointer-events: none; }
        .al-card { position: relative; min-width: 460px; max-width: 80vw; padding: 30px 48px 26px; text-align: center;
          border-radius: 20px; border: 1px solid color-mix(in srgb, var(--ac) 55%, transparent);
          background: linear-gradient(180deg, rgba(16,20,30,.96), rgba(9,11,16,.97));
          box-shadow: 0 20px 60px rgba(0,0,0,.6), 0 0 60px color-mix(in srgb, var(--ac) 35%, transparent);
          animation: alIn .55s cubic-bezier(.2,1.1,.3,1) both, alOut .5s ease-in forwards;
          animation-delay: 0s, var(--hold, 5.2s); }
        .al-icon { font-size: 52px; line-height: 1; margin-bottom: 6px;
          filter: drop-shadow(0 0 18px var(--ac)); animation: alPop .6s ease both; }
        .al-logo { height: 40px; width: auto; max-width: 200px; object-fit: contain; margin: 2px auto 8px; display: block;
          opacity: .9; filter: drop-shadow(0 0 12px rgba(74,158,255,.4)); }
        .al-user { font-size: 40px; font-weight: 800; letter-spacing: .01em; line-height: 1.05;
          color: var(--ac); text-shadow: 0 0 26px color-mix(in srgb, var(--ac) 50%, transparent); }
        .al-sub { margin-top: 8px; font-size: 23px; font-weight: 500; color: rgba(255,255,255,.92); }
        .al-msg { margin-top: 12px; font-family: var(--font-inter), system-ui, sans-serif; font-size: 17px;
          color: rgba(255,255,255,.6); font-style: italic; }

        @keyframes alIn { from { opacity: 0; transform: translateY(26px) scale(.9); } to { opacity: 1; transform: none; } }
        @keyframes alOut { to { opacity: 0; transform: translateY(-18px) scale(.96); } }
        @keyframes alPop { 0% { transform: scale(0); } 60% { transform: scale(1.25); } 100% { transform: scale(1); } }
      `}</style>
    </div>
  );
}
