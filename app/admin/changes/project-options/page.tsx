'use client'

import { useEffect, useState } from 'react'
import AdminTopBar from '@/components/admin/AdminTopBar'

interface Option {
  id: string
  label: string
  price: number
  isDefault: boolean
}

export default function ProjectOptionsEditorPage() {
  const [cfg, setCfg] = useState<{
    finishing: Option[]
    insulation: Option[]
    floor: Option[]
    foundation: Option[]
  } | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    const res = await fetch('/api/admin/project-options', { 
      cache: 'no-store',
      credentials: 'include'
    })
    if (res.ok) {
      const data = await res.json()
      setCfg({
        finishing: Array.isArray(data.finishing) ? data.finishing : [],
        insulation: Array.isArray(data.insulation) ? data.insulation : [],
        floor: Array.isArray(data.floor) ? data.floor : [],
        foundation: Array.isArray(data.foundation) ? data.foundation : []
      })
    }
  }
  
  useEffect(() => { load() }, [])

  const updateOption = (category: 'finishing' | 'insulation' | 'floor' | 'foundation', index: number, field: keyof Option, value: any) => {
    if (!cfg) return
    setCfg({
      ...cfg,
      [category]: cfg[category].map((opt, idx) => 
        idx === index ? { ...opt, [field]: value } : opt
      )
    })
  }

  const addOption = (category: 'finishing' | 'insulation' | 'floor' | 'foundation') => {
    if (!cfg) return
    const newOption: Option = {
      id: `${category}-${Date.now()}`,
      label: 'Новая опция',
      price: 0,
      isDefault: false
    }
    setCfg({
      ...cfg,
      [category]: [...cfg[category], newOption]
    })
  }

  const removeOption = (category: 'finishing' | 'insulation' | 'floor' | 'foundation', index: number) => {
    if (!cfg) return
    if (cfg[category].length <= 1) {
      alert('Должна остаться хотя бы одна опция в каждой категории')
      return
    }
    setCfg({
      ...cfg,
      [category]: cfg[category].filter((_, idx) => idx !== index)
    })
  }

  const setDefault = (category: 'finishing' | 'insulation' | 'floor' | 'foundation', index: number) => {
    if (!cfg) return
    setCfg({
      ...cfg,
      [category]: cfg[category].map((opt, idx) => ({
        ...opt,
        isDefault: idx === index
      }))
    })
  }

  const save = async () => {
    if (!cfg) return
    setLoading(true)
    try {
      // Валидация и нормализация данных перед отправкой
      const dataToSave = {
        finishing: cfg.finishing.map(opt => ({
          id: opt.id || `${Date.now()}-${Math.random()}`,
          label: String(opt.label || '').trim(),
          price: Number(opt.price) || 0,
          isDefault: Boolean(opt.isDefault)
        })),
        insulation: cfg.insulation.map(opt => ({
          id: opt.id || `${Date.now()}-${Math.random()}`,
          label: String(opt.label || '').trim(),
          price: Number(opt.price) || 0,
          isDefault: Boolean(opt.isDefault)
        })),
        floor: cfg.floor.map(opt => ({
          id: opt.id || `${Date.now()}-${Math.random()}`,
          label: String(opt.label || '').trim(),
          price: Number(opt.price) || 0,
          isDefault: Boolean(opt.isDefault)
        })),
        foundation: cfg.foundation.map(opt => ({
          id: opt.id || `${Date.now()}-${Math.random()}`,
          label: String(opt.label || '').trim(),
          price: Number(opt.price) || 0,
          isDefault: Boolean(opt.isDefault)
        }))
      }

      // Проверка, что есть хотя бы одна опция в каждой категории
      const categories = ['finishing', 'insulation', 'floor', 'foundation'] as const
      for (const category of categories) {
        if (dataToSave[category].length === 0) {
          alert(`❌ Ошибка: В категории "${category}" должна быть хотя бы одна опция`)
          setLoading(false)
          return
        }
        // Проверка, что есть хотя бы одна опция по умолчанию
        const hasDefault = dataToSave[category].some(opt => opt.isDefault)
        if (!hasDefault) {
          // Автоматически устанавливаем первую опцию как дефолтную
          dataToSave[category][0].isDefault = true
        }
      }

      console.log('[ADMIN] Saving project options:', dataToSave)
      const res = await fetch('/api/admin/project-options', { 
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }, 
        body: JSON.stringify(dataToSave) 
      })
      if (!res.ok) {
        const errorText = await res.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText || `HTTP ${res.status}` }
        }
        console.error('[ADMIN] Save error response:', res.status, errorData)
        alert(`❌ Ошибка сохранения (${res.status}): ${errorData.error || 'Неизвестная ошибка'}\n\nПроверьте консоль браузера для подробностей.`)
        setLoading(false)
        return
      }

      const result = await res.json()
      console.log('[ADMIN] Saved result:', result)
      
      // Проверяем, что данные действительно сохранены
      if (!result || (!result.finishing && !result.insulation && !result.floor && !result.foundation)) {
        console.error('[ADMIN] Invalid response from server:', result)
        alert('❌ Ошибка: Сервер вернул неверные данные. Проверьте консоль для подробностей.')
        setLoading(false)
        return
      }
      
      // Обновляем локальное состояние только после успешного сохранения
      setCfg({
        finishing: Array.isArray(result.finishing) ? result.finishing : [],
        insulation: Array.isArray(result.insulation) ? result.insulation : [],
        floor: Array.isArray(result.floor) ? result.floor : [],
        foundation: Array.isArray(result.foundation) ? result.foundation : []
      })
      
      // Отправляем сигнал через BroadcastChannel для мгновенного обновления на всех вкладках
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('project-options-update')
        channel.postMessage({ type: 'options-updated', timestamp: Date.now() })
        channel.close()
      }
      
      alert('✅ Настройки опций проектов успешно сохранены! Изменения отобразятся на страницах проектов мгновенно (или в течение 0.5 секунды при открытых вкладках).')
    } catch (err) {
      console.error('[ADMIN] Save exception:', err)
      alert(`❌ Ошибка: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`)
    } finally {
      setLoading(false)
    }
  }

  if (!cfg) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5D4E37] mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `${(price / 1000).toFixed(0)} тыс ₽`
    }
    return `${price} ₽`
  }

  const renderCategory = (
    title: string,
    category: 'finishing' | 'insulation' | 'floor' | 'foundation'
  ) => (
    <section className="bg-white border rounded p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-xl text-gray-900">{title}</h2>
        <button
          onClick={() => addOption(category)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
        >
          + Добавить
        </button>
      </div>
      <div className="space-y-3">
        {cfg[category].map((opt, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
              <input
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#5D4E37] focus:border-[#5D4E37]"
                placeholder="Например: Вагонка"
                value={opt.label}
                onChange={e => updateOption(category, idx, 'label', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Цена (₽)</label>
              <input
                type="number"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#5D4E37] focus:border-[#5D4E37]"
                placeholder="0"
                value={opt.price}
                onChange={e => updateOption(category, idx, 'price', Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Отображение</label>
              <div className="text-sm text-gray-600 py-2 px-3 bg-white rounded-lg border">
                {opt.price > 0 ? `+${formatPrice(opt.price)}` : '0'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={opt.isDefault}
                  onChange={() => setDefault(category, idx)}
                  className="w-5 h-5 text-[#5D4E37] focus:ring-[#5D4E37]"
                />
                <span className="text-sm font-medium text-gray-700">По умолчанию</span>
              </label>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => removeOption(category, idx)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                title="Удалить"
                disabled={cfg[category].length <= 1}
              >
                ✕ Удалить
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )

  return (
    <div className="space-y-6">
      <AdminTopBar 
        title="Опции проектов" 
        backHref="/admin/changes" 
        actions={
          <button 
            onClick={save} 
            disabled={loading} 
            className="px-3 py-1.5 bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
        } 
      />

      <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
        <p className="text-sm text-yellow-800">
          <strong>Внимание:</strong> Эти опции отображаются на странице каждого проекта. 
          Можно добавлять новые опции, изменять названия и цены, удалять ненужные. 
          В каждой категории должна остаться хотя бы одна опция, и одна из них должна быть выбрана по умолчанию.
        </p>
      </div>

      {renderCategory('Отделка', 'finishing')}
      {renderCategory('Утепление', 'insulation')}
      {renderCategory('Пол', 'floor')}
      {renderCategory('Фундамент', 'foundation')}
    </div>
  )
}

