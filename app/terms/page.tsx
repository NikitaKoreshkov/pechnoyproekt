'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function TermsPage() {
  const [title, setTitle] = useState('Условия использования')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/legal/terms', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setTitle(data.title || 'Условия использования')
          setContent(data.content || '')
        }
      } catch (error) {
        console.error('Error loading terms config:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Заголовок */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 font-lora">
            {title}
          </h1>
          <p className="text-gray-600 text-lg">
            Последнее обновление: {new Date().toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Основной контент */}
        <div 
          className="bg-white rounded-2xl shadow-lg p-8 md:p-12 space-y-8 prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />

        {/* Кнопка возврата */}
        <div className="mt-12 text-center">
          <Link 
            href="/" 
            className="inline-block px-8 py-3 bg-[#1E3A5F] hover:bg-[#2C5282] text-white font-semibold rounded-lg transition-colors duration-200"
          >
            Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  )
}
