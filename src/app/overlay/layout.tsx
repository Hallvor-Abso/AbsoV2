import type { Metadata } from 'next';

// Pages d'overlay : plein écran, sans navbar/footer, et non indexées.
export const metadata: Metadata = {
  title: 'Overlay',
  robots: { index: false, follow: false },
};

export default function OverlayLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Fond 100 % transparent pour OBS : neutralise le fond global du site
          (couleur + halos en dégradé), sinon la source dessine un rectangle
          sombre aux angles carrés autour des overlays. */}
      <style>{`html, body { background: transparent !important; background-image: none !important; }`}</style>
      {children}
    </>
  );
}
