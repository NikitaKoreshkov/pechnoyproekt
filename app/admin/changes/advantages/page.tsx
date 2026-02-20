'use client'

import { useEffect, useState } from 'react'
import AdminTopBar from '@/components/admin/AdminTopBar'

interface Advantage {
  id: string
  title: string
  description: string
}

export default function AdvantagesEditorPage() {
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [items, setItems] = useState<Advantage[]>([])
  const [loading, setLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/advantages', {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-store'
        }
      })
      if (res.ok) {
        const data = await res.json()
        console.log('[ADVANTAGES EDITOR] Loaded from server:', data)
        setTitle(data.title || '')
        setSubtitle(data.subtitle || '')
        setItems(data.items || [])
      } else {
        console.error('[ADVANTAGES EDITOR] Load failed:', res.status)
      }
    } catch (error) {
      console.error('[ADVANTAGES EDITOR] Error loading config:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const save = async () => {
    if (isSaving) {
      console.log('[ADVANTAGES EDITOR] Save already in progress, skipping')
      return
    }
    
    setIsSaving(true)
    setSavedMessage('')
    
    try {
      const payload = { title, subtitle, items }
      console.log('[ADVANTAGES EDITOR] Saving:', payload)
      
      const res = await fetch('/api/admin/advantages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
        cache: 'no-store'
      })

      const responseText = await res.text()
      console.log('[ADVANTAGES EDITOR] Raw response:', responseText)

      if (res.ok) {
        const data = JSON.parse(responseText)
        console.log('[ADVANTAGES EDITOR] Parsed response:', data)
        
        setTitle(data.title || '')
        setSubtitle(data.subtitle || '')
        setItems(data.items || [])
        
        setSavedMessage('✅ Изменения сохранены!')
        setTimeout(() => setSavedMessage(''), 3000)
      } else {
        let errorData = { error: 'Неизвестная ошибка' }
        try {
          errorData = JSON.parse(responseText)
        } catch {
          errorData = { error: `Ошибка ${res.status}` }
        }
        console.error('[ADVANTAGES EDITOR] Error response:', errorData)
        alert('Ошибка сохранения: ' + (errorData.error || 'Неизвестная ошибка'))
      }
    } catch (error) {
      console.error('[ADVANTAGES EDITOR] Error saving:', error)
      alert('Ошибка сохранения: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'))
    } finally {
      setIsSaving(false)
    }
  }

  const updateItem = (index: number, field: keyof Advantage, value: string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
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
      <AdminTopBar title="Редактирование 'Наши преимущества'" backHref="/admin/changes" />
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Общие настройки */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Общие настройки</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Заголовок блока
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
                Подзаголовок
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4E37]"
              />
            </div>
          </div>
        </div>

        {/* Преимущества */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Преимущества</h2>
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-[#E8DCC6] text-[#5D4E37] rounded-full flex items-center justify-center">
                    {item.id}
                  </div>
                  <span className="text-sm font-medium text-gray-600">ID: {item.id}</span>
                </div>
                <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Заголовок
                  </label>
                  <input
                    type="text"
                      value={item.title}
                      onChange={(e) => updateItem(index, 'title', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4E37]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Описание
                  </label>
                  <textarea
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4E37]"
                    rows={2}
                  />
                  </div>
                </div>
              </div>
            ))}
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
