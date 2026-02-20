'use client'

import { useEffect, useState } from 'react'
import AdminTopBar from '@/components/admin/AdminTopBar'
import ImageUploader from '@/components/admin/ImageUploader'
import AdditionalImagesField from '@/components/admin/AdditionalImagesField'

export default function PopularEditPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [materialOptions, setMaterialOptions] = useState<any[]>([])
  const [completionOptions, setCompletionOptions] = useState<any[]>([])
  const [dynamicFiltersConfig, setDynamicFiltersConfig] = useState<any>({})
  const [catalogSections, setCatalogSections] = useState<{ id: string; title: string; subsections: { id: string; sectionId: string; title: string }[] }[]>([])

  const loadCatalogSections = async () => {
    try {
      const res = await fetch('/api/admin/catalog/sections', { cache: 'no-store' })
      if (res.ok) setCatalogSections(await res.json())
    } catch (err) {
      console.error('Error loading catalog sections:', err)
    }
  }

  const loadFilters = async () => {
    try {
      const res = await fetch('/api/admin/catalog/filters', { cache: 'no-store' })
      if (res.ok) {
        const filterData = await res.json()
        if (filterData.config?.material?.options) {
          setMaterialOptions(filterData.config.material.options)
        }
        if (filterData.config?.completion?.options) {
          setCompletionOptions(filterData.config.completion.options.filter((opt: any) => opt.value !== ''))
        }
        
        // Загружаем динамические фильтры (все кроме известных)
        const knownKeys = new Set(['price', 'area', 'material', 'buildTime', 'features', 'completion'])
        const dynamicFilters: any = {}
        Object.keys(filterData.config || {}).forEach(key => {
          if (!knownKeys.has(key) && filterData.config[key]) {
            dynamicFilters[key] = filterData.config[key]
          }
        })
        setDynamicFiltersConfig(dynamicFilters)
      }
    } catch (err) {
      console.error('Error loading filters:', err)
    }
  }

  const load = async () => {
    const res = await fetch(`/api/admin/popular/${params.id}`, { cache: 'no-store' })
    if (res.ok) {
      const item = await res.json()
      console.log('[ADMIN POPULAR] Loaded item data:', item)
      console.log('[ADMIN POPULAR] filterValues:', item.filterValues)
      console.log('[ADMIN POPULAR] specs:', item.specs, 'type:', typeof item.specs)
      // Убеждаемся, что filterValues всегда есть
      if (!item.filterValues) {
        item.filterValues = {}
      }
      // Если specs это объект, оставляем как есть, если null - пустой объект
      if (item.specs === null || item.specs === undefined) {
        item.specs = {}
      }
      if (!item.specs.fieldPanelMap) {
        item.specs.fieldPanelMap = { area: null, buildTime: null, material: null }
      }
      setData(item)
    }
  }
  
  useEffect(() => { 
    load()
    loadFilters()
    loadCatalogSections()
  }, [params.id])

  // Связь полей с панелями: при изменении поля обновляем выбранную панель и наоборот
  const setFieldPanel = (field: 'area' | 'buildTime' | 'material', panelIdx: number | null) => {
    setData((d: any) => {
      const spec = JSON.parse(JSON.stringify(d.specs || {}))
      if (!spec.fieldPanelMap) spec.fieldPanelMap = { area: null, buildTime: null, material: null }
      spec.fieldPanelMap[field] = panelIdx
      // При первой привязке: подтягиваем значение из панели в поле
      if (panelIdx !== null && spec.pricePanels?.[panelIdx]?.options?.[0]) {
        const opt = spec.pricePanels[panelIdx].options[0]
        const val = opt.label ?? ''
        const numVal = parseFloat(String(val))
        if (field === 'area' && !isNaN(numVal)) d = { ...d, area: numVal }
        else if (field === 'buildTime' && !isNaN(numVal)) d = { ...d, buildTime: numVal }
        else if (field === 'material') d = { ...d, material: val }
      }
      return { ...d, specs: spec }
    })
  }

  const updateFieldAndSync = (field: string, value: any) => {
    setData((d: any) => {
      const next = { ...d, [field]: value }
      const map = d.specs?.fieldPanelMap || {}
      if (field === 'priceFrom') {
        const areaPanelIdx = map.area
        if (areaPanelIdx != null && d.specs?.pricePanels?.[areaPanelIdx]?.isMainPrice) {
          const spec = JSON.parse(JSON.stringify(next.specs || {}))
          const panel = spec.pricePanels[areaPanelIdx]
          if (panel.options?.length) panel.options[0] = { ...panel.options[0], price: Number(value) || 0 }
          next.specs = spec
        }
        return next
      }
      const panelIdx = map[field === 'area' ? 'area' : field === 'buildTime' ? 'buildTime' : field === 'material' ? 'material' : null]
      if (panelIdx != null && d.specs?.pricePanels?.[panelIdx]) {
        const spec = JSON.parse(JSON.stringify(next.specs || {}))
        const panel = spec.pricePanels[panelIdx]
        const priceVal = field === 'area' && panel.isMainPrice ? Number(next.priceFrom) || 0 : undefined
        if (panel.options?.length) {
          if (field === 'area' && panel.isMainPrice) {
            panel.options[0] = { ...panel.options[0], label: String(value), price: priceVal ?? panel.options[0].price }
          } else {
            panel.options[0] = { ...panel.options[0], label: String(value), modifier: panel.options[0].modifier ?? 0 }
          }
        } else {
          panel.options = [{ label: String(value), ...(panel.isMainPrice ? { price: priceVal ?? 0 } : { modifier: 0 }) }]
        }
        next.specs = spec
      }
      return next
    })
  }

  const updatePanelOption = (pIdx: number, oIdx: number, upd: Partial<{ label: string; price: number; modifier: number; description: string; technicalSpecs: string }>) => {
    setData((d: any) => {
      const spec = JSON.parse(JSON.stringify(d.specs || {}))
      if (!spec.pricePanels?.[pIdx]?.options) return d
      spec.pricePanels[pIdx].options[oIdx] = { ...spec.pricePanels[pIdx].options[oIdx], ...upd }
      const map = spec.fieldPanelMap || {}
      const field = Object.entries(map).find(([, v]) => v === pIdx)?.[0]
      if (field && oIdx === 0) {
        const opt = spec.pricePanels[pIdx].options[0]
        const val = opt?.label ?? ''
        const numVal = parseFloat(String(val))
        if (field === 'area') {
          d = { ...d, area: !isNaN(numVal) ? numVal : d.area }
          if (spec.pricePanels[pIdx].isMainPrice && typeof opt?.price === 'number') d = { ...d, priceFrom: opt.price }
        } else if (field === 'buildTime') d = { ...d, buildTime: !isNaN(numVal) ? numVal : d.buildTime }
        else if (field === 'material') d = { ...d, material: val }
      }
      return { ...d, specs: spec }
    })
  }

  const save = async () => {
    setSaving(true)
    try {
      // Если specs это строка, пытаемся распарсить перед сохранением
      let specsToSave = data.specs
      if (typeof data.specs === 'string') {
        const value = data.specs.trim()
        if (!value) {
          specsToSave = {}
        } else {
          try {
            specsToSave = JSON.parse(value)
          } catch (err) {
            // Пытаемся исправить простые ошибки
            let fixed = value
            try {
              // Добавляем фигурные скобки если их нет
              if (!fixed.startsWith('{') && !fixed.startsWith('[')) {
                fixed = '{' + fixed
              }
              if (!fixed.endsWith('}') && !fixed.endsWith(']')) {
                fixed = fixed + '}'
              }
              // Пытаемся добавить кавычки вокруг ключей если их нет
              fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
              specsToSave = JSON.parse(fixed)
            } catch (err2) {
              alert('⚠️ Ошибка в формате JSON в технических характеристиках:\n' + err2.message + '\n\nИсправьте формат перед сохранением.')
              setSaving(false)
              return
            }
          }
        }
      }
      
      // Автогенерация названия из диаметра, длины и материала
      const generatedTitle = data.title || `${data.material || 'ПНД'} ${data.area || ''}мм SDR11 (${data.buildTime || ''}м)`
      
      const payload = {
        title: generatedTitle,
        area: data.area,
        priceFrom: data.priceFrom,
        priceTo: null, // Убираем вторую цену
        floors: 1, // Значение по умолчанию
        material: data.material,
        buildTime: data.buildTime,
        completion: 'под ключ', // Значение по умолчанию
        region: 'Москва', // Значение по умолчанию
        image: data.image || '/images/1.png',
        images: data.images || [],
        tags: data.tags || [],
        features: data.features || [],
        description: data.description || null,
        advantages: data.advantages || [],
        technicalSpecs: data.technicalSpecs || null,
        specs: specsToSave,
        filterValues: (data.filterValues && Object.keys(data.filterValues).length > 0) ? data.filterValues : (data.filterValues === null ? null : {}),
        order: data.order || 0,
        subsectionId: data.subsectionId && String(data.subsectionId).trim() ? data.subsectionId : null,
        subsubsectionId: data.subsubsectionId && String(data.subsubsectionId).trim() ? data.subsubsectionId : null
      }
      console.log('[SAVE POPULAR] data.filterValues:', data.filterValues)
      console.log('[SAVE POPULAR] payload.filterValues:', payload.filterValues)
      console.log('[SAVE POPULAR] payload.specs:', payload.specs, 'type:', typeof payload.specs)
      console.log('[SAVE POPULAR] Sending PATCH request:', payload)
      const res = await fetch(`/api/admin/popular/${params.id}`, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      })
      console.log('[SAVE POPULAR] Response status:', res.status)
      setSaving(false)
      if (res.ok) {
        const result = await res.json()
        console.log('[SAVE POPULAR] Success:', result)
        // Принудительно перезагружаем данные
        const reloadedData = await fetch(`/api/admin/popular/${params.id}`, { cache: 'no-store' })
          .then(r => r.json())
        console.log('[SAVE POPULAR] Reloaded data:', reloadedData)
        console.log('[SAVE POPULAR] Reloaded specs:', reloadedData.specs, 'type:', typeof reloadedData.specs)
        // Убеждаемся, что specs правильно обрабатывается
        if (!reloadedData.specs) {
          reloadedData.specs = {}
        }
        if (!reloadedData.filterValues) {
          reloadedData.filterValues = {}
        }
        setData(reloadedData)
        try {
          if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            const ch = new BroadcastChannel('projects-updated')
            ch.postMessage({ type: 'projects-updated', ts: Date.now() })
            ch.close()
          }
          // Fallback для кросс-вкладок: событие storage
          try { localStorage.setItem('projects-updated', String(Date.now())) } catch {}
        } catch {}
        alert('✅ Популярный проект успешно сохранен!')
      } else {
        const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        console.error('[SAVE POPULAR] Error:', errorData)
        console.error('[SAVE POPULAR] Error details:', errorData.details)
        console.error('[SAVE POPULAR] Error code:', errorData.code)
        console.error('[SAVE POPULAR] Error meta:', errorData.meta)
        const errorMessage = errorData.details || errorData.error || 'Неизвестная ошибка'
        alert(`❌ Ошибка сохранения: ${errorMessage}\n\nКод: ${errorData.code || 'N/A'}`)
      }
    } catch (err) {
      console.error('[SAVE POPULAR] Exception:', err)
      setSaving(false)
      alert(`❌ Ошибка: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`)
    }
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      <AdminTopBar 
        title={`Редактирование: ${data.title || 'Популярный проект'}`} 
        backHref="/admin/catalog" 
        actions={
          <button 
            onClick={save} 
            disabled={saving} 
            className="px-3 py-1.5 bg-gray-900 text-white rounded disabled:opacity-50"
          >
            Сохранить
          </button>
        } 
      />

      {/* Основная информация */}
      <section className="bg-white border rounded p-4 space-y-4">
        <h2 className="text-lg font-semibold">Основная информация</h2>

        {/* Название */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Название товара</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="text"
            placeholder="Например: Насос погружной скважинный"
            value={data.title || ''}
            onChange={e => setData((d: any) => ({ ...d, title: e.target.value }))}
          />
          <p className="text-xs text-gray-500 mt-1">Если оставить пустым — название сгенерируется из диаметра, длины и материала.</p>
        </div>

        {/* Фото */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Фото товара</label>
          <ImageUploader
            value={data.image || ''}
            onChange={(url) => setData((d: any) => ({ ...d, image: url || '/images/1.png' }))}
            placeholder="URL или загрузить файл"
          />
          <p className="text-xs text-gray-500 mt-1">Основное изображение карточки. Можно вставить URL или загрузить файл. Кнопка «Удалить» сбрасывает на дефолтное.</p>
        </div>

        {/* Дополнительные изображения */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Дополнительные изображения</label>
          <AdditionalImagesField
            value={data.images || []}
            onChange={(urls) => setData((d: any) => ({ ...d, images: urls }))}
            placeholder="URL или загрузить"
          />
        </div>

        {/* Раздел, подраздел и подраздел подраздела каталога */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <h3 className="text-sm font-medium text-gray-800 mb-2">Раздел, подраздел и подраздел подраздела</h3>
          {(() => {
            const sections = catalogSections || []
            const allSubsections = sections.flatMap((s: any) => (s.subsections || []).map((sb: any) => ({ ...sb, _sectionId: s.id })))
            const allSubsubsections = allSubsections.flatMap((sb: any) => (sb.subsubsections || []).map((ss: any) => ({ ...ss, _subsectionId: sb.id, _sectionId: sb._sectionId })))
            let currentSectionId = data._sectionId || ''
            let currentSubsectionId = data._subsectionId || data.subsectionId || ''
            if (data.subsubsectionId) {
              const ss = allSubsubsections.find((x: any) => x.id === data.subsubsectionId)
              if (ss) { currentSubsectionId = ss._subsectionId; currentSectionId = ss._sectionId }
            } else if (data.subsectionId) {
              const sb = allSubsections.find((x: any) => x.id === data.subsectionId)
              if (sb) currentSectionId = sb._sectionId
            }
            const subsections = currentSectionId ? (sections.find((s: any) => s.id === currentSectionId)?.subsections || []) : []
            const subsubsections = currentSubsectionId ? (subsections.find((sb: any) => sb.id === currentSubsectionId)?.subsubsections || []) : []
            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Раздел</label>
                  <select
                    className="w-full border rounded px-3 py-2 bg-white"
                    value={currentSectionId}
                    onChange={e => setData((d: any) => ({ ...d, _sectionId: e.target.value || '', _subsectionId: '', subsectionId: null, subsubsectionId: null }))}
                  >
                    <option value="">— Не выбран —</option>
                    {sections.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Подраздел</label>
                  <select
                    className="w-full border rounded px-3 py-2 bg-white"
                    value={currentSubsectionId}
                    onChange={e => {
                      const val = e.target.value || null
                      setData((d: any) => ({ ...d, _subsectionId: val || '', subsectionId: val, subsubsectionId: null }))
                    }}
                    disabled={!currentSectionId}
                  >
                    <option value="">— Не выбран —</option>
                    {subsections.map((sb: any) => (
                      <option key={sb.id} value={sb.id}>{sb.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Подраздел подраздела</label>
                  <select
                    className="w-full border rounded px-3 py-2 bg-white"
                    value={data.subsubsectionId || ''}
                    onChange={e => {
                      const val = e.target.value || null
                      setData((d: any) => ({ ...d, subsubsectionId: val || null, subsectionId: val ? null : (currentSubsectionId || null) }))
                    }}
                    disabled={!currentSubsectionId}
                  >
                    <option value="">— Не выбран —</option>
                    {subsubsections.map((ss: any) => (
                      <option key={ss.id} value={ss.id}>{ss.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            )
          })()}
        </div>
        
        <p className="text-sm text-gray-500 mb-3">Выберите панель, из которой брать значение для характеристики. Сначала создайте панели ниже.</p>

        {/* Диаметр */}
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Диаметр (мм)</label>
            <input 
              className="w-full border rounded px-3 py-2" 
              type="number" 
              placeholder="Введите диаметр в миллиметрах" 
              value={data.area || ''} 
              onChange={e => updateFieldAndSync('area', Number(e.target.value))} 
            />
          </div>
          <div className="w-52 pt-6">
            <label className="block text-xs text-gray-500 mb-1">Брать из панели</label>
            <select
              className="w-full border rounded px-3 py-2 text-sm"
              value={data.specs?.fieldPanelMap?.area ?? ''}
              onChange={e => setFieldPanel('area', e.target.value === '' ? null : Number(e.target.value))}
            >
              <option value="">— Не выбрано —</option>
              {(data.specs?.pricePanels || []).map((p: any, i: number) => (
                <option key={i} value={i}>{p.title || `Панель ${i + 1}`}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Длина */}
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Длина (м)</label>
            <input 
              className="w-full border rounded px-3 py-2" 
              type="number" 
              placeholder="Введите длину в метрах" 
              value={data.buildTime || ''} 
              onChange={e => updateFieldAndSync('buildTime', Number(e.target.value))} 
            />
          </div>
          <div className="w-52 pt-6">
            <label className="block text-xs text-gray-500 mb-1">Брать из панели</label>
            <select
              className="w-full border rounded px-3 py-2 text-sm"
              value={data.specs?.fieldPanelMap?.buildTime ?? ''}
              onChange={e => setFieldPanel('buildTime', e.target.value === '' ? null : Number(e.target.value))}
            >
              <option value="">— Не выбрано —</option>
              {(data.specs?.pricePanels || []).map((p: any, i: number) => (
                <option key={i} value={i}>{p.title || `Панель ${i + 1}`}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Материал */}
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Материал</label>
            <input 
              className="w-full border rounded px-3 py-2" 
              type="text"
              placeholder="Введите материал" 
              value={data.material || ''} 
              onChange={e => updateFieldAndSync('material', e.target.value)}
            />
          </div>
          <div className="w-52 pt-6">
            <label className="block text-xs text-gray-500 mb-1">Брать из панели</label>
            <select
              className="w-full border rounded px-3 py-2 text-sm"
              value={data.specs?.fieldPanelMap?.material ?? ''}
              onChange={e => setFieldPanel('material', e.target.value === '' ? null : Number(e.target.value))}
            >
              <option value="">— Не выбрано —</option>
              {(data.specs?.pricePanels || []).map((p: any, i: number) => (
                <option key={i} value={i}>{p.title || `Панель ${i + 1}`}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Цена */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Цена (₽)</label>
          <input 
            className="w-full border rounded px-3 py-2" 
            type="number" 
            placeholder="Введите цену в рублях" 
            value={data.priceFrom || ''} 
            onChange={e => updateFieldAndSync('priceFrom', Number(e.target.value))} 
          />
          <p className="text-xs text-gray-500 mt-1">Базовая цена. Для панели «главная цена» значение берётся из первой опции.</p>
        </div>
      </section>

      {/* Панели цен: главная цена + доп. модификаторы */}
      <section className="bg-white border rounded p-4 space-y-4">
        <h2 className="text-lg font-semibold">Панели выбора (главная цена и доплаты)</h2>
        <p className="text-sm text-gray-600">Создайте панели для страницы товара. Одна панель — <strong>главная цена</strong> (выбор задаёт базовую цену). Остальные — <strong>доп. цена</strong> (модификатор ± к выбранной главной цене).</p>
        {(data.specs?.pricePanels || []).map((panel: any, pIdx: number) => (
          <div key={pIdx} className="border rounded-lg p-4 bg-gray-50 space-y-3">
            <div className="flex flex-wrap gap-4 items-center">
              <input
                type="text"
                placeholder="Название панели (напр. Размер трубы)"
                className="flex-1 min-w-[200px] border rounded px-3 py-2"
                value={panel.title || ''}
                onChange={e => {
                  const spec = JSON.parse(JSON.stringify(data.specs || {}))
                  if (!spec.pricePanels) spec.pricePanels = []
                  spec.pricePanels[pIdx] = { ...spec.pricePanels[pIdx], title: e.target.value }
                  setData((d: any) => ({ ...d, specs: spec }))
                }}
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!panel.isMainPrice}
                  onChange={e => {
                    const spec = JSON.parse(JSON.stringify(data.specs || {}))
                    if (!spec.pricePanels) spec.pricePanels = []
                    spec.pricePanels[pIdx] = { ...spec.pricePanels[pIdx], isMainPrice: e.target.checked }
                    setData((d: any) => ({ ...d, specs: spec }))
                  }}
                />
                <span className="text-sm font-medium">Главная цена</span>
              </label>
              {!panel.isMainPrice && (
                <select
                  className="border rounded px-3 py-2 text-sm"
                  value={panel.modifierType || 'fixed'}
                  onChange={e => {
                    const spec = JSON.parse(JSON.stringify(data.specs || {}))
                    if (!spec.pricePanels) spec.pricePanels = []
                    spec.pricePanels[pIdx] = { ...spec.pricePanels[pIdx], modifierType: e.target.value }
                    setData((d: any) => ({ ...d, specs: spec }))
                  }}
                >
                  <option value="fixed">₽ (фикс. сумма)</option>
                  <option value="percent">% (процент от главной)</option>
                </select>
              )}
              <button
                type="button"
                onClick={() => {
                  const spec = JSON.parse(JSON.stringify(data.specs || {}))
                  spec.pricePanels = (spec.pricePanels || []).filter((_: any, i: number) => i !== pIdx)
                  setData((d: any) => ({ ...d, specs: spec }))
                }}
                className="px-3 py-1 text-red-600 border border-red-200 rounded hover:bg-red-50"
              >
                Удалить панель
              </button>
            </div>
            <div className="space-y-2 pl-2">
              <span className="text-xs font-medium text-gray-500">{panel.isMainPrice ? 'Опции с ценой (₽)' : 'Опции с модификатором'}</span>
              {(panel.options || []).map((opt: any, oIdx: number) => (
                <div key={oIdx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Подпись (напр. 32 мм)"
                    className="flex-1 border rounded px-3 py-2 text-sm"
                    value={opt.label || ''}
                    onChange={e => updatePanelOption(pIdx, oIdx, { label: e.target.value })}
                  />
                  {panel.isMainPrice ? (
                    <input
                      type="number"
                      placeholder="Цена ₽"
                      className="w-28 border rounded px-3 py-2 text-sm"
                      value={opt.price ?? ''}
                      onChange={e => updatePanelOption(pIdx, oIdx, { price: Number(e.target.value) || 0 })}
                    />
                  ) : (
                    <input
                      type="number"
                      placeholder={panel.modifierType === 'percent' ? '%' : '₽'}
                      className="w-24 border rounded px-3 py-2 text-sm"
                      value={opt.modifier ?? ''}
                      onChange={e => updatePanelOption(pIdx, oIdx, { modifier: Number(e.target.value) || 0 })}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const spec = JSON.parse(JSON.stringify(data.specs || {}))
                      spec.pricePanels[pIdx].options = spec.pricePanels[pIdx].options.filter((_: any, i: number) => i !== oIdx)
                      setData((d: any) => ({ ...d, specs: spec }))
                    }}
                    className="px-2 py-1 text-red-600 text-sm hover:bg-red-50 rounded"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const spec = JSON.parse(JSON.stringify(data.specs || {}))
                  if (!spec.pricePanels) spec.pricePanels = []
                  if (!spec.pricePanels[pIdx].options) spec.pricePanels[pIdx].options = []
                  spec.pricePanels[pIdx].options.push(panel.isMainPrice ? { label: '', price: 0 } : { label: '', modifier: 0 })
                  setData((d: any) => ({ ...d, specs: spec }))
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                + Добавить опцию
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            const spec = JSON.parse(JSON.stringify(data.specs || {}))
            if (!spec.pricePanels) spec.pricePanels = []
            spec.pricePanels.push({ title: '', isMainPrice: false, modifierType: 'fixed', options: [] })
            setData((d: any) => ({ ...d, specs: spec }))
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          + Добавить панель
        </button>
      </section>

      {/* Теги и особенности */}
      <section className="bg-white border rounded p-4 space-y-4">
        <h2 className="text-lg font-semibold">Теги и особенности</h2>
        <div>
          <div className="text-sm text-gray-600 mb-1">Теги (через запятую)</div>
          <input 
            className="w-full border rounded px-3 py-2" 
            placeholder="трубы, водопровод, пнд, полиэтилен" 
            value={(data.tags || []).join(', ')} 
            onChange={e => setData((d: any) => ({ ...d, tags: e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean) }))} 
          />
        </div>
      </section>

      {/* Описание */}
      <section className="bg-white border rounded p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <h2 className="text-lg font-semibold">Описание</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Брать из панели главной цены:</span>
            <select
              className="border rounded px-3 py-2 text-sm"
              value={data.specs?.descriptionPanelIdx ?? ''}
              onChange={e => setData((d: any) => {
                const spec = JSON.parse(JSON.stringify(d.specs || {}))
                spec.descriptionPanelIdx = e.target.value === '' ? null : Number(e.target.value)
                return { ...d, specs: spec }
              })}
            >
              <option value="">— Общее описание —</option>
              {(data.specs?.pricePanels || []).filter((p: any) => p.isMainPrice).map((p: any, i: number) => {
                const idx = (data.specs?.pricePanels || []).indexOf(p)
                return <option key={idx} value={idx}>{p.title || `Панель ${idx + 1}`}</option>
              })}
            </select>
          </div>
        </div>
        {data.specs?.descriptionPanelIdx != null ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">У каждого варианта — своё описание</p>
            {((data.specs?.pricePanels || [])[data.specs.descriptionPanelIdx]?.options || []).map((opt: any, oIdx: number) => (
              <div key={oIdx} className="border rounded-lg p-3 bg-gray-50">
                <label className="block text-sm font-medium text-gray-700 mb-2">Вариант: {opt.label || `Опция ${oIdx + 1}`}</label>
                <textarea
                  className="w-full border rounded px-3 py-2 text-sm"
                  rows={4}
                  placeholder="Описание для этого варианта"
                  value={opt.description || ''}
                  onChange={e => updatePanelOption(data.specs.descriptionPanelIdx, oIdx, { description: e.target.value })}
                />
              </div>
            ))}
            {((data.specs?.pricePanels || [])[data.specs.descriptionPanelIdx]?.options || []).length === 0 && (
              <p className="text-sm text-amber-600">Добавьте опции в выбранную панель выше</p>
            )}
          </div>
        ) : (
          <textarea 
            className="w-full border rounded px-3 py-2" 
            rows={6} 
            placeholder="Подробное описание проекта" 
            value={data.description || ''} 
            onChange={e => setData((d: any) => ({ ...d, description: e.target.value }))} 
          />
        )}
      </section>

      {/* Технические характеристики */}
      <section className="bg-white border rounded p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <h2 className="text-lg font-semibold">Технические характеристики</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Брать из панели главной цены:</span>
            <select
              className="border rounded px-3 py-2 text-sm"
              value={data.specs?.technicalSpecsPanelIdx ?? ''}
              onChange={e => setData((d: any) => {
                const spec = JSON.parse(JSON.stringify(d.specs || {}))
                spec.technicalSpecsPanelIdx = e.target.value === '' ? null : Number(e.target.value)
                return { ...d, specs: spec }
              })}
            >
              <option value="">— Общие характеристики —</option>
              {(data.specs?.pricePanels || []).filter((p: any) => p.isMainPrice).map((p: any) => {
                const idx = (data.specs?.pricePanels || []).indexOf(p)
                return <option key={idx} value={idx}>{p.title || `Панель ${idx + 1}`}</option>
              })}
            </select>
          </div>
        </div>
        {data.specs?.technicalSpecsPanelIdx != null ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">У каждого варианта — свои технические характеристики</p>
            {((data.specs?.pricePanels || [])[data.specs.technicalSpecsPanelIdx]?.options || []).map((opt: any, oIdx: number) => (
              <div key={oIdx} className="border rounded-lg p-3 bg-gray-50">
                <label className="block text-sm font-medium text-gray-700 mb-2">Вариант: {opt.label || `Опция ${oIdx + 1}`}</label>
                <textarea
                  className="w-full border rounded px-3 py-2 text-sm"
                  rows={6}
                  placeholder="Технические характеристики для этого варианта"
                  value={opt.technicalSpecs || ''}
                  onChange={e => updatePanelOption(data.specs.technicalSpecsPanelIdx, oIdx, { technicalSpecs: e.target.value })}
                />
              </div>
            ))}
            {((data.specs?.pricePanels || [])[data.specs.technicalSpecsPanelIdx]?.options || []).length === 0 && (
              <p className="text-sm text-amber-600">Добавьте опции в выбранную панель выше</p>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600">Введите технические характеристики в виде простого текста</p>
            <textarea 
              className="w-full border rounded px-3 py-2 text-sm" 
              rows={12} 
              value={data.technicalSpecs || ''} 
              onChange={e => setData((d: any) => ({ ...d, technicalSpecs: e.target.value }))}
              placeholder="Введите технические характеристики..."
            />
          </>
        )}
      </section>

      {/* Преимущества проекта */}
      <section className="bg-white border rounded p-4 space-y-3">
        <h2 className="text-lg font-semibold">Преимущества товара</h2>
        {(data.advantages || []).map((adv: string, idx: number) => (
          <div key={idx} className="flex gap-3 items-center">
            <input 
              className="flex-1 border rounded px-3 py-2" 
              placeholder="Преимущество" 
              value={adv} 
              onChange={e => setData((d: any) => ({ ...d, advantages: (d.advantages || []).map((x: string, i: number) => i === idx ? e.target.value : x) }))} 
            />
            <button 
              onClick={() => setData((d: any) => ({ ...d, advantages: (d.advantages || []).filter((_: string, i: number) => i !== idx) }))} 
              className="px-3 py-1 text-red-600 border border-red-200 rounded"
            >
              Удалить
            </button>
          </div>
        ))}
        <button 
          onClick={() => setData((d: any) => ({ ...d, advantages: [...(d.advantages || []), ''] }))} 
          className="px-3 py-1 border rounded"
        >
          + Добавить преимущество
        </button>
      </section>

      {/* Дополнительные опции */}
      <section className="bg-white border rounded p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Дополнительные опции</h2>
          <button 
            onClick={() => {
              const newSpecs = JSON.parse(JSON.stringify(data.specs || {}))
              newSpecs.additionalOptions = [...(newSpecs.additionalOptions || []), { label: '', price: 0 }]
              setData((d: any) => ({ ...d, specs: newSpecs }))
            }}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          >
            + Добавить
          </button>
        </div>
        <div className="space-y-2">
          {((data.specs || {}).additionalOptions || []).map((opt: any, idx: number) => (
            <div key={idx} className="flex gap-2 items-center bg-gray-50 p-2 rounded">
              <input 
                type="text" 
                placeholder="Название опции"
                className="flex-1 border rounded px-3 py-2" 
                value={opt.label || ''}
                onChange={e => {
                  const newSpecs = JSON.parse(JSON.stringify(data.specs || {}))
                  newSpecs.additionalOptions[idx].label = e.target.value
                  setData((d: any) => ({ ...d, specs: newSpecs }))
                }}
              />
              <input 
                type="number" 
                placeholder="Цена, ₽"
                className="w-32 border rounded px-3 py-2" 
                value={opt.price || 0}
                onChange={e => {
                  const newSpecs = JSON.parse(JSON.stringify(data.specs || {}))
                  newSpecs.additionalOptions[idx].price = Number(e.target.value)
                  setData((d: any) => ({ ...d, specs: newSpecs }))
                }}
              />
              <button 
                onClick={() => {
                  const newSpecs = JSON.parse(JSON.stringify(data.specs || {}))
                  newSpecs.additionalOptions = newSpecs.additionalOptions.filter((_: any, i: number) => i !== idx)
                  setData((d: any) => ({ ...d, specs: newSpecs }))
                }}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
