'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import AdminTopBar from '@/components/admin/AdminTopBar'

interface ProjectListItem {
  id: string
  slug: string
  title: string
  area: number
  priceFrom: number
  image: string
}

interface CatalogSubsubsection {
  id: string
  title: string
  slug: string
  order: number
}

interface CatalogSubsection {
  id: string
  title: string
  slug: string
  order: number
  subsubsections?: CatalogSubsubsection[]
}

interface CatalogSection {
  id: string
  title: string
  slug: string
  order: number
  subsections: CatalogSubsection[]
}

export default function AdminProjectsPage() {
  const [items, setItems] = useState<ProjectListItem[]>([])
  const [sections, setSections] = useState<CatalogSection[]>([])
  const [sectionId, setSectionId] = useState<string | null>(null)
  const [subsectionId, setSubsectionId] = useState<string | null>(null)
  const [subsubsectionId, setSubsubsectionId] = useState<string | null>(null)
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [popularItems, setPopularItems] = useState<{ projectSlug?: string | null }[]>([])
  const [addingSlug, setAddingSlug] = useState<string | null>(null)

  const loadPopular = async () => {
    const res = await fetch('/api/admin/popular', { cache: 'no-store' })
    if (res.ok) {
      const panels = await res.json()
      const all = panels.flatMap((p: { items?: { projectSlug?: string | null }[] }) => p.items || [])
      setPopularItems(all)
    } else setPopularItems([])
  }

  const loadProjects = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (subsubsectionId) params.set('subsubsectionId', subsubsectionId)
    else if (subsectionId) params.set('subsectionId', subsectionId)
    else if (sectionId) params.set('sectionId', sectionId)
    const res = await fetch(`/api/admin/projects?${params}`, { cache: 'no-store' })
    if (res.ok) setItems(await res.json())
    else setItems([])
    setLoading(false)
  }

  const loadSections = async () => {
    const res = await fetch('/api/admin/catalog/sections', { cache: 'no-store' })
    if (res.ok) setSections(await res.json())
    else setSections([])
  }

  useEffect(() => {
    loadSections()
    loadPopular()
  }, [])

  useEffect(() => {
    loadProjects()
  }, [sectionId, subsectionId, subsubsectionId])

  const remove = async (id: string) => {
    if (!confirm('Удалить проект?')) return
    try {
      const res = await fetch(`/api/admin/projects/${id}`, { method: 'DELETE' })
      if (res.ok) {
        await loadProjects()
        alert('✅ Проект удалён')
      } else {
        const err = await res.json().catch(() => ({}))
        alert(`❌ ${err.error || 'Ошибка удаления'}`)
      }
    } catch (e) {
      alert(`❌ ${e instanceof Error ? e.message : 'Ошибка'}`)
    }
  }

  const togglePopular = async (slug: string) => {
    if (addingSlug) return
    const isPopular = popularItems.some((i) => i.projectSlug === slug)
    const total = popularItems.length
    if (!isPopular && total >= 6) {
      alert('Максимум 6 популярных товаров')
      return
    }
    setAddingSlug(slug)
    try {
      const url = isPopular ? '/api/admin/popular/remove-project' : '/api/admin/popular/add-project'
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectSlug: slug })
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        await loadPopular()
        alert(isPopular ? '✅ Убрано из популярных' : '✅ Добавлено в популярные')
      } else {
        alert(`❌ ${data.error || 'Ошибка'}`)
      }
    } catch (e) {
      alert(`❌ ${e instanceof Error ? e.message : 'Ошибка'}`)
    } finally {
      setAddingSlug(null)
    }
  }

  const clearFilter = () => {
    setSectionId(null)
    setSubsectionId(null)
    setSubsubsectionId(null)
    setExpandedSectionId(null)
  }

  const visibleSubsections = (subs: CatalogSubsection[]) =>
    subs.filter((s) => s.title !== 'Проекты')

  return (
    <div className="space-y-6">
      <AdminTopBar title="Все проекты" backHref="/admin/catalog" />

      {/* Разделы и подразделы */}
      <div className="bg-white border rounded-xl p-4">
        <h2 className="text-lg font-semibold mb-3">По разделам</h2>
        {(sectionId || subsectionId || subsubsectionId) && (
          <button
            onClick={clearFilter}
            className="mb-3 px-3 py-1 text-sm text-amber-700 border border-amber-300 rounded hover:bg-amber-50"
          >
            Сбросить фильтр
          </button>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={clearFilter}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !sectionId && !subsectionId && !subsubsectionId
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Все проекты
          </button>
          {sections.map((section) => {
            const isExpanded = expandedSectionId === section.id
            const subs = visibleSubsections(section.subsections || [])
            return (
              <div key={section.id} className="relative">
                <button
                  onClick={() =>
                    setExpandedSectionId((id) =>
                      id === section.id ? null : section.id
                    )
                  }
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sectionId === section.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {section.title} ▾
                </button>
                {isExpanded && subs.length > 0 && (
                  <div className="absolute top-full left-0 mt-1 min-w-[200px] bg-white border rounded-lg shadow-lg py-1 z-10">
                    <button
                      onClick={() => {
                        setSectionId(section.id)
                        setSubsectionId(null)
                        setSubsubsectionId(null)
                        setExpandedSectionId(null)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      Все проекты раздела
                    </button>
                    {subs.map((sub) => {
                      const hasSubsub = (sub.subsubsections || []).length > 0
                      return (
                        <div key={sub.id}>
                          <button
                            onClick={() => {
                              setSectionId(null)
                              setSubsectionId(sub.id)
                              setSubsubsectionId(null)
                              setExpandedSectionId(null)
                            }}
                            className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                              subsectionId === sub.id ? 'font-medium bg-gray-50' : ''
                            }`}
                          >
                            {sub.title}
                          </button>
                          {hasSubsub &&
                            (sub.subsubsections || []).map((ss) => (
                              <button
                                key={ss.id}
                                onClick={() => {
                                  setSectionId(null)
                                  setSubsectionId(null)
                                  setSubsubsectionId(ss.id)
                                  setExpandedSectionId(null)
                                }}
                                className={`block w-full text-left pl-8 py-1.5 text-xs hover:bg-gray-50 ${
                                  subsubsectionId === ss.id ? 'font-medium bg-gray-50' : ''
                                }`}
                              >
                                {ss.title}
                              </button>
                            ))}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Таблица проектов */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <h2 className="text-lg font-semibold p-4 border-b">
          Проекты {sectionId || subsectionId || subsubsectionId ? `(${items.length})` : ''}
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left bg-gray-50">
                <th className="p-3">Превью</th>
                <th className="p-3">Название</th>
                <th className="p-3">Slug</th>
                <th className="p-3">Площадь</th>
                <th className="p-3">Цена</th>
                <th className="p-3">Действия</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Загрузка…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Нет проектов
                  </td>
                </tr>
              ) : (
                items.map((p) => {
                  const isPopular = popularItems.some((i) => i.projectSlug === p.slug)
                  const totalPopular = popularItems.length
                  const canAdd = totalPopular < 6 && !isPopular
                  const atLimit = totalPopular >= 6 && !isPopular
                  return (
                    <tr key={p.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">
                        <img
                          src={p.image?.startsWith('/') || p.image?.startsWith('http') ? p.image : '/images/1.png'}
                          alt={p.title}
                          className="w-16 h-12 object-cover rounded"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/images/1.png' }}
                        />
                      </td>
                      <td className="p-3 font-medium">{p.title}</td>
                      <td className="p-3">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {p.slug}
                        </code>
                      </td>
                      <td className="p-3">{p.area} м²</td>
                      <td className="p-3 font-semibold">
                        {new Intl.NumberFormat('ru-RU').format(p.priceFrom)} ₽
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2 flex-wrap">
                          <Link
                            href={`/admin/projects/${p.slug}`}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                          >
                            Редактировать
                          </Link>
                          <button
                            type="button"
                            onClick={() => (isPopular || canAdd) && togglePopular(p.slug)}
                            disabled={atLimit || !!addingSlug}
                            title={isPopular ? 'Убрать из популярных' : atLimit ? 'Максимум 6 популярных' : 'Добавить в популярные'}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                              isPopular
                                ? 'bg-green-600 text-white border-0 cursor-default'
                                : atLimit
                                  ? 'bg-gray-100 text-gray-400 border border-gray-300 cursor-not-allowed'
                                  : canAdd
                                    ? 'bg-white text-amber-600 border-2 border-amber-500 hover:bg-amber-50'
                                    : 'bg-gray-100 text-gray-400 border border-gray-300 cursor-not-allowed'
                            }`}
                          >
                            {addingSlug === p.slug ? '…' : isPopular ? 'Популярный' : atLimit ? 'Лимит (6/6)' : 'Добавить в популярные'}
                          </button>
                          <button
                            onClick={() => remove(p.id)}
                            className="px-3 py-1 text-red-600 border border-red-200 rounded hover:bg-red-50 text-sm"
                          >
                            Удалить
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
