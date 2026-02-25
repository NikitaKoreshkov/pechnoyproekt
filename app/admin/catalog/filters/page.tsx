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

type Section = {
  id: string
  title: string
  slug: string
  subsections: {
    id: string
    title: string
    slug: string
    sectionId: string
    subsubsections?: { id: string; title: string; slug: string }[]
  }[]
}

export default function CatalogFiltersEditorPage() {
  const [sections, setSections] = useState<Section[]>([])
  const [selected, setSelected] = useState<{ type: 'global' | 'section' | 'subsection' | 'subsubsection'; sectionId?: string; subsectionId?: string; subsubsectionId?: string; title: string } | null>(null)
  const [cfg, setCfg] = useState<{ id: string; config: FiltersConfig; sectionId?: string | null; subsectionId?: string | null } | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingFilters, setLoadingFilters] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<'range' | 'checkboxes' | 'radio'>('checkboxes')

  const loadSections = async () => {
    try {
      const res = await fetch('/api/admin/catalog/sections', { cache: 'no-store', credentials: 'include' })
      if (res.ok) setSections(await res.json())
    } catch (e) {
      console.error('Error loading sections:', e)
    }
  }

  const loadFilters = async (sectionId?: string | null, subsectionId?: string, subsubsectionId?: string) => {
    setLoadingFilters(true)
    try {
      const params = new URLSearchParams()
      if (sectionId) params.set('sectionId', sectionId)
      if (subsectionId) params.set('subsectionId', subsectionId)
      if (subsubsectionId) params.set('subsubsectionId', subsubsectionId)
      // Без параметров — глобальные фильтры
      const res = await fetch(`/api/admin/catalog/filters?${params}`, { cache: 'no-store', credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setCfg({ id: data.id, config: data.config || {}, sectionId: data.sectionId, subsectionId: data.subsectionId })
      } else {
        setCfg({ id: '', config: {}, sectionId: sectionId || null, subsectionId: subsectionId || null })
      }
    } catch (e) {
      console.error('Error loading filters:', e)
      setCfg(null)
    } finally {
      setLoadingFilters(false)
    }
  }

  useEffect(() => {
    loadSections()
  }, [])

  useEffect(() => {
    if (selected) {
      if (selected.type === 'global') {
        loadFilters(null, undefined, undefined)
      } else if (selected.type === 'section' && selected.sectionId) {
        loadFilters(selected.sectionId, undefined, undefined)
      } else if (selected.type === 'subsection' && selected.subsectionId) {
        const sec = sections.flatMap(s => s.subsections).find(sb => sb.id === selected.subsectionId)
        loadFilters(sec?.sectionId, selected.subsectionId, undefined)
      } else if (selected.type === 'subsubsection' && selected.subsubsectionId) {
        const allSubs = sections.flatMap(s => s.subsections)
        const subsub = allSubs.flatMap(sb => (sb.subsubsections || []).map(ss => ({ ...ss, _subsectionId: sb.id, _sectionId: sb.sectionId })))
          .find(ss => ss.id === selected.subsubsectionId)
        if (subsub) loadFilters(subsub._sectionId, subsub._subsectionId, selected.subsubsectionId)
      }
    } else {
      setCfg(null)
    }
  }, [selected, sections])

  const selectGlobal = () => {
    setSelected({ type: 'global', title: 'Глобальные (по умолчанию)' })
  }

  const selectSection = (s: Section) => {
    setSelected({ type: 'section', sectionId: s.id, title: s.title })
  }

  const selectSubsection = (s: Section, sb: { id: string; title: string }) => {
    setSelected({ type: 'subsection', sectionId: s.id, subsectionId: sb.id, title: `${s.title} → ${sb.title}` })
  }

  const selectSubsubsection = (s: Section, sb: { id: string; title: string }, ss: { id: string; title: string }) => {
    setSelected({ type: 'subsubsection', sectionId: s.id, subsectionId: sb.id, subsubsectionId: ss.id, title: `${s.title} → ${sb.title} → ${ss.title}` })
  }

  const updateFilter = (key: keyof FiltersConfig, updates: Partial<FilterConfig>) => {
    if (!cfg) return
    setCfg({
      ...cfg,
      config: { ...cfg.config, [key]: { ...cfg.config[key], ...updates } as FilterConfig }
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
    updateFilter(key, { options: [...filter.options, { label: '', value: '' }] })
  }

  const removeOption = (key: keyof FiltersConfig, index: number) => {
    if (!cfg || !cfg.config[key]?.options) return
    const filter = cfg.config[key]!
    updateFilter(key, { options: filter.options!.filter((_, i) => i !== index) })
  }

  const updateOption = (key: keyof FiltersConfig, index: number, field: 'label' | 'value', value: string | number) => {
    if (!cfg || !cfg.config[key]?.options) return
    const filter = cfg.config[key]!
    const newOptions = [...filter.options!]
    newOptions[index] = { ...newOptions[index], [field]: value }
    updateFilter(key, { options: newOptions })
  }

  const save = async () => {
    if (!cfg || !selected) return
    setLoading(true)
    try {
      const clean = JSON.parse(JSON.stringify(cfg.config || {}))
      const body: any = { config: clean }
      if (selected.type === 'section' && selected.sectionId) body.sectionId = selected.sectionId
      if ((selected.type === 'subsection' || selected.type === 'subsubsection') && selected.subsectionId) body.subsectionId = selected.subsectionId

      const res = await fetch('/api/admin/catalog/filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
        credentials: 'include'
      })
      if (res.ok) {
        const result = await res.json()
        setCfg({ id: result.id, config: result.config, sectionId: result.sectionId, subsectionId: result.subsectionId })
        alert('✅ Фильтры сохранены!')
      } else {
        const err = await res.json().catch(() => ({}))
        alert(`❌ Ошибка: ${err.error || 'Не удалось сохранить'}`)
      }
    } catch (err) {
      alert(`❌ ${err instanceof Error ? err.message : 'Ошибка сети'}`)
    } finally {
      setLoading(false)
    }
  }

  const filterKeys = cfg ? Object.keys(cfg.config) : []

  return (
    <div className="space-y-6">
      <AdminTopBar
        title="Фильтры каталога"
        backHref="/admin/catalog"
        actions={
          selected && (
            <button
              onClick={save}
              disabled={loading}
              className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          )
        }
      />

      <p className="text-gray-600 text-sm">
        Выберите раздел или подраздел — откроются фильтры для этого раздела. У каждого раздела и подраздела свои фильтры.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Дерево разделов */}
        <div className="bg-white border rounded-xl p-4 space-y-2 max-h-[600px] overflow-y-auto">
          <h3 className="font-semibold text-gray-900 mb-3">Разделы и подразделы</h3>
          <button
            onClick={selectGlobal}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition mb-2 ${
              selected?.type === 'global' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'hover:bg-gray-100 border border-transparent'
            }`}
          >
            🌐 Глобальные (по умолчанию)
          </button>
          {sections.length === 0 && <p className="text-gray-500 text-sm">Нет разделов. Создайте их в «Настройка каталога».</p>}
          {sections.map((s) => (
            <div key={s.id} className="space-y-1">
              <button
                onClick={() => selectSection(s)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                  selected?.type === 'section' && selected?.sectionId === s.id
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'hover:bg-gray-100 border border-transparent'
                }`}
              >
                📁 {s.title}
              </button>
              <div className="pl-3 space-y-1">
                {(s.subsections || []).map((sb) => (
                  <div key={sb.id}>
                    <button
                      onClick={() => selectSubsection(s, sb)}
                      className={`w-full text-left px-3 py-1.5 rounded text-sm transition ${
                        selected?.type === 'subsection' && selected?.subsectionId === sb.id
                          ? 'bg-amber-100 text-amber-900'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      📂 {sb.title}
                    </button>
                    <div className="pl-3">
                      {((sb as any).subsubsections || []).map((ss: { id: string; title: string }) => (
                        <button
                          key={ss.id}
                          onClick={() => selectSubsubsection(s, sb, ss)}
                          className={`w-full text-left px-2 py-1 rounded text-xs transition ${
                            selected?.type === 'subsubsection' && selected?.subsubsectionId === ss.id
                              ? 'bg-amber-100 text-amber-900'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          📄 {ss.title}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Редактор фильтров */}
        <div className="lg:col-span-2 space-y-4">
          {!selected && (
            <div className="bg-gray-50 border rounded-xl p-8 text-center text-gray-500">
              Выберите раздел или подраздел слева, чтобы настроить фильтры
            </div>
          )}
          {selected && loadingFilters && (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            </div>
          )}
          {selected && !loadingFilters && cfg && (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <span className="font-medium text-amber-900">Фильтры для: {selected.title}</span>
              </div>

              {/* Добавить фильтр */}
              <div className="bg-white border rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ключ</label>
                    <input className="w-full border rounded px-3 py-2 text-sm" placeholder="например: material" value={newKey} onChange={(e) => setNewKey(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                    <input className="w-full border rounded px-3 py-2 text-sm" placeholder="Отображаемое имя" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Тип</label>
                    <select className="w-full border rounded px-3 py-2 text-sm" value={newType} onChange={(e) => setNewType(e.target.value as any)}>
                      <option value="checkboxes">Мультивыбор</option>
                      <option value="radio">Один вариант</option>
                      <option value="range">Диапазон</option>
                    </select>
                  </div>
                  <div>
                    <button onClick={addFilterSection} className="w-full px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 text-sm">Добавить фильтр</button>
                  </div>
                </div>
              </div>

              {filterKeys.map((key) => {
                const filter = cfg.config[key]
                if (!filter) return null
                return (
                  <div key={key} className="bg-white border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium text-gray-900">{key}</span>
                      <button onClick={() => removeFilterSection(key)} className="text-red-600 border border-red-200 rounded px-2 py-1 text-sm hover:bg-red-50">Удалить</button>
                    </div>
                    <div className="mb-3">
                      <label className="block text-sm text-gray-600 mb-1">Название</label>
                      <input
                        className="w-full border rounded px-3 py-2 text-sm"
                        value={filter.title || ''}
                        onChange={(e) => updateFilter(key, { title: e.target.value })}
                      />
                    </div>
                    {filter.type === 'range' ? (
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Мин</label>
                          <input type="number" className="w-full border rounded px-2 py-1.5 text-sm" value={filter.min ?? ''} onChange={(e) => updateFilter(key, { min: e.target.value ? Number(e.target.value) : undefined })} />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Макс</label>
                          <input type="number" className="w-full border rounded px-2 py-1.5 text-sm" value={filter.max ?? ''} onChange={(e) => updateFilter(key, { max: e.target.value ? Number(e.target.value) : undefined })} />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Шаг</label>
                          <input type="number" className="w-full border rounded px-2 py-1.5 text-sm" value={filter.step ?? ''} onChange={(e) => updateFilter(key, { step: e.target.value ? Number(e.target.value) : undefined })} />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-sm text-gray-600">Опции</label>
                          <button onClick={() => addOption(key)} className="px-2 py-1 text-xs border rounded hover:bg-gray-50">+ Добавить</button>
                        </div>
                        {(filter.options || []).map((opt, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <input className="flex-1 border rounded px-2 py-1.5 text-sm" placeholder="Текст" value={opt.label || ''} onChange={(e) => updateOption(key, idx, 'label', e.target.value)} />
                            <input className="flex-1 border rounded px-2 py-1.5 text-sm" placeholder="Значение" value={opt.value ?? ''} onChange={(e) => updateOption(key, idx, 'value', typeof opt.value === 'number' ? Number(e.target.value) : e.target.value)} />
                            <button onClick={() => removeOption(key, idx)} className="text-red-600 text-sm hover:underline">Удалить</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
