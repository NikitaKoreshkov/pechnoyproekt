'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AdminTopBar from '@/components/admin/AdminTopBar'
import ImageUploader from '@/components/admin/ImageUploader'

interface PopularItem {
  id?: string
  title: string
  image: string
  images?: string[]
  area: number
  priceFrom: number
  priceTo?: number | null
  order?: number
  projectSlug?: string | null
  buildTime?: number
}

interface PopularPanel {
  id?: string
  title: string
  order?: number
  items: PopularItem[]
}

interface Project {
  slug: string
  title: string
  image: string
  area: number
  priceFrom: number
  priceTo?: number | null
  buildTime?: number
}

const emptyItem = (): PopularItem => ({
  title: '',
  image: '/images/1.png',
  images: [],
  area: 0,
  priceFrom: 0,
  priceTo: null,
  projectSlug: null,
  buildTime: 30,
})

export default function PopularEditorPage() {
  const [panels, setPanels] = useState<PopularPanel[]>([])
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])

  const load = async () => {
    const res = await fetch('/api/admin/popular', { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      setPanels(data.length ? data : [{ title: 'Популярные проекты', items: [] }])
    } else {
      setPanels([{ title: 'Популярные проекты', items: [] }])
    }
  }

  const loadProjects = async () => {
    const res = await fetch('/api/projects', { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      setProjects(data)
    }
  }

  useEffect(() => {
    load()
    loadProjects()
  }, [])

  const addPanel = () => {
    if (panels.length >= 2) return
    setPanels((p) => [...p, { title: `Панель ${p.length + 1}`, items: [] }])
  }

  const removePanel = (idx: number) => setPanels((p) => p.filter((_, i) => i !== idx))

  const addItem = (pIdx: number) =>
    setPanels((ps) =>
      ps.map((p, i) =>
        i === pIdx && p.items.length < 6
          ? { ...p, items: [...p.items, emptyItem()] }
          : p
      )
    )

  const removeItem = (pIdx: number, iIdx: number) =>
    setPanels((ps) =>
      ps.map((p, i) =>
        i === pIdx ? { ...p, items: p.items.filter((_, j) => j !== iIdx) } : p
      )
    )

  const linkToProject = (pIdx: number, iIdx: number, slug: string) => {
    const project = projects.find((pr) => pr.slug === slug || pr.id === slug)
    if (!project) return
    setPanels((ps) =>
      ps.map((p, i) =>
        i === pIdx
          ? {
              ...p,
              items: p.items.map((it, j) =>
                j === iIdx
                  ? {
                      ...it,
                      projectSlug: project.slug || project.id,
                      title: project.title,
                      image: project.image || it.image,
                      area: project.area ?? it.area,
                      priceFrom: project.priceFrom ?? it.priceFrom,
                      priceTo: project.priceTo ?? it.priceTo,
                      buildTime: project.buildTime ?? it.buildTime,
                    }
                  : it
              ),
            }
          : p
      )
    )
  }

  const updateItem = (pIdx: number, iIdx: number, field: keyof PopularItem, value: unknown) => {
    setPanels((ps) =>
      ps.map((p, i) =>
        i === pIdx
          ? {
              ...p,
              items: p.items.map((it, j) =>
                j === iIdx ? { ...it, [field]: value } : it
              ),
            }
          : p
      )
    )
  }

  const save = async () => {
    setLoading(true)
    try {
      const payload = panels.map((p, idx) => ({
        ...p,
        order: idx,
        items: p.items.map((it, j) => ({ ...it, order: j })),
      }))
      const res = await fetch('/api/admin/popular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        await load()
        alert('✅ Популярные проекты сохранены!')
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

  return (
    <div className="space-y-6">
      <AdminTopBar
        title="Популярные проекты"
        backHref="/admin/catalog"
        actions={
          <>
            <Link
              href="/admin/popular-projects"
              className="px-3 py-1.5 border rounded hover:bg-gray-50"
            >
              Просмотр
            </Link>
            <button
              onClick={addPanel}
              disabled={panels.length >= 2}
              className="px-3 py-1.5 bg-[#5D4E37] text-white rounded disabled:opacity-50"
            >
              Добавить панель
            </button>
            <button
              onClick={save}
              disabled={loading}
              className="px-3 py-1.5 bg-gray-900 text-white rounded"
            >
              {loading ? 'Сохранение…' : 'Сохранить'}
            </button>
          </>
        }
      />

      <p className="text-gray-600 text-sm">
        Печные комплексы и мангалы на главной. До 2 панелей, до 6 карточек в каждой. Можно связать с проектом из каталога — данные подставятся автоматически.
      </p>

      {panels.map((panel, pIdx) => (
        <div key={pIdx} className="bg-white border rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-3">
            <input
              className="border rounded px-3 py-2 flex-1"
              placeholder="Заголовок панели"
              value={panel.title}
              onChange={(e) =>
                setPanels((ps) =>
                  ps.map((p, i) => (i === pIdx ? { ...p, title: e.target.value } : p))
                )
              }
            />
            <button
              onClick={() => removePanel(pIdx)}
              className="px-3 py-2 text-red-600 border border-red-200 rounded"
            >
              Удалить панель
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {panel.items.map((item, iIdx) => (
              <div key={iIdx} className="border rounded-xl p-4 space-y-3 bg-gray-50/50">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-500">Карточка {iIdx + 1}</span>
                  <button
                    onClick={() => removeItem(pIdx, iIdx)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Удалить
                  </button>
                </div>

                {/* Связь с проектом */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Связь с проектом
                  </label>
                  <select
                    className="w-full border rounded px-2 py-1.5 text-sm"
                    value={item.projectSlug || ''}
                    onChange={(e) => {
                      const slug = e.target.value || null
                      updateItem(pIdx, iIdx, 'projectSlug', slug)
                      if (slug) linkToProject(pIdx, iIdx, slug)
                    }}
                  >
                    <option value="">— Свой вариант —</option>
                    {projects.map((pr) => (
                      <option key={pr.slug} value={pr.slug}>
                        {pr.title} ({new Intl.NumberFormat('ru-RU').format(pr.priceFrom)} ₽)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                  <input
                    className="w-full border rounded px-2 py-1.5 text-sm"
                    placeholder="Например: Комплекс барбекю 585"
                    value={item.title || ''}
                    onChange={(e) => updateItem(pIdx, iIdx, 'title', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Фото</label>
                  <ImageUploader
                    value={item.image || ''}
                    onChange={(url) => updateItem(pIdx, iIdx, 'image', url || '/images/1.png')}
                    placeholder="URL или загрузить"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Площадь (м²)</label>
                    <input
                      type="number"
                      className="w-full border rounded px-2 py-1.5 text-sm"
                      placeholder="0"
                      value={item.area || ''}
                      onChange={(e) =>
                        updateItem(pIdx, iIdx, 'area', Number(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Цена (₽)</label>
                    <input
                      type="number"
                      className="w-full border rounded px-2 py-1.5 text-sm"
                      placeholder="0"
                      value={item.priceFrom || ''}
                      onChange={(e) =>
                        updateItem(pIdx, iIdx, 'priceFrom', Number(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>

                {item.id && (
                  <Link
                    href={`/admin/popular/${item.id}`}
                    className="block text-center text-sm text-blue-600 hover:underline"
                  >
                    Расширенные настройки →
                  </Link>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => addItem(pIdx)}
            disabled={panel.items.length >= 6}
            className="px-3 py-2 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Добавить карточку
          </button>
        </div>
      ))}
    </div>
  )
}
