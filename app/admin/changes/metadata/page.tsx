'use client'

import { useEffect, useState } from 'react'
import AdminTopBar from '@/components/admin/AdminTopBar'
import ImageUploader from '@/components/admin/ImageUploader'

export default function MetadataEditorPage() {
  const [faviconUrl, setFaviconUrl] = useState('')
  const [appleTouchIcon, setAppleTouchIcon] = useState('')
  const [siteTitle, setSiteTitle] = useState('')
  const [siteDescription, setSiteDescription] = useState('')
  const [siteKeywords, setSiteKeywords] = useState('')
  const [ogImage, setOgImage] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/metadata', {
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-store' }
      })
      if (res.ok) {
        const data = await res.json()
        console.log('[METADATA EDITOR] Loaded from server:', data)
        setFaviconUrl(data.faviconUrl || '')
        setAppleTouchIcon(data.appleTouchIcon || '')
        setSiteTitle(data.siteTitle || '')
        setSiteDescription(data.siteDescription || '')
        setSiteKeywords(data.siteKeywords || '')
        setOgImage(data.ogImage || '')
      } else {
        console.error('[METADATA EDITOR] Load failed:', res.status)
      }
    } catch (error) {
      console.error('[METADATA EDITOR] Error loading metadata config:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const save = async () => {
    if (isSaving) {
      console.log('[METADATA EDITOR] Save already in progress, skipping')
      return
    }
    
    setIsSaving(true)
    setSavedMessage('')
    
    try {
      const payload = {
        faviconUrl,
        appleTouchIcon,
        siteTitle,
        siteDescription,
        siteKeywords,
        ogImage
      }
      console.log('[METADATA EDITOR] Saving:', payload)
      
      const res = await fetch('/api/admin/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
        cache: 'no-store'
      })

      const responseText = await res.text()
      console.log('[METADATA EDITOR] Raw response:', responseText)
      
      if (res.ok) {
        const data = JSON.parse(responseText)
        console.log('[METADATA EDITOR] Parsed response:', data)
        
        setFaviconUrl(data.faviconUrl || '')
        setAppleTouchIcon(data.appleTouchIcon || '')
        setSiteTitle(data.siteTitle || '')
        setSiteDescription(data.siteDescription || '')
        setSiteKeywords(data.siteKeywords || '')
        setOgImage(data.ogImage || '')
        
        setSavedMessage('✅ Изменения сохранены!')
        setTimeout(() => setSavedMessage(''), 3000)
      } else {
        let errorData = { error: 'Неизвестная ошибка' }
        try {
          errorData = JSON.parse(responseText)
        } catch {
          errorData = { error: `Ошибка ${res.status}` }
        }
        console.error('[METADATA EDITOR] Error response:', errorData)
        alert('Ошибка сохранения: ' + (errorData.error || 'Неизвестная ошибка'))
      }
    } catch (error) {
      console.error('[METADATA EDITOR] Error saving:', error)
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
      <AdminTopBar title="Настройки SEO и Favicon" backHref="/admin/changes" />
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Favicon и иконки */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Иконки сайта</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Favicon
              </label>
              <ImageUploader
                value={faviconUrl}
                onChange={setFaviconUrl}
                placeholder="URL или загрузить файл"
              />
              <p className="text-sm text-gray-500 mt-2">
                Маленькая иконка, отображаемая во вкладке браузера (рекомендуемый размер: 32×32 или 64×64px)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apple Touch Icon
              </label>
              <ImageUploader
                value={appleTouchIcon}
                onChange={setAppleTouchIcon}
                placeholder="URL или загрузить файл"
              />
              <p className="text-sm text-gray-500 mt-2">
                Иконка для устройств Apple (рекомендуемый размер: 180×180px)
              </p>
            </div>
          </div>
        </div>

        {/* SEO метаданные */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">SEO метаданные</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Заголовок сайта
              </label>
              <input
                type="text"
                value={siteTitle}
                onChange={(e) => setSiteTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4E37]"
              />
              <p className="text-sm text-gray-500 mt-2">
                Отображается в поисковых системах и вкладке браузера
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Описание
              </label>
              <textarea
                value={siteDescription}
                onChange={(e) => setSiteDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4E37]"
                rows={3}
              />
              <p className="text-sm text-gray-500 mt-2">
                Краткое описание сайта для поисковых систем (рекомендуемая длина: 150-160 символов)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ключевые слова
              </label>
              <input
                type="text"
                value={siteKeywords}
                onChange={(e) => setSiteKeywords(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4E37]"
              />
              <p className="text-sm text-gray-500 mt-2">
                Ключевые слова через запятую для SEO
              </p>
            </div>
          </div>
        </div>

        {/* Open Graph изображение */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Open Graph изображение</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Изображение для социальных сетей
            </label>
            <ImageUploader
              value={ogImage}
              onChange={setOgImage}
              placeholder="URL или загрузить файл"
            />
            <p className="text-sm text-gray-500 mt-2">
              Изображение, которое отображается при публикации ссылки в социальных сетях (рекомендуемый размер: 1200×630px)
            </p>
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

