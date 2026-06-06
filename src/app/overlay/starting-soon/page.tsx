'use client';

import { useEffect, useState } from 'react';
import { OverlayShell, CountdownRing, useCountdown } from '@/components/overlay/overlay-kit';

/**
 * Overlay « Starting soon » — Browser Source OBS 1920×1080.
 *   https://absolution-guild.com/overlay/starting-soon
 *
 * Paramètres : ?name=Hallvor ?title=... ?min=10 (ou ?to=ISO)
 *   ?twitch= ?discord= ?guild=0 ?site=1 ?siteUrl=
 */
export default function StartingSoonOverlay() {
  const cd = useCountdown(10);
  const [meta, setMeta] = useState({ name: 'Hallvor', title: 'Le stream commence bientôt' });

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setMeta({
      name: p.get('name') || 'Hallvor',
      title: p.get('title') || 'Le stream commence bientôt',
    });
  }, []);

  return (
    <OverlayShell>
      <div className="ov-center">
        <div className="ov-eyebrow">
          <span className="ov-live-dot" />
          {cd.done ? 'En direct' : 'En direct dans'}
        </div>
        <CountdownRing
          done={cd.done}
          progress={cd.progress}
          time={cd.time}
          label="avant le live"
          doneText="ÇA COMMENCE !"
        />
        <h1 className="ov-name">{meta.name}</h1>
        <p className="ov-title">{meta.title}</p>
      </div>
    </OverlayShell>
  );
}
