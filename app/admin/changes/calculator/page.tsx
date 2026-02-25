'use client'

import { useEffect, useState } from 'react'
import AdminTopBar from '@/components/admin/AdminTopBar'
import ImageUploader from '@/components/admin/ImageUploader'

type Variant = 'standard' | 'vip'
type OptionType = 'main' | 'extra'

interface CalcOption {
  id: string
  variant: string
  optionType: string
  name: string
  price: number
  image: string
  sortOrder: number
}

interface CalcData {
  standard: { main: CalcOption[]; extra: CalcOption[] }
  vip: { main: CalcOption[]; extra: CalcOption[] }
}

const TABS: { key: string; label: string }[] = [
  { key: 'standard-main', label: 'Стандарт — мангалы' },
  { key: 'standard-extra', label: 'Стандарт — секции' },
  { key: 'vip-main', label: 'ВИП — мангалы' },
  { key: 'vip-extra', label: 'ВИП — секции' },
]

function parseTab(key: string): { variant: Variant; optionType: OptionType } {
  const [variant, optionType] = key.split('-') as [Variant, OptionType]
  return { variant, optionType }
}

export default function CalculatorEditorPage() {
  const [data, setData] = useState<CalcData | null>(null)
  const [tab, setTab] = useState('standard-main')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/calculator/barbecue', { cache: 'no-store', credentials: 'include' })
      if (res.ok) {
        const d = await res.json()
        setData(d)
      }
    } catch (e) {
      console.error(e)
      alert('Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const { variant, optionType } = parseTab(tab)
  const options = data?.[variant]?.[optionType] ?? []

  const updateOption = (id: string, field: keyof CalcOption, value: unknown) => {
    setData((prev) => {
      if (!prev) return prev
      const arr = [...prev[variant][optionType]]
      const idx = arr.findIndex((o) => o.id === id)
      if (idx < 0) return prev
      arr[idx] = { ...arr[idx], [field]: value }
      return { ...prev, [variant]: { ...prev[variant], [optionType]: arr } }
    })
  }

  const saveOption = async (opt: CalcOption) => {
    setSaving(opt.id)
    try {
      const res = await fetch(`/api/admin/calculator/barbecue/${opt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: opt.name,
          price: opt.price,
          image: opt.image,
          sortOrder: opt.sortOrder,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setData((prev) => {
          if (!prev) return prev
          const arr = prev[variant][optionType].map((o) => (o.id === opt.id ? updated : o))
          return { ...prev, [variant]: { ...prev[variant], [optionType]: arr } }
        })
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Ошибка сохранения')
      }
    } catch (e) {
      console.error(e)
      alert('Ошибка сети')
    } finally {
      setSaving(null)
    }
  }

  const deleteOption = async (opt: CalcOption) => {
    if (!confirm(`Удалить «${opt.name}»?`)) return
    setSaving(opt.id)
    try {
      const res = await fetch(`/api/admin/calculator/barbecue/${opt.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        setData((prev) => {
          if (!prev) return prev
          const arr = prev[variant][optionType].filter((o) => o.id !== opt.id)
          return { ...prev, [variant]: { ...prev[variant], [optionType]: arr } }
        })
      } else {
        alert('Ошибка удаления')
      }
    } catch (e) {
      console.error(e)
      alert('Ошибка сети')
    } finally {
      setSaving(null)
    }
  }

  const addOption = async () => {
    const name = optionType === 'main' ? 'Новый мангал' : 'Новая секция'
    const maxOrder = options.length ? Math.max(...options.map((o) => o.sortOrder)) : -1

    setSaving('new')
    try {
      const res = await fetch('/api/admin/calculator/barbecue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          variant,
          optionType,
          name,
          price: 0,
          image: '',
          sortOrder: maxOrder + 1,
        }),
      })
      if (res.ok) {
        const created = await res.json()
        setData((prev) => {
          if (!prev) return prev
          const arr = [...prev[variant][optionType], created]
          return { ...prev, [variant]: { ...prev[variant], [optionType]: arr } }
        })
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Ошибка создания')
      }
    } catch (e) {
      console.error(e)
      alert('Ошибка сети')
    } finally {
      setSaving(null)
    }
  }

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <AdminTopBar title="Калькулятор барбекю" backHref="/admin/changes" />
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminTopBar title="Калькулятор барбекю" backHref="/admin/changes" />

      <p className="text-gray-600 text-sm">
        Мангалы и секции для калькулятора на главной. Секции: формат «Тип Вариант» (например «Кирпичный тандыр Белый») — так они группируются по типам.
      </p>

      <div className="flex flex-wrap gap-2 border-b pb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              tab === t.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <section className="bg-white border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">
            {tab === 'standard-main' && 'Мангалы (Стандарт)'}
            {tab === 'standard-extra' && 'Секции (Стандарт)'}
            {tab === 'vip-main' && 'Мангалы (ВИП)'}
            {tab === 'vip-extra' && 'Секции (ВИП)'}
          </h2>
          <button
            onClick={addOption}
            disabled={saving === 'new'}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {saving === 'new' ? 'Создание...' : '+ Добавить'}
          </button>
        </div>

        <div className="space-y-4">
          {options.map((opt) => (
            <div
              key={opt.id}
              className="border rounded-lg p-4 bg-gray-50/50 space-y-3"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                <div className="md:col-span-5">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Название</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={opt.name}
                    onChange={(e) => updateOption(opt.id, 'name', e.target.value)}
                    onBlur={(e) => saveOption({ ...opt, name: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Цена (₽)</label>
                  <input
                    type="number"
                    className="w-full border rounded px-3 py-2"
                    value={opt.price}
                    onChange={(e) => updateOption(opt.id, 'price', Number(e.target.value))}
                    onBlur={(e) => saveOption({ ...opt, price: Number(e.target.value) })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Порядок</label>
                  <input
                    type="number"
                    className="w-full border rounded px-3 py-2"
                    value={opt.sortOrder}
                    onChange={(e) => updateOption(opt.id, 'sortOrder', Number(e.target.value))}
                    onBlur={(e) => saveOption({ ...opt, sortOrder: Number(e.target.value) })}
                  />
                </div>
                <div className="md:col-span-2 flex items-end gap-2">
                  <button
                    onClick={() => saveOption(opt)}
                    disabled={saving === opt.id}
                    className="px-3 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 disabled:opacity-50"
                  >
                    {saving === opt.id ? '…' : 'Сохранить'}
                  </button>
                  <button
                    onClick={() => deleteOption(opt)}
                    disabled={saving === opt.id}
                    className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    title="Удалить"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Изображение</label>
                <ImageUploader
                  value={opt.image}
                  onChange={(url) => {
                    updateOption(opt.id, 'image', url)
                    saveOption({ ...opt, image: url })
                  }}
                  placeholder="URL или загрузить"
                />
              </div>
            </div>
          ))}
        </div>

        {options.length === 0 && (
          <p className="text-gray-500 py-8 text-center">Нет элементов. Нажмите «+ Добавить».</p>
        )}
      </section>
    </div>
  )
}
