'use client';

/**
 * Filet de sécurité ultime : ne se déclenche que si la mise en page racine
 * elle-même plante. Doit fournir ses propres <html>/<body>.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="fr">
      <body style={{ background: '#0C0E13', color: '#E6E8EE', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Une erreur est survenue</h1>
          <p style={{ marginTop: 8, color: '#8A8F9C' }}>Réessaie dans un instant.</p>
          <button
            onClick={reset}
            style={{ marginTop: 24, padding: '10px 20px', borderRadius: 8, background: '#4A9EFF', color: '#06080C', fontWeight: 600, border: 0, cursor: 'pointer' }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
