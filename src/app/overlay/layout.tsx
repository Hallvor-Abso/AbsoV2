import type { Metadata } from 'next';

// Pages d'overlay : plein écran, sans navbar/footer, et non indexées.
export const metadata: Metadata = {
  title: 'Overlay',
  robots: { index: false, follow: false },
};

export default function OverlayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
