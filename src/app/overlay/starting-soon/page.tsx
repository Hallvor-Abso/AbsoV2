'use client';

import { useEffect, useState } from 'react';
import { OverlayShell, CountdownRing, useCountdown, useOverlayConfig } from '@/components/overlay/overlay-kit';

/**
 * Overlay « Starting soon » — Browser Source OBS 1920×1080.
 *   https://absolution-guild.com/overlay/starting-soon
 *
 * Paramètres : ?name=Hallvor ?title=... ?min=10 (ou ?to=ISO)
 *   ?twitch= ?discord= ?guild=0 ?site=1 ?siteUrl=
 */
export default function StartingSoonOverlay() {
  const { ready, get } = useOverlayConfig('starting-soon');
  const min = Number(get('min'));
  const cd = useCountdown(Number.isFinite(min) && min > 0 ? min : 10);
  // Compte à rebours affiché par défaut ; masqué avec ?timer=0 (ou via le hub).
  const showTimer = get('timer') !== '0';
  const [meta, setMeta] = useState({ name: 'Hallvor', title: 'Le stream commence bientôt' });

  useEffect(() => {
    if (!ready) return;
    setMeta({
      name: get('name') || 'Hallvor',
      title: get('title') || 'Le stream commence bientôt',
    });
  }, [ready, get]);

  return (
    <OverlayShell>
      <div className="ov-center">
        <div className="ov-eyebrow">
          <span className="ov-live-dot" />
          {showTimer ? (cd.done ? 'En direct' : 'En direct dans') : 'Bientôt en direct'}
        </div>
        {showTimer && (
          <CountdownRing
            done={cd.done}
            progress={cd.progress}
            time={cd.time}
            label="avant le live"
            doneText="ÇA COMMENCE !"
          />
        )}
        <h1 className="ov-name">{meta.name}</h1>
        <p className="ov-title">{meta.title}</p>
      </div>
    </OverlayShell>
  );
}
