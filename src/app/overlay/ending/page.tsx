'use client';

import { useEffect, useState } from 'react';
import { OverlayShell } from '@/components/overlay/overlay-kit';

/**
 * Overlay « Stream ending » (fin de stream) — Browser Source OBS 1920×1080.
 *   https://absolution-guild.com/overlay/ending
 *
 * Paramètres : ?title=... ?subtitle=...
 *   ?twitch= ?discord= ?guild=0 ?site=1 ?siteUrl=
 */
export default function EndingOverlay() {
  const [meta, setMeta] = useState({
    title: 'Merci !',
    subtitle: "Merci d'avoir suivi le stream — à très vite 👋",
  });

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setMeta({
      title: p.get('title') || 'Merci !',
      subtitle: p.get('subtitle') || "Merci d'avoir suivi le stream — à très vite 👋",
    });
  }, []);

  return (
    <OverlayShell>
      <div className="ov-center">
        <div className="ov-eyebrow">
          <span className="ov-live-dot" />
          Fin du stream
        </div>
        <h1 className="ov-name">{meta.title}</h1>
        <p className="ov-title">{meta.subtitle}</p>
      </div>
    </OverlayShell>
  );
}
