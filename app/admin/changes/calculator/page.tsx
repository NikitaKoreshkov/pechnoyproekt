'use client'

import { useEffect, useState } from 'react'
import AdminTopBar from '@/components/admin/AdminTopBar'

export default function CalculatorEditorPage() {
  const [cfg, setCfg] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    const res = await fetch('/api/admin/calculator', { 
      cache: 'no-store',
      credentials: 'include'
    })
    if (res.ok) setCfg(await res.json())
  }
  useEffect(() => { load() }, [])

  const update = (path: string, value: any) => {
    setCfg((c: any) => {
      const copy = JSON.parse(JSON.stringify(c)) // Deep clone
      const keys = path.split('.')
      let obj = copy
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]]
      obj[keys[keys.length - 1]] = value
      return copy
    })
  }

  const save = async () => {
    setLoading(true)
    try {
      const payload = {
        houseTypes: cfg.houseTypes,
        finishingOptions: cfg.finishingOptions,
        additionalOptions: cfg.additionalOptions,
        stepTexts: cfg.stepTexts,
        areaSettings: cfg.areaSettings,
        formula: cfg.formula,
        whatsappTemplate: cfg.whatsappTemplate,
        estimateTemplate: cfg.estimateTemplate
      }
      console.log('[SAVE CALCULATOR] Sending POST request:', payload)
      const res = await fetch('/api/admin/calculator', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      })
      console.log('[SAVE CALCULATOR] Response status:', res.status)
      if (res.ok) {
        const result = await res.json()
        console.log('[SAVE CALCULATOR] Success:', result)
        // Обновляем состояние из ответа сервера
        setCfg(result)
        alert('✅ Настройки калькулятора успешно сохранены!')
      } else {
        const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        console.error('[SAVE CALCULATOR] Error:', errorData)
        alert(`❌ Ошибка сохранения: ${errorData.error || 'Неизвестная ошибка'}`)
      }
    } catch (err) {
      console.error('[SAVE CALCULATOR] Exception:', err)
      alert(`❌ Ошибка: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`)
    } finally {
      setLoading(false)
    }
  }

  if (!cfg) return null

  return (
    <div className="space-y-6">
      <AdminTopBar title="Калькулятор" backHref="/admin/changes" actions={<button onClick={save} disabled={loading} className="px-3 py-1.5 bg-gray-900 text-white rounded">Сохранить</button>} />

      <section className="bg-white border rounded p-4 space-y-3">
        <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-lg">Типы труб (Шаг 1)</h2>
          {cfg.houseTypes.length < 3 && (
            <button
              onClick={() => {
                const newType = { id: `type-${Date.now()}`, name: 'Новый тип', image: '/images/1.png', basePrice: 5000 }
                setCfg((c: any) => ({ ...c, houseTypes: [...c.houseTypes, newType] }))
              }}
              className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700"
            >
              + Добавить
            </button>
          )}
        </div>
        <input className="border rounded px-3 py-2 w-full" placeholder="Заголовок шага" value={cfg.stepTexts?.step1Title || ''} onChange={e => update('stepTexts.step1Title', e.target.value)} />
        {cfg.houseTypes.map((h: any, idx: number) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input className="border rounded px-3 py-2" placeholder="ID" value={h.id} onChange={e => update(`houseTypes.${idx}.id`, e.target.value)} />
            <input className="border rounded px-3 py-2" placeholder="Название" value={h.name} onChange={e => update(`houseTypes.${idx}.name`, e.target.value)} />
            <input className="border rounded px-3 py-2" placeholder="Картинка" value={h.image} onChange={e => update(`houseTypes.${idx}.image`, e.target.value)} />
            <div className="flex gap-2">
              <input type="number" className="border rounded px-3 py-2 flex-1" placeholder="Цена за м²" value={h.basePrice} onChange={e => update(`houseTypes.${idx}.basePrice`, Number(e.target.value))} />
              {cfg.houseTypes.length > 1 && (
                <button
                  onClick={() => {
                    setCfg((c: any) => ({ ...c, houseTypes: c.houseTypes.filter((_: any, i: number) => i !== idx) }))
                  }}
                  className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  title="Удалить"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
      </section>

      <section className="bg-white border rounded p-4 space-y-3">
        <h2 className="font-semibold text-lg">Длина труб (Шаг 2)</h2>
        <input className="border rounded px-3 py-2 w-full" placeholder="Заголовок шага" value={cfg.stepTexts?.step2Title || ''} onChange={e => update('stepTexts.step2Title', e.target.value)} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Минимальная площадь (м²)</label>
            <input type="number" className="border rounded px-3 py-2 w-full" placeholder="20" value={cfg.areaSettings?.minArea || 20} onChange={e => {
              if (!cfg.areaSettings) update('areaSettings', {})
              update('areaSettings.minArea', Number(e.target.value))
            }} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Максимальная площадь (м²)</label>
            <input type="number" className="border rounded px-3 py-2 w-full" placeholder="120" value={cfg.areaSettings?.maxArea || 120} onChange={e => {
              if (!cfg.areaSettings) update('areaSettings', {})
              update('areaSettings.maxArea', Number(e.target.value))
            }} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Площадь по умолчанию (м²)</label>
            <input type="number" className="border rounded px-3 py-2 w-full" placeholder="50" value={cfg.areaSettings?.defaultArea || 50} onChange={e => {
              if (!cfg.areaSettings) update('areaSettings', {})
              update('areaSettings.defaultArea', Number(e.target.value))
            }} />
          </div>
        </div>
        
        {/* Отображение цен за м² для каждого типа дома */}
        <div className="border-t pt-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">Цены за м по типам труб (редактируются в разделе "Типы труб")</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {cfg.houseTypes.map((h: any, idx: number) => (
              <div key={idx} className="bg-gray-50 p-3 rounded border">
                <div className="text-sm font-medium text-gray-700">{h.name}</div>
                <div className="text-lg font-bold text-gray-900 mt-1">
                  {new Intl.NumberFormat('ru-RU').format(h.basePrice)} ₽/м²
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Пример: {new Intl.NumberFormat('ru-RU').format(h.basePrice * (cfg.areaSettings?.defaultArea || 50))} ₽ за {(cfg.areaSettings?.defaultArea || 50)} м²
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white border rounded p-4 space-y-3">
        <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-lg">Отделка (Шаг 3)</h2>
          <button
            onClick={() => {
              const newOption = { id: `finish-${Date.now()}`, name: 'Новая отделка', multiplier: 0 }
              setCfg((c: any) => ({ ...c, finishingOptions: [...c.finishingOptions, newOption] }))
            }}
            className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700"
          >
            + Добавить
          </button>
        </div>
        <input className="border rounded px-3 py-2 w-full" placeholder="Заголовок шага" value={cfg.stepTexts.step3Title} onChange={e => update('stepTexts.step3Title', e.target.value)} />
        {cfg.finishingOptions.map((f: any, idx: number) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input className="border rounded px-3 py-2" placeholder="ID" value={f.id} onChange={e => update(`finishingOptions.${idx}.id`, e.target.value)} />
            <input className="border rounded px-3 py-2" placeholder="Название" value={f.name} onChange={e => update(`finishingOptions.${idx}.name`, e.target.value)} />
            <input type="number" step="0.01" className="border rounded px-3 py-2" placeholder="Множитель" value={f.multiplier} onChange={e => update(`finishingOptions.${idx}.multiplier`, Number(e.target.value))} />
            <button
              onClick={() => {
                setCfg((c: any) => ({ ...c, finishingOptions: c.finishingOptions.filter((_: any, i: number) => i !== idx) }))
              }}
              className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              title="Удалить"
            >
              ✕
            </button>
          </div>
        ))}
      </section>

      <section className="bg-white border rounded p-4 space-y-3">
        <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-lg">Доп. опции (Шаг 4)</h2>
          <button
            onClick={() => {
              const newOption = { id: `option-${Date.now()}`, name: 'Новая опция', price: 0 }
              setCfg((c: any) => ({ ...c, additionalOptions: [...c.additionalOptions, newOption] }))
            }}
            className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700"
          >
            + Добавить
          </button>
        </div>
        <input className="border rounded px-3 py-2 w-full" placeholder="Заголовок шага" value={cfg.stepTexts.step4Title} onChange={e => update('stepTexts.step4Title', e.target.value)} />
        {cfg.additionalOptions.map((o: any, idx: number) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input className="border rounded px-3 py-2" placeholder="ID" value={o.id} onChange={e => update(`additionalOptions.${idx}.id`, e.target.value)} />
            <input className="border rounded px-3 py-2" placeholder="Название" value={o.name} onChange={e => update(`additionalOptions.${idx}.name`, e.target.value)} />
            <input type="number" className="border rounded px-3 py-2" placeholder="Цена" value={o.price} onChange={e => update(`additionalOptions.${idx}.price`, Number(e.target.value))} />
            <button
              onClick={() => {
                setCfg((c: any) => ({ ...c, additionalOptions: c.additionalOptions.filter((_: any, i: number) => i !== idx) }))
              }}
              className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              title="Удалить"
            >
              ✕
            </button>
          </div>
        ))}
      </section>

      <section className="bg-white border rounded p-4 space-y-3">
        <h2 className="font-semibold text-lg">Логика расчёта</h2>
        <textarea className="w-full border rounded px-3 py-2" rows={5} value={cfg.formula} onChange={e => update('formula', e.target.value)} />
      </section>

      <section className="bg-white border rounded p-4 space-y-3">
        <h2 className="font-semibold text-lg">Шаблоны</h2>
        <textarea className="w-full border rounded px-3 py-2" rows={4} placeholder="MAX шаблон" value={cfg.whatsappTemplate} onChange={e => update('whatsappTemplate', e.target.value)} />
        <textarea className="w-full border rounded px-3 py-2" rows={4} placeholder="Шаблон сметы" value={cfg.estimateTemplate} onChange={e => update('estimateTemplate', e.target.value)} />
      </section>
    </div>
  )
}


