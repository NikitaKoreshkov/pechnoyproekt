'use client'

import { useEffect, useState } from 'react'
import AdminTopBar from '@/components/admin/AdminTopBar'

export default function CatalogSeoTextEditorPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/admin/catalog-seo-text', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setTitle(data.title || '')
          setContent(data.content || '')
        }
      } catch (error) {
        console.error('Error loading catalog SEO text:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/catalog-seo-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
      })
      
      if (res.ok) {
        // Отправляем событие для обновления на сайте в реальном времени
        if (typeof window !== 'undefined') {
          try {
            const channel = new BroadcastChannel('catalog-seo-text-updates')
            channel.postMessage({ type: 'CATALOG_SEO_TEXT_UPDATED', timestamp: Date.now() })
            channel.close()
            console.log('[SAVE Catalog SEO Text] Broadcast event sent')
          } catch (e) {
            console.error('[SAVE Catalog SEO Text] Failed to send broadcast:', e)
          }
        }
        
        alert('✅ SEO-текст успешно сохранен! Изменения будут видны на сайте в течение нескольких секунд.')
      } else {
        const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        alert(`❌ Ошибка сохранения: ${errorData.error || 'Неизвестная ошибка'}`)
      }
    } catch (err) {
      console.error('Error saving catalog SEO text:', err)
      alert(`❌ Ошибка: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <AdminTopBar 
        title="SEO-текст каталога" 
        backHref="/admin/changes" 
        actions={
          <button 
            onClick={save} 
            disabled={saving} 
            className="px-3 py-1.5 bg-gray-900 text-white rounded disabled:opacity-50"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        } 
      />
      
      <div className="bg-white border rounded p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Заголовок
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Каталог продукции и услуг"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Текст
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={15}
            className="w-full border rounded px-3 py-2"
            placeholder="Введите текст описания..."
          />
          <p className="mt-2 text-sm text-gray-500">
            Текст будет отображаться на странице каталога. Можно использовать несколько абзацев.
          </p>
        </div>
      </div>
    </div>
  )
}

