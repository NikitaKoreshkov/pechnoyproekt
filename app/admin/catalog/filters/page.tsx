'use client'

import { useEffect, useState } from 'react'
import AdminTopBar from '@/components/admin/AdminTopBar'

type FilterConfig = {
  title: string
  type: 'range' | 'checkboxes' | 'radio'
  min?: number
  max?: number
  step?: number
  options?: Array<{ label: string; value: string | number }>
}

type FiltersConfig = Record<string, FilterConfig>

export default function CatalogFiltersEditorPage() {
  const [cfg, setCfg] = useState<{ id: string; config: FiltersConfig } | null>(null)
  const [loading, setLoading] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<'range' | 'checkboxes' | 'radio'>('checkboxes')

  const load = async () => {
    try {
    const res = await fetch('/api/admin/catalog/filters?t=' + Date.now(), { cache: 'no-store', credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        console.log('[ADMIN PAGE] Loaded config:', data)
        console.log('[ADMIN PAGE] Loaded config keys:', Object.keys(data.config || {}))
        setCfg({ id: data.id, config: data.config || {} })
  } else {
        console.error('[ADMIN PAGE] Load failed with status:', res.status)
        const errorText = await res.text()
        console.error('[ADMIN PAGE] Load error:', errorText)
      }
    } catch (error) {
      console.error('[ADMIN PAGE] Error loading filters config:', error)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const updateFilter = (key: keyof FiltersConfig, updates: Partial<FilterConfig>) => {
    if (!cfg) return
    setCfg({
      ...cfg,
      config: {
        ...cfg.config,
        [key]: { ...cfg.config[key], ...updates } as FilterConfig
      }
    })
  }

  const addFilterSection = () => {
    if (!cfg) return
    const key = newKey.trim()
    if (!key) return alert('Укажите ключ фильтра (латиница/цифры/нижнее подчёркивание)')
    if (cfg.config[key]) return alert('Такой ключ уже существует')
    const base: FilterConfig = newType === 'range' 
      ? { title: newTitle || key, type: 'range', min: 0, max: 100, step: 1 }
      : { title: newTitle || key, type: newType, options: [{ label: '', value: '' }] }
    setCfg({ ...cfg, config: { ...cfg.config, [key]: base } })
    setNewKey(''); setNewTitle(''); setNewType('checkboxes')
  }

  const removeFilterSection = (key: string) => {
    if (!cfg) return
    const { [key]: _, ...rest } = cfg.config
    setCfg({ ...cfg, config: rest })
  }

  const addOption = (key: keyof FiltersConfig) => {
    if (!cfg || !cfg.config[key]) return
    const filter = cfg.config[key]!
    if (!filter.options) filter.options = []
    updateFilter(key, {
      options: [...filter.options, { label: '', value: '' }]
    })
  }

  const removeOption = (key: keyof FiltersConfig, index: number) => {
    if (!cfg || !cfg.config[key] || !cfg.config[key]!.options) return
    const filter = cfg.config[key]!
    updateFilter(key, {
      options: filter.options!.filter((_, i) => i !== index)
    })
  }

  const updateOption = (key: keyof FiltersConfig, index: number, field: 'label' | 'value', value: string | number) => {
    if (!cfg || !cfg.config[key] || !cfg.config[key]!.options) return
    const filter = cfg.config[key]!
    const newOptions = [...filter.options!]
    newOptions[index] = { ...newOptions[index], [field]: value }
    updateFilter(key, { options: newOptions })
  }

  const save = async () => {
    if (!cfg) return
    setLoading(true)
    try {
      // Глубокая копия, чтобы убрать Proxy/ссылки React state
      const clean = JSON.parse(JSON.stringify(cfg.config || {}))
      console.log('[ADMIN PAGE] Sending config:', clean)
      console.log('[ADMIN PAGE] Config keys:', Object.keys(clean))
      
      const res = await fetch('/api/admin/catalog/filters', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ config: clean }),
        cache: 'no-store',
        credentials: 'include'
      })
      
      console.log('[ADMIN PAGE] Response status:', res.status)
      console.log('[ADMIN PAGE] Response ok:', res.ok)
      
      if (res.ok) {
        const result = await res.json()
        console.log('[ADMIN PAGE] Saved result:', result)
        console.log('[ADMIN PAGE] Result config keys:', Object.keys(result.config || {}))
        
        // Обновляем состояние сразу из ответа сервера
        setCfg({ id: result.id, config: result.config })
        
        // Перечитываем с сервера через небольшую задержку, чтобы убедиться, что в БД сохранилось
        await new Promise(resolve => setTimeout(resolve, 500))
        await load()
        
        // Проверяем, что данные действительно сохранились
        const reloaded = await fetch('/api/admin/catalog/filters?t=' + Date.now(), { cache: 'no-store', credentials: 'include' })
        if (reloaded.ok) {
          const reloadedData = await reloaded.json()
          console.log('[ADMIN PAGE] Reloaded config keys:', Object.keys(reloadedData.config || {}))
          const reloadedKeys = Object.keys(reloadedData.config || {})
          const sentKeys = Object.keys(clean)
          
          if (reloadedKeys.length !== sentKeys.length || !sentKeys.every(k => reloadedKeys.includes(k))) {
            console.warn('[ADMIN PAGE] Config mismatch after save!')
            console.warn('[ADMIN PAGE] Sent keys:', sentKeys)
            console.warn('[ADMIN PAGE] Reloaded keys:', reloadedKeys)
            alert('⚠️ Данные сохранены, но могут отличаться от ожидаемых. Проверьте консоль.')
          } else {
            alert('✅ Фильтры каталога успешно сохранены!')
          }
        } else {
          console.error('[ADMIN PAGE] Failed to reload config')
          alert('⚠️ Данные сохранены, но не удалось проверить. Обновите страницу.')
        }
      } else {
        const errorText = await res.text()
        console.error('[ADMIN PAGE] Error response:', errorText)
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText || `HTTP ${res.status}` }
        }
        alert(`❌ Ошибка сохранения: ${errorData.error || 'Неизвестная ошибка'}`)
      }
    } catch (err) {
      console.error('[ADMIN PAGE] Save error:', err)
      alert(`❌ Ошибка: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`)
    } finally {
      setLoading(false)
    }
  }

  if (!cfg) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    )
  }

  const filterKeys = Object.keys(cfg.config)

  return (
    <div className="space-y-6">
      <AdminTopBar
        title="Фильтры каталога"
        backHref="/admin/catalog"
        actions={
          <button
            onClick={save}
            disabled={loading}
            className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
        }
      />

      <div className="bg-blue-50 border border-blue-200 rounded p-4">
        <p className="text-sm text-blue-800">
          <strong>Инструкция:</strong> Настройте фильтры для каталога проектов. Измените заголовки, диапазоны значений и опции по необходимости.
        </p>
      </div>

      <div className="space-y-6">
        {/* Добавление нового фильтра */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ключ</label>
              <input className="w-full border rounded px-3 py-2" placeholder="например: material" value={newKey} onChange={(e)=>setNewKey(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Название</label>
              <input className="w-full border rounded px-3 py-2" placeholder="Отображаемое имя" value={newTitle} onChange={(e)=>setNewTitle(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Тип</label>
              <select className="w-full border rounded px-3 py-2" value={newType} onChange={(e)=>setNewType(e.target.value as any)}>
                <option value="checkboxes">Мультивыбор</option>
                <option value="radio">Один вариант</option>
                <option value="range">Диапазон</option>
              </select>
            </div>
            <div>
              <button onClick={addFilterSection} className="w-full px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800">Добавить фильтр</button>
            </div>
          </div>
        </div>
        {filterKeys.map((key) => {
          const filter = cfg.config[key as keyof FiltersConfig]
          if (!filter) return null

          return (
            <div key={key} className="bg-white border rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div className="font-semibold text-gray-900">{key}</div>
                <button onClick={() => removeFilterSection(key)} className="text-red-600 border border-red-200 rounded px-3 py-1 text-sm hover:bg-red-50">Удалить фильтр</button>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название фильтра
                </label>
            <input 
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={filter.title || ''}
                  onChange={(e) => updateFilter(key as keyof FiltersConfig, { title: e.target.value })}
                  placeholder="Название фильтра"
                />
          </div>

              {filter.type === 'range' ? (
                <div className="grid grid-cols-3 gap-4">
              <div>
                    <label className="block text-sm text-gray-600 mb-1">Минимум</label>
                <input 
                      type="number"
                  className="w-full border rounded px-3 py-2" 
                      value={filter.min ?? ''}
                      onChange={(e) => updateFilter(key as keyof FiltersConfig, { min: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Максимум</label>
                    <input
                  type="number" 
                      className="w-full border rounded px-3 py-2"
                      value={filter.max ?? ''}
                      onChange={(e) => updateFilter(key as keyof FiltersConfig, { max: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
              <div>
                    <label className="block text-sm text-gray-600 mb-1">Шаг</label>
                <input 
                      type="number"
                  className="w-full border rounded px-3 py-2" 
                      value={filter.step ?? ''}
                      onChange={(e) => updateFilter(key as keyof FiltersConfig, { step: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
            </div>
          ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Опции:</label>
                    <button
                      onClick={() => addOption(key as keyof FiltersConfig)}
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                    >
                      + Добавить опцию
                    </button>
                  </div>
            <div className="space-y-2">
                    {(filter.options || []).map((option, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center p-3 bg-gray-50 rounded">
                  <input 
                          type="text"
                          className="border rounded px-3 py-2"
                          placeholder="Отображаемый текст"
                          value={option.label || ''}
                          onChange={(e) => updateOption(key as keyof FiltersConfig, index, 'label', e.target.value)}
                  />
                  <input 
                          type={typeof option.value === 'number' ? 'number' : 'text'}
                          className="border rounded px-3 py-2"
                          placeholder="Значение для фильтрации"
                          value={option.value ?? ''}
                          onChange={(e) => {
                            const value = typeof option.value === 'number'
                              ? Number(e.target.value)
                              : e.target.value
                            updateOption(key as keyof FiltersConfig, index, 'value', value)
                          }}
                  />
                  <button 
                          onClick={() => removeOption(key as keyof FiltersConfig, index)}
                    className="px-3 py-2 text-red-600 border border-red-200 rounded hover:bg-red-50 text-sm"
                  >
                    Удалить
                  </button>
                </div>
              ))}
                  </div>
            </div>
          )}
        </div>
          )
        })}
      </div>
    </div>
  )
}
