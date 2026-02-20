'use client'

import { useEffect, useState } from 'react'
import AdminTopBar from '@/components/admin/AdminTopBar'
import ImageUploader from '@/components/admin/ImageUploader'

export default function HeaderEditorPage() {
  const [logoText, setLogoText] = useState('')
  const [logoImage, setLogoImage] = useState('')
  const [showLogoText, setShowLogoText] = useState(true)
  const [loading, setLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/header', {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-store'
        }
      })
      if (res.ok) {
        const data = await res.json()
        console.log('[HEADER EDITOR] Loaded from server:', data)
        setLogoText(data.logoText || '')
        setLogoImage(data.logoImage || '')
        setShowLogoText(data.showLogoText ?? true)
      } else {
        console.error('[HEADER EDITOR] Load failed:', res.status)
      }
    } catch (error) {
      console.error('[HEADER EDITOR] Error loading header config:', error)
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
      console.log('[HEADER EDITOR] Save already in progress, skipping')
      return
    }
    
    setIsSaving(true)
    setSavedMessage('')
    
    try {
      const payload = { logoText, logoImage, showLogoText }
      console.log('[HEADER EDITOR] Saving:', payload)
      
      const res = await fetch('/api/admin/header', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
        cache: 'no-store'
      })

      const responseText = await res.text()
      console.log('[HEADER EDITOR] Raw response:', responseText)
      
      if (res.ok) {
        const data = JSON.parse(responseText)
        console.log('[HEADER EDITOR] Parsed response:', data)
        
        // Сразу обновляем состояние
        const newLogoText = data.logoText || ''
        const newLogoImage = data.logoImage || ''
        const newShowLogoText = data.showLogoText ?? true
        
        console.log('[HEADER EDITOR] Setting new values:', { newLogoText, newLogoImage, newShowLogoText })
        
        setLogoText(newLogoText)
        setLogoImage(newLogoImage)
        setShowLogoText(newShowLogoText)
        
        // Проверяем через небольшую задержку
        setTimeout(() => {
          console.log('[HEADER EDITOR] Values after setState - logoText should be:', newLogoText)
        }, 50)
        
        setSavedMessage('✅ Изменения сохранены!')
        setTimeout(() => setSavedMessage(''), 3000)
      } else {
        let errorData = { error: 'Неизвестная ошибка' }
        try {
          errorData = JSON.parse(responseText)
        } catch {
          errorData = { error: `Ошибка ${res.status}` }
        }
        console.error('[HEADER EDITOR] Error response:', errorData)
        alert('Ошибка сохранения: ' + (errorData.error || 'Неизвестная ошибка'))
      }
    } catch (error) {
      console.error('[HEADER EDITOR] Error saving:', error)
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
      <AdminTopBar title="Редактирование хедера" backHref="/admin/changes" />
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Текст логотипа */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Текст логотипа</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Текст
              </label>
              <input
                type="text"
                value={logoText}
                onChange={(e) => setLogoText(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4E37]"
                placeholder="АкваГазТех"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showLogoText"
                checked={showLogoText}
                onChange={(e) => setShowLogoText(e.target.checked)}
                className="w-4 h-4 text-[#5D4E37] border-gray-300 rounded focus:ring-[#5D4E37]"
              />
              <label htmlFor="showLogoText" className="text-sm text-gray-700">
                Показать текст логотипа
              </label>
            </div>
          </div>
        </div>

        {/* Изображение логотипа */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Изображение логотипа</h2>
          <ImageUploader
            value={logoImage}
            onChange={setLogoImage}
            placeholder="URL или загрузить файл"
          />
          <p className="text-sm text-gray-500 mt-2">
            Рекомендуемый размер: 200x60px. Логотип будет отображаться слева от текста (если текст включен).
          </p>
        </div>

        {/* Предпросмотр */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Предпросмотр</h2>
          <div className="bg-gray-50 rounded-lg p-8 border border-gray-200">
            <div className="flex items-center gap-3">
              {logoImage && (
                <img 
                  src={logoImage} 
                  alt="Logo" 
                  className="h-10 object-contain"
                />
              )}
              {showLogoText && (
                <span className="text-xl md:text-2xl font-bold text-[#2B2F33] font-lora tracking-wide">
                  {logoText || 'АкваГазТех'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Сохранить */}
        <div className="space-y-3">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800 font-medium">
              ⚠️ Внимание: Нажмите <strong>2 раза</strong> на кнопку "Сохранить изменения" для корректного сохранения
            </p>
          </div>
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
      </div>
    </>
  )
}

