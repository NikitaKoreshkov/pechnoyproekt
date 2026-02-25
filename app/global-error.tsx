'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="ru">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#FAF7F2', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ maxWidth: 400, textAlign: 'center' }}>
          <h1 style={{ fontSize: 20, color: '#2C1810', marginBottom: 8 }}>Ошибка загрузки</h1>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>
            Проверьте, что PostgreSQL запущен и в .env указан верный DATABASE_URL. Затем нажмите «Попробовать снова».
          </p>
          <button
            onClick={reset}
            style={{
              padding: '12px 24px',
              background: '#2C1810',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Попробовать снова
          </button>
        </div>
      </body>
    </html>
  )
}
