'use client'

/**
 * Тонкие искры-акценты для премиального тёмного интерфейса (champagne/золото).
 */
export default function SparksEffect() {
  const sparks = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: `${8 + (i * 7.5) % 84}%`,
    delay: `${(i * 1.2) % 6}s`,
    duration: `${10 + (i % 4) * 3}s`,
    size: 3 + (i % 3),
    opacity: 0.25 + (i % 3) * 0.08,
  }))

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {sparks.map((s) => {
        const r = s.size * 2
        const bloom = `0 0 ${r}px rgba(245, 230, 200, 0.5), 0 0 ${r * 1.5}px rgba(212, 175, 55, 0.25)`
        return (
          <div
            key={s.id}
            className="absolute bottom-0 rounded-full animate-spark-rise"
            style={{
              left: s.left,
              width: s.size,
              height: s.size,
              background: 'rgba(255, 248, 240, 0.6)',
              boxShadow: bloom,
              filter: 'blur(1px)',
              animationDelay: s.delay,
              animationDuration: s.duration,
              opacity: s.opacity,
            }}
          />
        )
      })}
    </div>
  )
}
