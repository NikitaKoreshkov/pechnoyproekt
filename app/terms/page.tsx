'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

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
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-b from-[#FAF7F2] via-[#F5F0E8] to-[#FAF7F2] pt-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A0F0A]"></div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-[#FAF7F2] via-[#F5F0E8] to-[#FAF7F2] pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {/* Заголовок */}
          <div className="mb-16 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-[#5C3825] mb-4 font-medium">Документы</p>
            <h1 className="text-4xl md:text-5xl font-bold text-[#1A1210] mb-6 font-lora tracking-tight">
              {title}
            </h1>
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-[#1A0F0A]/30 to-transparent mx-auto mb-6"></div>
            <p className="text-[#5C3825]/90 text-lg">
              Последнее обновление: {new Date().toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Основной контент */}
          <div 
            className="bg-white rounded-2xl shadow-[0_8px_40px_-12px_rgba(26,15,10,0.12)] p-8 md:p-12 space-y-8 prose prose-lg max-w-none border border-[#E8E2D9] prose-headings:text-[#1A1210] prose-p:text-[#5C3825]/90 prose-a:text-[#1A0F0A] prose-strong:text-[#1A1210]"
            dangerouslySetInnerHTML={{ __html: content }}
          />

          {/* Кнопка возврата */}
          <div className="mt-16 text-center">
            <Link 
              href="/" 
              className="inline-flex items-center px-8 py-4 bg-[#1A0F0A] hover:bg-[#2C1810] text-white font-semibold rounded-xl transition-all duration-300 shadow-[0_4px_20px_-4px_rgba(26,15,10,0.3)] hover:shadow-[0_8px_30px_-4px_rgba(26,15,10,0.4)] tracking-wider"
            >
              Вернуться на главную
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
