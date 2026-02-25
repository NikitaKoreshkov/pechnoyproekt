'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AdminTopBar from '@/components/admin/AdminTopBar'
import ImageUploader from '@/components/admin/ImageUploader'
import AdditionalImagesField from '@/components/admin/AdditionalImagesField'

export default function PopularEditPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [catalogSections, setCatalogSections] = useState<{ id: string; title: string; subsections: { id: string; sectionId: string; title: string }[] }[]>([])

  const loadCatalogSections = async () => {
    try {
      const res = await fetch('/api/admin/catalog/sections', { cache: 'no-store' })
      if (res.ok) setCatalogSections(await res.json())
    } catch {}
  }

  const loadProjects = async () => {
    try {
      const res = await fetch('/api/projects', { cache: 'no-store' })
      if (res.ok) setProjects(await res.json())
    } catch {}
  }

  const load = async () => {
    const res = await fetch(`/api/admin/popular/${params.id}`, { cache: 'no-store' })
    if (res.ok) {
      const item = await res.json()
      if (!item.specs) item.specs = {}
      if (!item.filterValues) item.filterValues = {}
      setData(item)
    }
  }

  useEffect(() => {
    load()
    loadCatalogSections()
    loadProjects()
  }, [params.id])

  // Если есть связь с проектом — подтягиваем данные из каталога (раздел, описание, изображения и т.д.)
  useEffect(() => {
    if (!data?.projectSlug || !projects.length) return
    const proj = projects.find((p: any) => p.slug === data.projectSlug || p.id === data.projectSlug)
    if (!proj) return
    setData((prev: any) => ({
      ...prev,
      subsectionId: prev.subsectionId || proj.subsectionId || null,
      subsubsectionId: prev.subsubsectionId || proj.subsubsectionId || null,
      description: (prev.description && String(prev.description).trim()) ? prev.description : (proj.description || ''),
      technicalSpecs: (prev.technicalSpecs && String(prev.technicalSpecs).trim()) ? prev.technicalSpecs : (proj.technicalSpecs || ''),
      advantages: (prev.advantages?.length ? prev.advantages : (proj.advantages || [])),
      images: (prev.images?.length ? prev.images : (proj.images || [])),
      image: prev.image || proj.image || '',
    }))
  }, [data?.projectSlug, projects])

  const save = async () => {
    if (!data) return
    setSaving(true)
    try {
      const payload = {
        title: data.title || 'Без названия',
        area: Number(data.area) || 20,
        priceFrom: Number(data.priceFrom) || 0,
        priceTo: data.priceTo ? Number(data.priceTo) : null,
        image: data.image || '/images/1.png',
        images: Array.isArray(data.images) ? data.images : [],
        tags: Array.isArray(data.tags) ? data.tags : data.tags ? String(data.tags).split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        features: Array.isArray(data.features) ? data.features : [],
        description: data.description && String(data.description).trim() ? data.description : null,
        advantages: Array.isArray(data.advantages) ? data.advantages : [],
        technicalSpecs: data.technicalSpecs && String(data.technicalSpecs).trim() ? data.technicalSpecs : null,
        specs: data.specs || {},
        filterValues: data.filterValues || null,
        subsectionId: data.subsectionId && String(data.subsectionId).trim() ? data.subsectionId : null,
        subsubsectionId: data.subsubsectionId && String(data.subsubsectionId).trim() ? data.subsubsectionId : null,
        projectSlug: data.projectSlug && String(data.projectSlug).trim() ? data.projectSlug : null,
      }

      const res = await fetch(`/api/admin/popular/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      setSaving(false)
      if (res.ok) {
        await load()
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const ch = new BroadcastChannel('projects-updated')
          ch.postMessage({ type: 'projects-updated', ts: Date.now() })
          ch.close()
        }
        try { localStorage.setItem('projects-updated', String(Date.now())) } catch {}
        alert('✅ Сохранено')
      } else {
        const err = await res.json().catch(() => ({}))
        alert(`❌ Ошибка: ${err.error || err.details || 'Не удалось сохранить'}`)
      }
    } catch (err) {
      setSaving(false)
      alert(`❌ ${err instanceof Error ? err.message : 'Ошибка сети'}`)
    }
  }

  const linkToProject = (slug: string) => {
    const proj = projects.find((p: any) => p.slug === slug || p.id === slug)
    if (!proj) return
    setData((d: any) => ({
      ...d,
      projectSlug: proj.slug,
      title: proj.title,
      image: proj.image || d.image,
      images: proj.images?.length ? proj.images : (d.images || []),
      area: proj.area ?? d.area,
      priceFrom: proj.priceFrom ?? d.priceFrom,
      priceTo: proj.priceTo ?? d.priceTo,
      subsectionId: proj.subsectionId || null,
      subsubsectionId: proj.subsubsectionId || null,
      description: proj.description ?? d.description,
      technicalSpecs: proj.technicalSpecs ?? d.technicalSpecs,
      advantages: proj.advantages?.length ? proj.advantages : (d.advantages || []),
    }))
  }

  if (!data) return null

  const allSubsections = (catalogSections || []).flatMap((s: any) =>
    (s.subsections || []).map((sb: any) => ({ ...sb, _sectionId: s.id }))
  )
  const allSubsubsections = allSubsections.flatMap((sb: any) =>
    (sb.subsubsections || []).map((ss: any) => ({ ...ss, _subsectionId: sb.id, _sectionId: sb._sectionId }))
  )
  let currentSectionId = data._sectionId || ''
  let currentSubsectionId = data._subsectionId || data.subsectionId || ''
  if (data.subsubsectionId) {
    const ss = allSubsubsections.find((x: any) => x.id === data.subsubsectionId)
    if (ss) {
      currentSubsectionId = ss._subsectionId
      currentSectionId = ss._sectionId
    }
  } else if (data.subsectionId) {
    const sb = allSubsections.find((x: any) => x.id === data.subsectionId)
    if (sb) currentSectionId = sb._sectionId
  }
  const subsections = currentSectionId
    ? (catalogSections.find((s: any) => s.id === currentSectionId)?.subsections || [])
    : []
  const subsubsections = currentSubsectionId
    ? (subsections.find((sb: any) => sb.id === currentSubsectionId)?.subsubsections || [])
    : []

  return (
    <div className="space-y-6">
      <AdminTopBar
        title={`Редактирование: ${data.title || 'Популярный проект'}`}
        backHref="/admin/changes/popular"
        actions={
          <>
            <Link href="/admin/changes/popular" className="px-3 py-1.5 border rounded hover:bg-gray-50">
              К списку
            </Link>
            <button
              onClick={save}
              disabled={saving}
              className="px-3 py-1.5 bg-gray-900 text-white rounded disabled:opacity-50"
            >
              {saving ? 'Сохранение…' : 'Сохранить'}
            </button>
          </>
        }
      />

      {/* Основное */}
      <section className="bg-white border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">Основная информация</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Связь с проектом из каталога</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={data.projectSlug || ''}
            onChange={(e) => {
              const slug = e.target.value || null
              setData((d: any) => ({ ...d, projectSlug: slug }))
              if (slug) linkToProject(slug)
            }}
          >
            <option value="">— Свой вариант (без связи) —</option>
            {projects.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.title}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">При выборе проекта данные подставятся автоматически. Можно изменить вручную.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Например: Комплекс барбекю 872"
            value={data.title || ''}
            onChange={(e) => setData((d: any) => ({ ...d, title: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Фото</label>
          <ImageUploader
            value={data.image || ''}
            onChange={(url) => setData((d: any) => ({ ...d, image: url || '/images/1.png' }))}
            placeholder="URL или загрузить"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Дополнительные изображения</label>
          <AdditionalImagesField
            value={data.images || []}
            onChange={(urls) => setData((d: any) => ({ ...d, images: urls }))}
            placeholder="URL или загрузить"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Площадь (м²)</label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2"
              placeholder="20"
              value={data.area ?? ''}
              onChange={(e) => setData((d: any) => ({ ...d, area: Number(e.target.value) || 0 }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Цена от (₽)</label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2"
              placeholder="0"
              value={data.priceFrom ?? ''}
              onChange={(e) => setData((d: any) => ({ ...d, priceFrom: Number(e.target.value) || 0 }))}
            />
          </div>
        </div>

        {/* Раздел каталога */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Раздел каталога</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={currentSectionId}
              onChange={(e) =>
                setData((d: any) => ({
                  ...d,
                  _sectionId: e.target.value || '',
                  _subsectionId: '',
                  subsectionId: null,
                  subsubsectionId: null,
                }))
              }
            >
              <option value="">— Не выбран —</option>
              {(catalogSections || []).map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Подраздел</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={currentSubsectionId}
              onChange={(e) => {
                const val = e.target.value || null
                setData((d: any) => ({
                  ...d,
                  _subsectionId: val || '',
                  subsectionId: val,
                  subsubsectionId: null,
                }))
              }
              }
              disabled={!currentSectionId}
            >
              <option value="">— Не выбран —</option>
              {subsections.map((sb: any) => (
                <option key={sb.id} value={sb.id}>
                  {sb.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Подраздел подраздела</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={data.subsubsectionId || ''}
              onChange={(e) => {
                const val = e.target.value || null
                setData((d: any) => ({
                  ...d,
                  subsubsectionId: val || null,
                  subsectionId: val ? null : currentSubsectionId || null,
                }))
              }
              }
              disabled={!currentSubsectionId}
            >
              <option value="">— Не выбран —</option>
              {subsubsections.map((ss: any) => (
                <option key={ss.id} value={ss.id}>
                  {ss.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Теги */}
      <section className="bg-white border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-3">Теги</h2>
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="барбекю, мангал, кирпич, печь (через запятую)"
          value={Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags || '')}
          onChange={(e) =>
            setData((d: any) => ({
              ...d,
              tags: e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean),
            }))
          }
        />
      </section>

      {/* Описание */}
      <section className="bg-white border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-3">Описание</h2>
        <textarea
          className="w-full border rounded px-3 py-2"
          rows={5}
          placeholder="Подробное описание печного комплекса или мангала"
          value={data.description || ''}
          onChange={(e) => setData((d: any) => ({ ...d, description: e.target.value }))}
        />
      </section>

      {/* Технические характеристики */}
      <section className="bg-white border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-3">Технические характеристики</h2>
        <textarea
          className="w-full border rounded px-3 py-2 text-sm"
          rows={6}
          placeholder="Габариты, материалы, особенности конструкции…"
          value={data.technicalSpecs || ''}
          onChange={(e) => setData((d: any) => ({ ...d, technicalSpecs: e.target.value }))}
        />
      </section>

      {/* Преимущества */}
      <section className="bg-white border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-3">Преимущества</h2>
        {(data.advantages || []).map((adv: string, idx: number) => (
          <div key={idx} className="flex gap-2 mb-2">
            <input
              className="flex-1 border rounded px-3 py-2"
              placeholder="Преимущество"
              value={adv}
              onChange={(e) =>
                setData((d: any) => ({
                  ...d,
                  advantages: (d.advantages || []).map((x: string, i: number) => (i === idx ? e.target.value : x)),
                }))
              }
            />
            <button
              type="button"
              onClick={() =>
                setData((d: any) => ({
                  ...d,
                  advantages: (d.advantages || []).filter((_: string, i: number) => i !== idx),
                }))
              }
              className="px-3 py-2 text-red-600 border border-red-200 rounded hover:bg-red-50"
            >
              Удалить
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setData((d: any) => ({ ...d, advantages: [...(d.advantages || []), ''] }))}
          className="px-3 py-2 border rounded hover:bg-gray-50"
        >
          + Добавить преимущество
        </button>
      </section>
    </div>
  )
}
