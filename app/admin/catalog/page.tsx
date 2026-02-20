'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import AdminTopBar from '@/components/admin/AdminTopBar'
import ImageUploader from '@/components/admin/ImageUploader'
import AdditionalImagesField from '@/components/admin/AdditionalImagesField'
import { slugFromTitle } from '@/lib/slug'

interface ProjectListItem { id: string; slug: string; title: string; area: number; material: string; priceFrom: number; image: string }
interface PopularItem { id: string; title: string; image: string; area: number; material: string; priceFrom: number; priceTo?: number | null; projectSlug?: string | null }

export default function AdminCatalogPage() {
  const [items, setItems] = useState<ProjectListItem[]>([])
  const [popularItems, setPopularItems] = useState<PopularItem[]>([])
  const [materialOptions, setMaterialOptions] = useState<any[]>([])
  const [completionOptions, setCompletionOptions] = useState<any[]>([])
  const [catalogSections, setCatalogSections] = useState<{ id: string; title: string; subsections: { id: string; sectionId: string; title: string }[] }[]>([])
  const [form, setForm] = useState<any>({ 
    slug: '', 
    title: '', 
    area: 50, 
    priceFrom: 0,
    material: '',
    buildTime: 30,
    completion: '',
    image: '/images/1.png',
    images: [],
    tags: [],
    hasTerrasse: false,
    hasBath: false,
    hasGarage: false,
    features: [],
    description: '',
    advantages: [],
    technicalSpecs: '',
    subsectionId: null as string | null,
    subsubsectionId: null as string | null,
    sectionId: '' as string,
    _subsectionId: '' as string,
    specs: {
      completionOptions: [],
      additionalOptions: []
    }
  })

  const load = async () => {
    const res = await fetch('/api/admin/projects', { cache: 'no-store' })
    if (res.ok) setItems(await res.json())
  }
  
  const loadPopular = async () => {
    try {
      const res = await fetch('/api/admin/popular', { cache: 'no-store' })
      if (res.ok) {
        const panels = await res.json()
        // Собираем все популярные проекты из всех панелей
        const allPopularItems = panels.flatMap((panel: any) => panel.items || [])
        setPopularItems(allPopularItems)
      }
    } catch (err) {
      console.error('Error loading popular projects:', err)
    }
  }

  const loadFilters = async () => {
    try {
      const res = await fetch('/api/admin/catalog/filters', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (data.config?.material?.options) {
          setMaterialOptions(data.config.material.options)
          setForm((f: any) => ({ ...f, material: data.config.material.options[0]?.value || '' }))
        }
        if (data.config?.completion?.options) {
          setCompletionOptions(data.config.completion.options.filter((opt: any) => opt.value !== ''))
          setForm((f: any) => ({ ...f, completion: data.config.completion.options.find((opt: any) => opt.value !== '')?.value || '' }))
        }
      }
    } catch (err) {
      console.error('Error loading filters:', err)
    }
  }

  const loadCatalogSections = async () => {
    try {
      const res = await fetch('/api/admin/catalog/sections', { cache: 'no-store' })
      if (res.ok) setCatalogSections(await res.json())
    } catch (err) {
      console.error('Error loading catalog sections:', err)
    }
  }
  
  useEffect(() => { 
    load() 
    loadPopular()
    loadFilters()
    loadCatalogSections()
  }, [])

  const create = async () => {
    if (!form.area || !form.buildTime || !form.material) {
      alert('❌ Заполните все обязательные поля: Диаметр, Длина, Материал')
      return
    }
    // Название: если введено вручную — используем его, иначе генерируем из диаметра, длины и материала
    const generatedTitle = `${form.material || 'ПНД'} ${form.area || ''}мм SDR11 (${form.buildTime || ''}м)`
    const titleToUse = typeof form.title === 'string' && form.title.trim() ? form.title.trim() : generatedTitle
    const slugVal = typeof form.slug === 'string' ? form.slug.trim() : ''
    if (slugVal && !/^[a-z0-9-]+$/.test(slugVal)) {
      alert('❌ Slug может содержать только латиницу, цифры и дефисы. Оставьте пустым — сгенерируется из названия.')
      return
    }
    const formData = { ...form, title: titleToUse, image: form.image || '/images/1.png', slug: slugVal || undefined }
    try {
      const res = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        const result = await res.json()
        setForm({
          slug: '',
          title: '',
          area: 50,
          priceFrom: 0,
          material: materialOptions[0]?.value || '',
          buildTime: 30,
          completion: completionOptions[0]?.value || '',
          image: '/images/1.png',
          images: [],
          tags: [],
          hasTerrasse: false,
          hasBath: false,
          hasGarage: false,
          features: [],
          description: '',
          advantages: [],
          technicalSpecs: '',
          subsectionId: null,
          subsubsectionId: null,
          sectionId: '',
          _subsectionId: '',
          specs: { completionOptions: [], additionalOptions: [] }
        })
        await load()
        try {
          if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            const ch = new BroadcastChannel('projects-updated')
            ch.postMessage({ type: 'projects-updated', ts: Date.now(), slug: result.slug })
            ch.close()
          }
          try { localStorage.setItem('projects-updated', String(Date.now())) } catch {}
        } catch {}
        alert('✅ Проект создан! Slug: ' + (result.slug || '—'))
      } else {
        const data = await res.json().catch(() => ({}))
        const msg = data.error || data.details || 'Ошибка создания'
        alert(`❌ ${msg}`)
        if (data.error?.includes('slug') || data.details?.includes('slug')) {
          const fallback = slugFromTitle(form.title) + '-2'
          const newSlug = prompt('Slug уже занят. Введите другой или оставьте пустым:', fallback)
          if (newSlug != null) setForm((f: any) => ({ ...f, slug: newSlug.trim() }))
        }
      }
    } catch (err) {
      alert(`❌ ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Удалить проект?')) return
    try {
      console.log('[DELETE PROJECT] Sending DELETE request:', id)
      const res = await fetch(`/api/admin/projects/${id}`, { method: 'DELETE' })
      console.log('[DELETE PROJECT] Response status:', res.status)
      if (res.ok) {
        const result = await res.json()
        console.log('[DELETE PROJECT] Success:', result)
        await load()
        alert('✅ Проект успешно удален!')
      } else {
        const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        console.error('[DELETE PROJECT] Error:', errorData)
        alert(`❌ Ошибка удаления проекта: ${errorData.error || 'Неизвестная ошибка'}`)
      }
    } catch (err) {
      console.error('[DELETE PROJECT] Exception:', err)
      alert(`❌ Ошибка: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`)
    }
  }

  return (
    <div className="space-y-6">
      <AdminTopBar title="Каталог проектов" backHref="/admin" actions={
        <>
          <Link href="/catalog" target="_blank" className="px-3 py-1.5 border rounded hover:bg-gray-50">
            Открыть каталог
          </Link>
          <Link href="/admin/catalog/filters" className="px-3 py-1.5 border rounded hover:bg-gray-50">
            Настроить фильтры
          </Link>
          <Link href="/admin/changes/popular" className="px-3 py-1.5 border rounded hover:bg-gray-50">
            Популярные товары
          </Link>
        </>
      } />
      
      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded p-4">
          <div className="text-sm text-gray-600 mb-1">Всего товаров</div>
          <div className="text-2xl font-bold text-gray-900">{items.length}</div>
        </div>
        <div className="bg-white border rounded p-4">
          <div className="text-sm text-gray-600 mb-1">Популярных товаров</div>
          <div className="text-2xl font-bold text-green-600">{popularItems.length}</div>
        </div>
        <div className="bg-white border rounded p-4">
          <div className="text-sm text-gray-600 mb-1">Последний товар</div>
          <div className="text-sm font-medium text-gray-900">
            {items.length > 0 ? items[0].title : 'Нет товаров'}
          </div>
        </div>
        <div className="bg-white border rounded p-4">
          <div className="text-sm text-gray-600 mb-1">Быстрые действия</div>
          <div className="flex gap-2 mt-2">
            <Link href="/catalog" target="_blank" className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
              Просмотр
            </Link>
            <Link href="/admin/changes/popular" className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">
              Популярные
            </Link>
          </div>
        </div>
      </div>
      
      {/* Популярные товары */}
      {popularItems.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-yellow-600">⭐</span>
              Популярные товары ({popularItems.length})
            </h3>
            <Link 
              href="/admin/changes/popular" 
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors text-sm font-medium"
            >
              Редактировать популярные
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded border">
              <thead>
                <tr className="text-left bg-yellow-100">
                  <th className="p-2">Превью</th>
                  <th className="p-2">Название</th>
                  <th className="p-2">Связь с проектом</th>
                  <th className="p-2">Диаметр</th>
                  <th className="p-2">Материал</th>
                  <th className="p-2">Цена от</th>
                  <th className="p-2">Действия</th>
                </tr>
              </thead>
              <tbody>
                {popularItems.map((item) => (
                  <tr key={item.id} className="border-t hover:bg-yellow-50 transition-colors">
                    <td className="p-2">
                      <img src={item.image?.startsWith('/') || item.image?.startsWith('http') ? item.image : '/images/1.png'} alt={item.title} className="w-12 h-9 object-cover rounded" onError={(e) => { (e.target as HTMLImageElement).src = '/images/1.png' }} />
                    </td>
                    <td className="p-2 font-medium">{item.title}</td>
                    <td className="p-2">
                      {item.projectSlug ? (
                        <Link 
                          href={`/admin/projects/${item.projectSlug}`}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          {item.projectSlug}
                        </Link>
                      ) : (
                        <span className="text-gray-400 text-sm">Не связан</span>
                      )}
                    </td>
                    <td className="p-2">{item.area} мм</td>
                    <td className="p-2 capitalize">{item.material}</td>
                    <td className="p-2 font-semibold">{new Intl.NumberFormat('ru-RU').format(item.priceFrom)} ₽</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Link 
                          href={`/admin/popular/${item.id}`} 
                          className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-xs"
                        >
                          Редакт.
                        </Link>
                        {item.projectSlug && (
                          <Link 
                            href={`/project/${item.projectSlug}`} 
                            target="_blank"
                            className="px-2 py-1 border rounded hover:bg-gray-50 text-xs"
                          >
                            Просмотр
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="bg-white border rounded p-4 space-y-4">
        <h2 className="text-lg font-semibold">Добавить проект</h2>
        
        {/* Основная информация */}
        <section className="bg-white border rounded p-4 space-y-4">
          <h2 className="text-lg font-semibold">Основная информация</h2>

          {/* Название проекта */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Название проекта</label>
            <input
              className="w-full border rounded px-3 py-2"
              type="text"
              placeholder="Например: Труба ПНД 32мм SDR11 (50м)"
              value={form.title || ''}
              onChange={e => setForm((f: any) => ({ ...f, title: e.target.value }))}
            />
            <p className="text-xs text-gray-500 mt-1">Если оставить пустым — название сгенерируется из диаметра, длины и материала.</p>
          </div>

          {/* Фото */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Фото проекта</label>
            <ImageUploader
              value={form.image || ''}
              onChange={(url) => setForm((f: any) => ({ ...f, image: url || '/images/1.png' }))}
              placeholder="URL или загрузить файл"
            />
          </div>

          {/* Дополнительные изображения */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Дополнительные изображения</label>
            <AdditionalImagesField
              value={form.images || []}
              onChange={(urls) => setForm((f: any) => ({ ...f, images: urls }))}
              placeholder="URL или загрузить"
            />
          </div>
          
          {/* Диаметр */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Диаметр (мм)</label>
            <input 
              className="w-full border rounded px-3 py-2" 
              type="number" 
              placeholder="Введите диаметр в миллиметрах" 
              value={form.area} 
              onChange={e => setForm((f: any) => ({ ...f, area: Number(e.target.value) }))} 
            />
          </div>

          {/* Длина */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Длина (м)</label>
            <input 
              className="w-full border rounded px-3 py-2" 
              type="number" 
              placeholder="Введите длину в метрах" 
              value={form.buildTime} 
              onChange={e => setForm((f: any) => ({ ...f, buildTime: Number(e.target.value) }))} 
            />
          </div>

          {/* Материал */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Материал</label>
            <input 
              className="w-full border rounded px-3 py-2" 
              type="text"
              placeholder="Введите материал" 
              value={form.material} 
              onChange={e => setForm((f: any) => ({ ...f, material: e.target.value }))}
            />
          </div>

          {/* Цена */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Цена (₽)</label>
            <input 
              className="w-full border rounded px-3 py-2" 
              type="number" 
              placeholder="Введите цену в рублях" 
              value={form.priceFrom} 
              onChange={e => setForm((f: any) => ({ ...f, priceFrom: Number(e.target.value) }))} 
            />
          </div>
        </section>

        {/* Раздел, подраздел и подраздел подраздела каталога */}
        <section className="bg-white border rounded p-4 space-y-4">
          <h2 className="text-lg font-semibold">Раздел, подраздел и подраздел подраздела</h2>
          {(() => {
            const allSubsections = (catalogSections || []).flatMap((s: any) => (s.subsections || []).map((sb: any) => ({ ...sb, _sectionId: s.id })))
            const allSubsubsections = allSubsections.flatMap((sb: any) => (sb.subsubsections || []).map((ss: any) => ({ ...ss, _subsectionId: sb.id, _sectionId: sb._sectionId })))
            let currentSectionId = form.sectionId || ''
            let currentSubsectionId = form._subsectionId || form.subsectionId || ''
            if (form.subsubsectionId) {
              const ss = allSubsubsections.find((x: any) => x.id === form.subsubsectionId)
              if (ss) { currentSubsectionId = ss._subsectionId; currentSectionId = ss._sectionId }
            } else if (form.subsectionId) {
              const sb = allSubsections.find((x: any) => x.id === form.subsectionId)
              if (sb) currentSectionId = sb._sectionId
            }
            const subsections = currentSectionId ? (catalogSections.find((s: any) => s.id === currentSectionId)?.subsections || []) : []
            const subsubsections = currentSubsectionId ? (subsections.find((sb: any) => sb.id === currentSubsectionId)?.subsubsections || []) : []
            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Раздел</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={currentSectionId}
                    onChange={e => setForm((f: any) => ({ ...f, sectionId: e.target.value || '', _subsectionId: '', subsectionId: null, subsubsectionId: null }))}
                  >
                    <option value="">— Не выбран —</option>
                    {(catalogSections || []).map((s: any) => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Подраздел</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={currentSubsectionId}
                    onChange={e => {
                      const val = e.target.value || null
                      setForm((f: any) => ({ ...f, _subsectionId: val || '', subsectionId: val, subsubsectionId: null }))
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Подраздел подраздела</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={form.subsubsectionId || ''}
                    onChange={e => {
                      const val = e.target.value || null
                      setForm((f: any) => ({ ...f, subsubsectionId: val, subsectionId: val ? null : (currentSubsectionId || null) }))
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
        </section>

        {/* Теги */}
        <section className="bg-white border rounded p-4 space-y-4">
          <h2 className="text-lg font-semibold">Теги и особенности</h2>
          <div>
            <div className="text-sm text-gray-600 mb-1">Теги (через запятую)</div>
            <input 
              className="w-full border rounded px-3 py-2" 
              placeholder="трубы, водопровод, пнд, полиэтилен" 
              value={form.tags.join(', ')} 
              onChange={e => setForm((f: any) => ({ ...f, tags: e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean) }))} 
            />
          </div>
        </section>

        {/* Описание */}
        <section className="bg-white border rounded p-4 space-y-4">
          <h2 className="text-lg font-semibold">Описание</h2>
          <div>
            <div className="text-sm text-gray-600 mb-1">Описание проекта</div>
            <textarea 
              className="w-full border rounded px-3 py-2" 
              rows={4} 
              placeholder="Описание проекта" 
              value={form.description} 
              onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} 
            />
          </div>
        </section>

        {/* Технические характеристики */}
        <section className="bg-white border rounded p-4 space-y-4">
          <h2 className="text-lg font-semibold">Технические характеристики</h2>
          <div>
            <div className="text-sm text-gray-600 mb-1">Введите технические характеристики в виде простого текста</div>
            <textarea 
              className="w-full border rounded px-3 py-2 text-sm" 
              rows={12} 
              value={form.technicalSpecs || ''} 
              onChange={e => setForm((f: any) => ({ ...f, technicalSpecs: e.target.value }))}
              placeholder="Введите технические характеристики..."
            />
          </div>
        </section>

        {/* Преимущества товара */}
        <section className="bg-white border rounded p-4 space-y-3">
          <h2 className="text-lg font-semibold">Преимущества товара</h2>
          {(form.advantages || []).map((adv: string, idx: number) => (
            <div key={idx} className="flex gap-3 items-center">
              <input 
                className="flex-1 border rounded px-3 py-2" 
                placeholder="Преимущество" 
                value={adv} 
                onChange={e => setForm((f: any) => ({ ...f, advantages: (f.advantages || []).map((x: string, i: number) => i === idx ? e.target.value : x) }))} 
              />
              <button 
                onClick={() => setForm((f: any) => ({ ...f, advantages: (f.advantages || []).filter((_: string, i: number) => i !== idx) }))} 
                className="px-3 py-1 text-red-600 border border-red-200 rounded"
              >
                Удалить
              </button>
            </div>
          ))}
          <button 
            onClick={() => setForm((f: any) => ({ ...f, advantages: [...(f.advantages || []), ''] }))} 
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
                const newSpecs = JSON.parse(JSON.stringify(form.specs || {}))
                newSpecs.additionalOptions = [...(newSpecs.additionalOptions || []), { label: '', price: 0 }]
                setForm((f: any) => ({ ...f, specs: newSpecs }))
              }}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              + Добавить
            </button>
          </div>
          <div className="space-y-2">
            {((form.specs || {}).additionalOptions || []).map((opt: any, idx: number) => (
              <div key={idx} className="flex gap-2 items-center bg-gray-50 p-2 rounded">
                <input 
                  type="text" 
                  placeholder="Название опции"
                  className="flex-1 border rounded px-3 py-2" 
                  value={opt.label || ''}
                  onChange={e => {
                    const newSpecs = JSON.parse(JSON.stringify(form.specs || {}))
                    newSpecs.additionalOptions[idx].label = e.target.value
                    setForm((f: any) => ({ ...f, specs: newSpecs }))
                  }}
                />
                <input 
                  type="number" 
                  placeholder="Цена, ₽"
                  className="w-32 border rounded px-3 py-2" 
                  value={opt.price || 0}
                  onChange={e => {
                    const newSpecs = JSON.parse(JSON.stringify(form.specs || {}))
                    newSpecs.additionalOptions[idx].price = Number(e.target.value)
                    setForm((f: any) => ({ ...f, specs: newSpecs }))
                  }}
                />
                <button 
                  onClick={() => {
                    const newSpecs = JSON.parse(JSON.stringify(form.specs || {}))
                    newSpecs.additionalOptions = newSpecs.additionalOptions.filter((_: any, i: number) => i !== idx)
                    setForm((f: any) => ({ ...f, specs: newSpecs }))
                  }}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>

        <button onClick={create} className="px-6 py-2 bg-[#5D4E37] text-white rounded hover:bg-[#4a3d2a] transition">Создать проект</button>
      </div>

      <div className="overflow-x-auto rounded border">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="text-left bg-gray-50">
              <th className="p-3">Превью</th>
              <th className="p-3">Название</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Диаметр</th>
              <th className="p-3">Материал</th>
              <th className="p-3">Цена</th>
              <th className="p-3">Действия</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  Нет проектов. Создайте первый проект выше.
                </td>
              </tr>
            ) : (
              items.map(p => (
                <tr key={p.id} className="border-t hover:bg-gray-50 transition-colors">
                  <td className="p-3">
                    <img src={p.image?.startsWith('/') || p.image?.startsWith('http') ? p.image : '/images/1.png'} alt={p.title} className="w-16 h-12 object-cover rounded" onError={(e) => { (e.target as HTMLImageElement).src = '/images/1.png' }} />
                  </td>
                  <td className="p-3 font-medium">{p.title}</td>
                  <td className="p-3">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">{p.slug}</code>
                  </td>
                  <td className="p-3">{p.area} мм</td>
                  <td className="p-3 capitalize">{p.material}</td>
                  <td className="p-3 font-semibold">{new Intl.NumberFormat('ru-RU').format(p.priceFrom)} ₽</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Link 
                        href={`/admin/projects/${p.slug}`} 
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                      >
                        Редактировать
                      </Link>
                      <Link 
                        href={`/project/${p.slug}`} 
                        target="_blank"
                        className="px-3 py-1 border rounded hover:bg-gray-50 text-sm"
                      >
                        Просмотр
                      </Link>
                      <button 
                        onClick={() => remove(p.id)} 
                        className="px-3 py-1 text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors text-sm"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}


