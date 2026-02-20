'use client'

import { useEffect, useState } from 'react'
import AdminTopBar from '@/components/admin/AdminTopBar'
import ImageUploader from '@/components/admin/ImageUploader'
import AdditionalImagesField from '@/components/admin/AdditionalImagesField'

interface PopularItem { id?: string; title: string; image: string; images?: string[]; area: number; material: string; priceFrom: number; priceTo?: number | null; order?: number; projectSlug?: string | null; buildTime?: number; subsectionId?: string | null; subsubsectionId?: string | null }
interface PopularPanel { id?: string; title: string; order?: number; items: PopularItem[] }
interface Project { id: string; slug: string; title: string }

const emptyItem = (): PopularItem => ({ title: '', image: '/images/1.png', images: [], area: 50, material: '', priceFrom: 0, priceTo: null, projectSlug: null, buildTime: 0, subsectionId: null, subsubsectionId: null })

export default function PopularEditorPage() {
  const [panels, setPanels] = useState<PopularPanel[]>([])
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [catalogSections, setCatalogSections] = useState<{ id: string; title: string; subsections: { id: string; sectionId: string; title: string }[] }[]>([])

  const loadCatalogSections = async () => {
    try {
      const res = await fetch('/api/admin/catalog/sections', { cache: 'no-store' })
      if (res.ok) setCatalogSections(await res.json())
    } catch (err) {
      console.error('Error loading catalog sections:', err)
    }
  }

  const load = async () => {
    const res = await fetch('/api/admin/popular')
    if (res.ok) setPanels(await res.json()); else setPanels([{ title: 'Панель 1', items: [] }])
  }

  const loadProjects = async () => {
    const res = await fetch('/api/projects')
    if (res.ok) {
      const data = await res.json()
      setProjects(data.map((p: any) => ({ id: p.id, slug: p.id, title: p.title })))
    }
  }

  useEffect(() => {
    load()
    loadProjects()
    loadCatalogSections()
  }, [])

  const addPanel = () => {
    if (panels.length >= 2) return
    setPanels(p => [...p, { title: `Панель ${p.length + 1}`, items: [] }])
  }
  const removePanel = (idx: number) => setPanels(p => p.filter((_, i) => i !== idx))
  const addItem = (pIdx: number) => setPanels(ps => ps.map((p, i) => i === pIdx ? { ...p, items: p.items.length < 6 ? [...p.items, emptyItem()] : p.items } : p))
  const removeItem = (pIdx: number, iIdx: number) => setPanels(ps => ps.map((p, i) => i === pIdx ? { ...p, items: p.items.filter((_, j) => j !== iIdx) } : p))

  const save = async () => {
    setLoading(true)
    try {
      const payload = panels.map((p, idx) => ({ ...p, order: idx, items: p.items.map((it, j) => ({ ...it, order: j })) }))
      console.log('[SAVE POPULAR] Sending POST request:', payload)
      const res = await fetch('/api/admin/popular', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      })
      console.log('[SAVE POPULAR] Response status:', res.status)
      setLoading(false)
      if (res.ok) {
        const result = await res.json()
        console.log('[SAVE POPULAR] Success:', result)
        // Принудительно перезагружаем данные, игнорируя кэш
        await fetch('/api/admin/popular', { cache: 'no-store' })
          .then(r => r.json())
          .then(data => {
            console.log('[SAVE POPULAR] Reloaded data:', data)
            setPanels(data)
          })
        alert('✅ Популярные товары успешно сохранены!')
      } else {
        const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        console.error('[SAVE POPULAR] Error:', errorData)
        alert(`❌ Ошибка сохранения: ${errorData.error || 'Неизвестная ошибка'}`)
      }
    } catch (err) {
      console.error('[SAVE POPULAR] Exception:', err)
      setLoading(false)
      alert(`❌ Ошибка: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`)
    }
  }

  return (
    <div className="space-y-6">
      <AdminTopBar title="Популярные товары" backHref="/admin/changes" actions={
        <>
          <button onClick={addPanel} disabled={panels.length >= 2} className="px-3 py-1.5 bg-[#5D4E37] text-white rounded disabled:opacity-50">Добавить панель</button>
          <button onClick={save} disabled={loading} className="px-3 py-1.5 bg-gray-900 text-white rounded">Сохранить</button>
        </>
      } />

      {panels.map((panel, pIdx) => (
        <div key={pIdx} className="bg-white border rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-3">
            <input className="border rounded px-3 py-2 flex-1" placeholder="Заголовок панели" value={panel.title} onChange={e => setPanels(ps => ps.map((p, i) => i === pIdx ? { ...p, title: e.target.value } : p))} />
            <button onClick={() => removePanel(pIdx)} className="px-3 py-2 text-red-600 border border-red-200 rounded">Удалить панель</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {panel.items.map((item, iIdx) => (
              <div key={iIdx} className="border rounded p-3 space-y-3">
                <div className="space-y-3">
                  {/* Название */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Название товара</label>
                    <input
                      className="w-full border rounded px-2 py-1"
                      type="text"
                      placeholder="Например: Насос погружной скважинный"
                      value={item.title || ''}
                      onChange={e => setPanels(ps => ps.map((p, i) => i === pIdx ? { ...p, items: p.items.map((it, j) => j === iIdx ? { ...it, title: e.target.value } : it) } : p))}
                    />
                  </div>

                  {/* Фото */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Фото</label>
                    <ImageUploader
                      value={item.image || ''}
                      onChange={(url) => setPanels(ps => ps.map((p, i) => i === pIdx ? { ...p, items: p.items.map((it, j) => j === iIdx ? { ...it, image: url || '/images/1.png' } : it) } : p))}
                      placeholder="URL или загрузить"
                    />
                  </div>

                  {/* Дополнительные изображения */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Дополнительные изображения</label>
                    <AdditionalImagesField
                      value={item.images || []}
                      onChange={(urls) => setPanels(ps => ps.map((p, i) => i === pIdx ? { ...p, items: p.items.map((it, j) => j === iIdx ? { ...it, images: urls } : it) } : p))}
                      placeholder="URL или загрузить"
                    />
                  </div>

                  {/* Диаметр */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Диаметр (мм)</label>
                    <input 
                      className="w-full border rounded px-2 py-1" 
                      type="number" 
                      placeholder="Введите диаметр в миллиметрах" 
                      value={item.area} 
                      onChange={e => setPanels(ps => ps.map((p, i) => i === pIdx ? { ...p, items: p.items.map((it, j) => j === iIdx ? { ...it, area: Number(e.target.value) } : it) } : p))} 
                    />
                  </div>

                  {/* Длина */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Длина (м)</label>
                    <input 
                      className="w-full border rounded px-2 py-1" 
                      type="number" 
                      placeholder="Введите длину в метрах" 
                      value={item.buildTime || ''} 
                      onChange={e => setPanels(ps => ps.map((p, i) => i === pIdx ? { ...p, items: p.items.map((it, j) => j === iIdx ? { ...it, buildTime: Number(e.target.value) } : it) } : p))} 
                    />
                  </div>

                  {/* Материал */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Материал</label>
                    <input 
                      className="w-full border rounded px-2 py-1" 
                      placeholder="Введите материал" 
                      value={item.material} 
                      onChange={e => setPanels(ps => ps.map((p, i) => i === pIdx ? { ...p, items: p.items.map((it, j) => j === iIdx ? { ...it, material: e.target.value } : it) } : p))} 
                    />
                  </div>

                  {/* Цена */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Цена (₽)</label>
                    <input 
                      className="w-full border rounded px-2 py-1" 
                      type="number" 
                      placeholder="Введите цену в рублях" 
                      value={item.priceFrom} 
                      onChange={e => setPanels(ps => ps.map((p, i) => i === pIdx ? { ...p, items: p.items.map((it, j) => j === iIdx ? { ...it, priceFrom: Number(e.target.value) } : it) } : p))} 
                    />
                  </div>

                  {/* Раздел и подраздел каталога */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Раздел / Подраздел / Подраздел подраздела</label>
                    {(() => {
                      const allSubsections = (catalogSections || []).flatMap((s: any) => (s.subsections || []).map((sb: any) => ({ ...sb, _sectionId: s.id })))
                      const allSubsubsections = allSubsections.flatMap((sb: any) => (sb.subsubsections || []).map((ss: any) => ({ ...ss, _subsectionId: sb.id, _sectionId: sb._sectionId })))
                      let currentSectionId = (item as any)._sectionId || ''
                      let currentSubsectionId = (item as any)._subsectionId || item.subsectionId || ''
                      if (item.subsubsectionId) {
                        const ss = allSubsubsections.find((x: any) => x.id === item.subsubsectionId)
                        if (ss) { currentSubsectionId = ss._subsectionId; currentSectionId = ss._sectionId }
                      } else if (item.subsectionId) {
                        const sb = allSubsections.find((x: any) => x.id === item.subsectionId)
                        if (sb) currentSectionId = sb._sectionId
                      }
                      const subsections = currentSectionId ? (catalogSections.find((s: any) => s.id === currentSectionId)?.subsections || []) : []
                      const subsubsections = currentSubsectionId ? (subsections.find((sb: any) => sb.id === currentSubsectionId)?.subsubsections || []) : []
                      return (
                        <div className="grid grid-cols-1 gap-2">
                          <select
                            className="w-full border rounded px-2 py-1 text-sm"
                            value={currentSectionId}
                            onChange={e => setPanels(ps => ps.map((p, i) => i === pIdx ? { ...p, items: p.items.map((it, j) => j === iIdx ? { ...it, _sectionId: e.target.value || '', _subsectionId: '', subsectionId: null, subsubsectionId: null } : it) } : p))}
                          >
                            <option value="">— Не выбран —</option>
                            {(catalogSections || []).map((s: any) => (
                              <option key={s.id} value={s.id}>{s.title}</option>
                            ))}
                          </select>
                          <select
                            className="w-full border rounded px-2 py-1 text-sm"
                            value={currentSubsectionId}
                            onChange={e => {
                              const val = e.target.value || null
                              setPanels(ps => ps.map((p, i) => i === pIdx ? { ...p, items: p.items.map((it, j) => j === iIdx ? { ...it, _subsectionId: val || '', subsectionId: val, subsubsectionId: null } : it) } : p))
                            }}
                            disabled={!currentSectionId}
                          >
                            <option value="">— Не выбран —</option>
                            {subsections.map((sb: any) => (
                              <option key={sb.id} value={sb.id}>{sb.title}</option>
                            ))}
                          </select>
                          <select
                            className="w-full border rounded px-2 py-1 text-sm"
                            value={item.subsubsectionId || ''}
                            onChange={e => {
                              const val = e.target.value || null
                              setPanels(ps => ps.map((p, i) => i === pIdx ? { ...p, items: p.items.map((it, j) => j === iIdx ? { ...it, subsubsectionId: val || null, subsectionId: val ? null : (currentSubsectionId || null) } : it) } : p))
                            }}
                            disabled={!currentSubsectionId}
                          >
                            <option value="">— Не выбран —</option>
                            {subsubsections.map((ss: any) => (
                              <option key={ss.id} value={ss.id}>{ss.title}</option>
                            ))}
                          </select>
                        </div>
                      )
                    })()}
                  </div>
                </div>
                <div className="flex justify-end">
                  <button onClick={() => removeItem(pIdx, iIdx)} className="px-3 py-1 text-red-600 border border-red-200 rounded">Удалить</button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => addItem(pIdx)} disabled={panel.items.length >= 6} className="px-3 py-2 border rounded">Добавить карточку</button>
        </div>
      ))}
    </div>
  )
}


