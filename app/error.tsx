'use client'

import { useEffect } from 'react'

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Root error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF7F2] via-[#F5F0E8] to-[#EDE8E0] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/80 rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-xl font-semibold text-[#2C1810] mb-2">Что-то пошло не так</h1>
        <p className="text-gray-600 mb-6 text-sm">
          Не удалось загрузить страницу. Проверьте консоль браузера (F12) и что база данных запущена.
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-[#2C1810] hover:bg-[#4A2C1A] text-white font-medium rounded-lg transition-colors"
        >
          Попробовать снова
        </button>
      </div>
    </div>
  )
}
