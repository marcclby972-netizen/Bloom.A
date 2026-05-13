'use client'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#fafaf9' }}>
        <div style={{ textAlign: 'center', maxWidth: 400, padding: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Erreur critique</h2>
          <p style={{ fontSize: 14, color: '#78716c', marginBottom: 16 }}>
            {error.message || 'Une erreur inattendue est survenue.'}
          </p>
          <button
            onClick={reset}
            style={{
              padding: '8px 16px', fontSize: 13, fontWeight: 500,
              border: '1px solid #d6d3d1', borderRadius: 8, cursor: 'pointer',
              backgroundColor: 'white',
            }}
          >
            Recharger
          </button>
        </div>
      </body>
    </html>
  )
}
