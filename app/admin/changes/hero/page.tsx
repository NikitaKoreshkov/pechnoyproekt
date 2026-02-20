'use client'

import { useEffect, useState } from 'react'
import AdminTopBar from '@/components/admin/AdminTopBar'
import ImageUploader from '@/components/admin/ImageUploader'

export default function HeroEditorPage() {
  const [heroImage, setHeroImage] = useState('')
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/hero', {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-store'
        }
      })
      if (res.ok) {
        const data = await res.json()
        console.log('[HERO EDITOR] Loaded from server:', data)
        setHeroImage(data.heroImage || '')
        setTitle(data.title || '')
        setSubtitle(data.subtitle || '')
      } else {
        console.error('[HERO EDITOR] Load failed:', res.status)
      }
    } catch (error) {
      console.error('[HERO EDITOR] Error loading hero config:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const save = async () => {
    // Защита от двойного сохранения
    if (isSaving) {
      console.log('[HERO EDITOR] Save already in progress, skipping')
      return
    }
    
    setIsSaving(true)
    setSavedMessage('')
    
    try {
      const payload = { heroImage, title, subtitle }
      console.log('[HERO EDITOR] Saving:', payload)
      
      const res = await fetch('/api/admin/hero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
        cache: 'no-store'
      })

      const responseText = await res.text()
      console.log('[HERO EDITOR] Raw response:', responseText)
      
      if (res.ok) {
        const data = JSON.parse(responseText)
        console.log('[HERO EDITOR] Parsed response:', data)
        
        // Сразу обновляем состояние
        setHeroImage(data.heroImage || '')
        setTitle(data.title || '')
        setSubtitle(data.subtitle || '')
        
        setSavedMessage('✅ Изменения сохранены!')
        setTimeout(() => setSavedMessage(''), 3000)
      } else {
        let errorData = { error: 'Неизвестная ошибка' }
        try {
          errorData = JSON.parse(responseText)
        } catch {
          errorData = { error: `Ошибка ${res.status}` }
        }
        console.error('[HERO EDITOR] Error response:', errorData)
        alert('Ошибка сохранения: ' + (errorData.error || 'Неизвестная ошибка'))
      }
    } catch (error) {
      console.error('[HERO EDITOR] Error saving:', error)
      alert('Ошибка сохранения: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'))
    } finally {
      setIsSaving(false)
    }
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
      <AdminTopBar title="Редактирование Hero-блока" backHref="/admin/changes" />
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Фоновое изображение */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Фоновое изображение</h2>
          <ImageUploader
            value={heroImage}
            onChange={setHeroImage}
            placeholder="URL или загрузить файл"
          />
          <p className="text-sm text-gray-500 mt-2">
            Рекомендуемый размер: 2700x900px (соотношение 27:9). Это изображение отображается на главной странице в верхнем блоке.
          </p>
        </div>

        {/* Заголовок */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Заголовок</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Текст заголовка
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4E37]"
              placeholder="Трубы ПНД и комплектующие для инженерных систем"
            />
          </div>
        </div>

        {/* Подзаголовок */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Подзаголовок</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Текст подзаголовка
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4E37]"
              placeholder="Под ключ. Быстро. Надёжно. С гарантией качества."
            />
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

