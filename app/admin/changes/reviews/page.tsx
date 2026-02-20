'use client'

import { useEffect, useState } from 'react'
import AdminTopBar from '@/components/admin/AdminTopBar'
import ImageUploader from '@/components/admin/ImageUploader'

interface Review { id?: string; name: string; city: string; text: string; image?: string | null; date?: string }

interface ReviewsConfig {
  title: string
  description: string
}

export default function ReviewsEditorPage() {
  const [items, setItems] = useState<Review[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [config, setConfig] = useState<ReviewsConfig>({
    title: 'Реальные фото и отзывы наших клиентов',
    description: 'Мы собрали часть отзывов от наших клиентов.\n\nОстальные отзывы можно посмотреть по запросу или в наших соцсетях.'
  })
  const [configLoading, setConfigLoading] = useState(false)
  const [configSaving, setConfigSaving] = useState(false)

  const load = async () => {
    const res = await fetch('/api/admin/reviews')
    if (res.ok) setItems(await res.json())
  }
  
  const loadConfig = async () => {
    console.log('[REVIEWS CONFIG] Starting loadConfig...')
    setConfigLoading(true)
    try {
      console.log('[REVIEWS CONFIG] Fetching from /api/admin/reviews-config')
      const res = await fetch('/api/admin/reviews-config', { 
        cache: 'no-store',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      console.log('[REVIEWS CONFIG] Response status:', res.status, 'ok:', res.ok)
      if (res.ok) {
        const data = await res.json()
        console.log('[REVIEWS CONFIG] Loaded from server:', data)
        console.log('[REVIEWS CONFIG] Title:', data.title, 'Description length:', data.description?.length)
        if (data && (data.title || data.description)) {
          const newConfig = {
            title: data.title || 'Реальные фото и отзывы наших клиентов',
            description: data.description || 'Мы собрали часть отзывов — чтобы вы могли увидеть, как строим дома на практике.\n\nОстальные отзывы можно посмотреть по запросу или в наших соцсетях.'
          }
          console.log('[REVIEWS CONFIG] Setting config:', newConfig)
          setConfig(newConfig)
          console.log('[REVIEWS CONFIG] Config set successfully')
        } else {
          console.warn('[REVIEWS CONFIG] Data is empty or invalid:', data)
        }
      } else {
        const errorText = await res.text().catch(() => '')
        console.error('[REVIEWS CONFIG] Load failed:', res.status, errorText)
      }
    } catch (error) {
      console.error('[REVIEWS CONFIG] Error loading reviews config:', error)
    } finally {
      setConfigLoading(false)
      console.log('[REVIEWS CONFIG] loadConfig finished')
    }
  }
  
  useEffect(() => { 
    console.log('[REVIEWS CONFIG] Component mounted, loading data...')
    load()
    loadConfig()
  }, [])
  
  // Логируем изменения конфигурации
  useEffect(() => {
    console.log('[REVIEWS CONFIG] Config state changed:', config)
  }, [config])

  const add = () => setItems(it => [...it, { name: '', city: '', text: '', image: '' }])
  const removeLocal = (idx: number) => setItems(it => it.filter((_, i) => i !== idx))

  const saveAll = async () => {
    setLoading(true)
    try {
      // Сначала сохраняем конфигурацию отзывов, если она была изменена
      console.log('[SAVE REVIEWS] Saving reviews config first...')
      try {
        const configRes = await fetch('/api/admin/reviews-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(config)
        })
        if (configRes.ok) {
          console.log('[SAVE REVIEWS] Reviews config saved successfully')
          const savedConfig = await configRes.json()
          setConfig({
            title: savedConfig.title || config.title,
            description: savedConfig.description || config.description
          })
        } else {
          console.warn('[SAVE REVIEWS] Failed to save reviews config:', configRes.status)
        }
      } catch (configErr) {
        console.warn('[SAVE REVIEWS] Error saving reviews config:', configErr)
        // Продолжаем сохранение отзывов даже если конфигурация не сохранилась
      }

      console.log('[SAVE REVIEWS] Sending POST request:', items)
      const res = await fetch('/api/admin/reviews', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(items) 
      })
      console.log('[SAVE REVIEWS] Response status:', res.status)
      setLoading(false)
      if (res.ok) {
        const result = await res.json()
        console.log('[SAVE REVIEWS] Success:', result)
        // Принудительно перезагружаем данные
        await fetch('/api/admin/reviews', { cache: 'no-store' })
          .then(r => r.json())
          .then(data => {
            console.log('[SAVE REVIEWS] Reloaded data:', data)
            setItems(data)
          })
        // Перезагружаем конфигурацию
        await loadConfig()
        alert('✅ Отзывы и текст блока успешно сохранены!')
      } else {
        const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        console.error('[SAVE REVIEWS] Error:', errorData)
        alert(`❌ Ошибка сохранения: ${errorData.error || 'Неизвестная ошибка'}`)
      }
    } catch (err) {
      console.error('[SAVE REVIEWS] Exception:', err)
      setLoading(false)
      alert(`❌ Ошибка: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`)
    }
  }

  const deleteSelected = async () => {
    const ids = items.filter(i => i.id && selected[i.id]).map(i => i.id as string)
    if (!ids.length) return alert('Выберите отзывы для удаления')
    if (!confirm(`Удалить ${ids.length} отзыв(ов)?`)) return
    const res = await fetch('/api/admin/reviews', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) })
    if (res.ok) {
      setSelected({})
      await load()
      alert(`✅ Удалено ${ids.length} отзыв(ов)`)
    } else {
      alert('❌ Ошибка удаления')
    }
  }

  const saveConfig = async () => {
    console.log('[REVIEWS CONFIG] saveConfig called, configSaving:', configSaving)
    if (configSaving) {
      console.log('[REVIEWS CONFIG] Already saving, skipping')
      return
    }
    console.log('[REVIEWS CONFIG] Current config before save:', config)
    console.log('[REVIEWS CONFIG] Title length:', config.title?.length, 'Description length:', config.description?.length)
    setConfigSaving(true)
    try {
      const payload = {
        title: config.title,
        description: config.description
      }
      console.log('[REVIEWS CONFIG] Sending POST request with payload:', payload)
      const res = await fetch('/api/admin/reviews-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      })
      console.log('[REVIEWS CONFIG] Response status:', res.status, 'ok:', res.ok)
      if (res.ok) {
        const savedData = await res.json()
        console.log('[REVIEWS CONFIG] Saved data received:', savedData)
        // Обновляем локальное состояние из ответа сервера
        const updatedConfig = {
          title: savedData.title || config.title,
          description: savedData.description || config.description
        }
        console.log('[REVIEWS CONFIG] Updating local config to:', updatedConfig)
        setConfig(updatedConfig)
        // Перезагружаем конфигурацию для уверенности
        console.log('[REVIEWS CONFIG] Reloading config from server...')
        await loadConfig()
        console.log('[REVIEWS CONFIG] Save completed successfully')
        alert('✅ Текст блока отзывов успешно сохранен!')
      } else {
        const errorText = await res.text().catch(() => '')
        console.error('[REVIEWS CONFIG] Save failed, response text:', errorText)
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: `HTTP ${res.status}: ${errorText}` }
        }
        console.error('[REVIEWS CONFIG] Error data:', errorData)
        alert(`❌ Ошибка сохранения: ${errorData.error || 'Неизвестная ошибка'}`)
      }
    } catch (err) {
      console.error('[REVIEWS CONFIG] Exception during save:', err)
      alert(`❌ Ошибка: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`)
    } finally {
      setConfigSaving(false)
      console.log('[REVIEWS CONFIG] saveConfig finished')
    }
  }

  return (
    <div className="space-y-4">
      <AdminTopBar title="Отзывы" backHref="/admin/changes" actions={
        <>
          <button onClick={add} className="px-3 py-1.5 border rounded">Добавить</button>
          <button onClick={saveAll} disabled={loading} className="px-3 py-1.5 bg-gray-900 text-white rounded">Сохранить все</button>
          <button onClick={deleteSelected} className="px-3 py-1.5 bg-red-100 text-red-700 rounded border border-red-200">Удалить выбранные</button>
        </>
      } />
      
      {/* Редактирование текста блока отзывов */}
      <div className="bg-white border rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-semibold mb-4">Текст блока отзывов</h2>
        {configLoading ? (
          <div className="text-gray-600">Загрузка...</div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Заголовок
              </label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4E37]"
                placeholder="Реальные фото и отзывы наших клиентов"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Описание
              </label>
              <textarea
                value={config.description}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4E37]"
                rows={4}
                placeholder="Мы собрали часть отзывов — чтобы вы могли увидеть, как строим дома на практике.&#10;&#10;Остальные отзывы можно посмотреть по запросу или в наших соцсетях."
              />
            </div>
            <button
              onClick={(e) => {
                console.log('[REVIEWS CONFIG] Button clicked!', e)
                console.log('[REVIEWS CONFIG] Current config:', config)
                console.log('[REVIEWS CONFIG] configSaving:', configSaving)
                e.preventDefault()
                e.stopPropagation()
                saveConfig()
              }}
              disabled={configSaving}
              className="px-4 py-2 bg-[#5D4E37] text-white rounded-lg hover:bg-[#6D5D4A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {configSaving ? 'Сохранение...' : 'Сохранить текст блока'}
            </button>
          </>
        )}
      </div>

      {/* Список отзывов */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Список отзывов</h2>
      </div>
      {items.map((it, idx) => (
        <div key={idx} className="bg-white border rounded p-4 space-y-3">
          <div className="flex gap-3 items-center">
            <input type="checkbox" disabled={!it.id} checked={!!(it.id && selected[it.id])} onChange={() => it.id && setSelected(s => ({ ...s, [it.id as string]: !s[it.id as string] }))} />
            <button onClick={() => removeLocal(idx)} className="ml-auto px-3 py-1 text-red-600 border border-red-200 rounded">Убрать из списка</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="border rounded px-3 py-2" placeholder="Имя" value={it.name} onChange={e => setItems(arr => arr.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))} />
            <input className="border rounded px-3 py-2" placeholder="Город" value={it.city} onChange={e => setItems(arr => arr.map((x, i) => i === idx ? { ...x, city: e.target.value } : x))} />
            <ImageUploader value={it.image || ''} onChange={url => setItems(arr => arr.map((x, i) => i === idx ? { ...x, image: url } : x))} placeholder="Фото (URL или загрузить)" />
            <input className="border rounded px-3 py-2" type="date" value={it.date ? it.date.substring(0,10) : ''} onChange={e => setItems(arr => arr.map((x, i) => i === idx ? { ...x, date: e.target.value } : x))} />
          </div>
          <textarea className="w-full border rounded px-3 py-2" placeholder="Текст отзыва" rows={4} value={it.text} onChange={e => setItems(arr => arr.map((x, i) => i === idx ? { ...x, text: e.target.value } : x))} />
        </div>
      ))}
    </div>
  )
}


