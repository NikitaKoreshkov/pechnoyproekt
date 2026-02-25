'use client'

import { useEffect, useState } from 'react'
import AdminTopBar from '@/components/admin/AdminTopBar'
import { slugFromTitle } from '@/lib/slug'

interface Subsubsection {
  id: string
  title: string
  slug: string
  order: number
}

interface Subsection {
  id: string
  title: string
  slug: string
  order: number
  subsubsections?: Subsubsection[]
}

interface Section {
  id: string
  title: string
  slug: string
  order: number
  subsections: Subsection[]
}

export default function CatalogStructurePage() {
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [newSubsectionTitle, setNewSubsectionTitle] = useState<Record<string, string>>({})
  const [newSubsubsectionTitle, setNewSubsubsectionTitle] = useState<Record<string, string>>({})
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [editingSubsection, setEditingSubsection] = useState<string | null>(null)
  const [editingSubsubsection, setEditingSubsubsection] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/catalog/sections', { cache: 'no-store', credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setSections(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const createSection = async () => {
    const title = newSectionTitle.trim()
    if (!title) return
    try {
      const res = await fetch('/api/admin/catalog/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, slug: slugFromTitle(title) })
      })
      if (res.ok) {
        setNewSectionTitle('')
        await load()
      } else {
        const err = await res.json()
        alert(err.error || 'Ошибка создания раздела')
      }
    } catch (e) {
      alert('Ошибка: ' + (e instanceof Error ? e.message : 'Неизвестная ошибка'))
    }
  }

  const createSubsection = async (sectionId: string) => {
    const title = (newSubsectionTitle[sectionId] || '').trim()
    if (!title) return
    try {
      const res = await fetch('/api/admin/catalog/subsections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sectionId, title, slug: slugFromTitle(title) })
      })
      if (res.ok) {
        setNewSubsectionTitle((prev) => ({ ...prev, [sectionId]: '' }))
        await load()
      } else {
        const err = await res.json()
        alert(err.error || 'Ошибка создания подраздела')
      }
    } catch (e) {
      alert('Ошибка: ' + (e instanceof Error ? e.message : 'Неизвестная ошибка'))
    }
  }

  const updateSection = async (id: string) => {
    const title = editTitle.trim()
    if (!title) return
    try {
      const res = await fetch(`/api/admin/catalog/sections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, slug: slugFromTitle(title) })
      })
      if (res.ok) {
        setEditingSection(null)
        await load()
      } else {
        const err = await res.json()
        alert(err.error || 'Ошибка обновления')
      }
    } catch (e) {
      alert('Ошибка: ' + (e instanceof Error ? e.message : 'Неизвестная ошибка'))
    }
  }

  const updateSubsection = async (id: string) => {
    const title = editTitle.trim()
    if (!title) return
    try {
      const res = await fetch(`/api/admin/catalog/subsections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, slug: slugFromTitle(title) })
      })
      if (res.ok) {
        setEditingSubsection(null)
        await load()
      } else {
        const err = await res.json()
        alert(err.error || 'Ошибка обновления')
      }
    } catch (e) {
      alert('Ошибка: ' + (e instanceof Error ? e.message : 'Неизвестная ошибка'))
    }
  }

  const deleteSection = async (id: string) => {
    if (!confirm('Удалить раздел? Подразделы и привязки товаров будут затронуты.')) return
    try {
      const res = await fetch(`/api/admin/catalog/sections/${id}`, { method: 'DELETE', credentials: 'include' })
      if (res.ok) await load()
      else {
        const err = await res.json()
        alert(err.error || 'Ошибка удаления')
      }
    } catch (e) {
      alert('Ошибка: ' + (e instanceof Error ? e.message : 'Неизвестная ошибка'))
    }
  }

  const deleteSubsection = async (id: string) => {
    if (!confirm('Удалить подраздел? Товары и подразделы подразделов будут затронуты.')) return
    try {
      const res = await fetch(`/api/admin/catalog/subsections/${id}`, { method: 'DELETE', credentials: 'include' })
      if (res.ok) await load()
      else {
        const err = await res.json()
        alert(err.error || 'Ошибка удаления')
      }
    } catch (e) {
      alert('Ошибка: ' + (e instanceof Error ? e.message : 'Неизвестная ошибка'))
    }
  }

  const createSubsubsection = async (subsectionId: string) => {
    const title = (newSubsubsectionTitle[subsectionId] || '').trim()
    if (!title) return
    try {
      const res = await fetch('/api/admin/catalog/subsubsections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subsectionId, title, slug: slugFromTitle(title) })
      })
      if (res.ok) {
        setNewSubsubsectionTitle((prev) => ({ ...prev, [subsectionId]: '' }))
        await load()
      } else {
        const err = await res.json()
        alert(err.error || 'Ошибка создания')
      }
    } catch (e) {
      alert('Ошибка: ' + (e instanceof Error ? e.message : 'Неизвестная ошибка'))
    }
  }

  const updateSubsubsection = async (id: string) => {
    const title = editTitle.trim()
    if (!title) return
    try {
      const res = await fetch(`/api/admin/catalog/subsubsections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, slug: slugFromTitle(title) })
      })
      if (res.ok) {
        setEditingSubsubsection(null)
        await load()
      } else {
        const err = await res.json()
        alert(err.error || 'Ошибка обновления')
      }
    } catch (e) {
      alert('Ошибка: ' + (e instanceof Error ? e.message : 'Неизвестная ошибка'))
    }
  }

  const deleteSubsubsection = async (id: string) => {
    if (!confirm('Удалить подраздел подраздела? Товары останутся без привязки.')) return
    try {
      const res = await fetch(`/api/admin/catalog/subsubsections/${id}`, { method: 'DELETE', credentials: 'include' })
      if (res.ok) await load()
      else {
        const err = await res.json()
        alert(err.error || 'Ошибка удаления')
      }
    } catch (e) {
      alert('Ошибка: ' + (e instanceof Error ? e.message : 'Неизвестная ошибка'))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <span className="text-gray-600">Загрузка...</span>
      </div>
    )
  }

  return (
    <>
      <AdminTopBar title="Настройка каталога" backHref="/admin/changes" />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Создать раздел */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Добавить раздел</h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Название раздела"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createSection()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A5F] focus:border-[#1E3A5F]"
            />
            <button
              onClick={createSection}
              disabled={!newSectionTitle.trim()}
              className="px-4 py-2 bg-[#1E3A5F] text-white rounded-lg font-medium hover:bg-[#152a47] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Создать раздел
            </button>
          </div>
        </div>

        {/* Список разделов и подразделов */}
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Заголовок раздела */}
              <div className="flex items-center justify-between gap-4 p-4 bg-gray-50 border-b border-gray-200">
                {editingSection === section.id ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && updateSection(section.id)}
                      className="flex-1 px-3 py-2 border rounded-lg"
                      autoFocus
                    />
                    <button onClick={() => updateSection(section.id)} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm">
                      Сохранить
                    </button>
                    <button onClick={() => setEditingSection(null)} className="px-3 py-1.5 text-gray-600 hover:bg-gray-200 rounded-lg text-sm">
                      Отмена
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <span className="font-semibold text-gray-900">{section.title}</span>
                      <span className="ml-2 text-sm text-gray-500">/{section.slug}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingSection(section.id); setEditTitle(section.title) }} className="p-1.5 text-gray-600 hover:bg-gray-200 rounded">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button onClick={() => deleteSection(section.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Подразделы */}
              <div className="p-4 space-y-4">
                {section.subsections.map((sub) => (
                  <div key={sub.id} className="border border-gray-100 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between py-2 px-3 bg-gray-50/50">
                      {editingSubsection === sub.id ? (
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && updateSubsection(sub.id)}
                            className="flex-1 px-3 py-2 border rounded-lg text-sm"
                            autoFocus
                          />
                          <button onClick={() => updateSubsection(sub.id)} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm">
                            Сохранить
                          </button>
                          <button onClick={() => setEditingSubsection(null)} className="px-3 py-1.5 text-gray-600 hover:bg-gray-200 rounded-lg text-sm">
                            Отмена
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">{sub.title}</span>
                            <span className="text-xs text-gray-400">/{sub.slug}</span>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => { setEditingSubsection(sub.id); setEditTitle(sub.title) }} className="p-1 text-gray-500 hover:bg-gray-200 rounded">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button onClick={() => deleteSubsection(sub.id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    {/* Подразделы подразделов (третий уровень) */}
                    <div className="pl-4 pr-3 py-2 space-y-2">
                      {(sub.subsubsections || []).map((ss) => (
                        <div key={ss.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50">
                          {editingSubsubsection === ss.id ? (
                            <div className="flex-1 flex gap-2">
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && updateSubsubsection(ss.id)}
                                className="flex-1 px-2 py-1.5 border rounded text-sm"
                                autoFocus
                              />
                              <button onClick={() => updateSubsubsection(ss.id)} className="px-2 py-1 bg-green-600 text-white rounded text-xs">Сохранить</button>
                              <button onClick={() => setEditingSubsubsection(null)} className="px-2 py-1 text-gray-600 hover:bg-gray-200 rounded text-xs">Отмена</button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">{ss.title}</span>
                                <span className="text-xs text-gray-400">/{ss.slug}</span>
                              </div>
                              <div className="flex gap-1">
                                <button onClick={() => { setEditingSubsubsection(ss.id); setEditTitle(ss.title) }} className="p-0.5 text-gray-400 hover:bg-gray-200 rounded">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                                <button onClick={() => deleteSubsubsection(ss.id)} className="p-0.5 text-red-400 hover:bg-red-50 rounded">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="Новый подраздел подраздела..."
                          value={newSubsubsectionTitle[sub.id] || ''}
                          onChange={(e) => setNewSubsubsectionTitle((prev) => ({ ...prev, [sub.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && createSubsubsection(sub.id)}
                          className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-sm"
                        />
                        <button
                          onClick={() => createSubsubsection(sub.id)}
                          disabled={!(newSubsubsectionTitle[sub.id] || '').trim()}
                          className="px-2 py-1.5 bg-gray-100 text-gray-600 rounded text-xs font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          + Подраздел
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Добавить подраздел */}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <input
                    type="text"
                    placeholder="Новый подраздел..."
                    value={newSubsectionTitle[section.id] || ''}
                    onChange={(e) => setNewSubsectionTitle((prev) => ({ ...prev, [section.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && createSubsection(section.id)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A5F] focus:border-[#1E3A5F]"
                  />
                  <button
                    onClick={() => createSubsection(section.id)}
                    disabled={!(newSubsectionTitle[section.id] || '').trim()}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Добавить подраздел
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {sections.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            Нет разделов. Создайте первый раздел выше.
          </div>
        )}
      </div>
    </>
  )
}
