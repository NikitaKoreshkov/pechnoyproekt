'use client'

import { useEffect, useState } from 'react'
import AdminTopBar from '@/components/admin/AdminTopBar'

type LegalPage = 'privacy' | 'terms' | 'cookies'

interface LegalPageConfig {
  title: string
  content: string
}

export default function LegalEditorPage() {
  const [page, setPage] = useState<LegalPage>('privacy')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/legal/${page}`, {
          credentials: 'include',
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-store' }
        })
        if (res.ok) {
          const data = await res.json()
          console.log(`[LEGAL EDITOR ${page.toUpperCase()}] Loaded from server:`, data)
          setTitle(data.title || '')
          setContent(data.content || '')
        } else {
          console.error(`[LEGAL EDITOR ${page.toUpperCase()}] Load failed:`, res.status)
        }
      } catch (error) {
        console.error(`[LEGAL EDITOR ${page.toUpperCase()}] Error loading config:`, error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [page])

  const save = async () => {
    if (isSaving) {
      console.log(`[LEGAL EDITOR ${page.toUpperCase()}] Save already in progress, skipping`)
      return
    }
    
    setIsSaving(true)
    setSavedMessage('')
    
    try {
      const payload = { title, content }
      console.log(`[LEGAL EDITOR ${page.toUpperCase()}] Saving:`, payload)
      
      const res = await fetch(`/api/admin/legal/${page}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
        cache: 'no-store'
      })

      const responseText = await res.text()
      console.log(`[LEGAL EDITOR ${page.toUpperCase()}] Raw response:`, responseText)
      
      if (res.ok) {
        const data = JSON.parse(responseText)
        console.log(`[LEGAL EDITOR ${page.toUpperCase()}] Parsed response:`, data)
        
        setTitle(data.title || '')
        setContent(data.content || '')
        
        setSavedMessage('✅ Изменения сохранены!')
        setTimeout(() => setSavedMessage(''), 3000)
      } else {
        let errorData = { error: 'Неизвестная ошибка' }
        try {
          errorData = JSON.parse(responseText)
        } catch {
          errorData = { error: `Ошибка ${res.status}` }
        }
        console.error(`[LEGAL EDITOR ${page.toUpperCase()}] Error response:`, errorData)
        alert('Ошибка сохранения: ' + (errorData.error || 'Неизвестная ошибка'))
      }
    } catch (error) {
      console.error(`[LEGAL EDITOR ${page.toUpperCase()}] Error saving:`, error)
      alert('Ошибка сохранения: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'))
    } finally {
      setIsSaving(false)
    }
  }

  const pageNames: Record<LegalPage, string> = {
    privacy: 'Политика конфиденциальности',
    terms: 'Условия использования',
    cookies: 'Политика Cookie'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    )
  }

  return (
    <>
      <AdminTopBar title={`Редактирование: ${pageNames[page]}`} backHref="/admin/changes" />
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Выбор страницы */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Выберите страницу</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setPage('privacy')}
              className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                page === 'privacy' 
                  ? 'border-[#5D4E37] bg-[#F5F1E8] text-[#5D4E37]' 
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              Политика конфиденциальности
            </button>
            <button
              onClick={() => setPage('terms')}
              className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                page === 'terms' 
                  ? 'border-[#5D4E37] bg-[#F5F1E8] text-[#5D4E37]' 
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              Условия использования
            </button>
            <button
              onClick={() => setPage('cookies')}
              className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                page === 'cookies' 
                  ? 'border-[#5D4E37] bg-[#F5F1E8] text-[#5D4E37]' 
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              Политика Cookie
            </button>
          </div>
        </div>

        {/* Редактирование */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Заголовок страницы
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4E37]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Содержимое страницы (HTML)
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4E37] font-mono text-sm"
                rows={30}
                placeholder='HTML контент страницы...'
              />
              <p className="text-sm text-gray-500 mt-2">
                Используйте HTML для форматирования текста. Примеры: &lt;strong&gt;, &lt;em&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt; и т.д.
              </p>
            </div>
          </div>
        </div>

        {/* Сохранить */}
        <div className="flex gap-4">
          <button
            onClick={save}
            disabled={isSaving}
            className="flex-1 bg-[#5D4E37] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#6D5D4A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
          {savedMessage && (
            <div className="flex items-center text-green-600 font-medium">
              {savedMessage}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

