'use client';

import { useEffect, useState } from 'react';
import { OverlayShell, CountdownRing, useCountdown } from '@/components/overlay/overlay-kit';

/**
 * Overlay « Be right back » (pause) — Browser Source OBS 1920×1080.
 *   https://absolution-guild.com/overlay/brb
 *
 * Paramètres : ?title=Pause ?subtitle=... ?min=5 (ou ?to=ISO)
 *   ?twitch= ?discord= ?guild=0 ?site=1 ?siteUrl=
 */
export default function BeRightBackOverlay() {
  const cd = useCountdown(5);
  const [meta, setMeta] = useState({ title: 'Pause', subtitle: 'Je reviens dans un instant' });

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setMeta({
      title: p.get('title') || 'Pause',
      subtitle: p.get('subtitle') || 'Je reviens dans un instant',
    });
  }, []);

  return (
    <OverlayShell>
      <div className="ov-center">
        <div className="ov-eyebrow">
          <span className="ov-live-dot" />
          {cd.done ? 'De retour' : 'De retour dans'}
        </div>
        <CountdownRing
          done={cd.done}
          progress={cd.progress}
          time={cd.time}
          label="avant le retour"
          doneText="JE REVIENS !"
        />
        <h1 className="ov-name">{meta.title}</h1>
        <p className="ov-title">{meta.subtitle}</p>
      </div>
    </OverlayShell>
  );
}
