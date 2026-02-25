'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminTopBar from '@/components/admin/AdminTopBar'
import ImageUploader from '@/components/admin/ImageUploader'
import AdditionalImagesField from '@/components/admin/AdditionalImagesField'
export default function AddProjectPage() {
  const router = useRouter()
  const [catalogSections, setCatalogSections] = useState<any[]>([])
  const [form, setForm] = useState<any>({
    slug: '',
    title: '',
    priceFrom: 0,
    image: '/images/1.png',
    images: [],
    tags: [],
    description: '',
    advantages: [],
    characteristics: [] as { name: string; value: string }[],
    videoUrl: '',
    subsectionId: null as string | null,
    subsubsectionId: null as string | null,
    sectionId: '' as string,
    _subsectionId: '' as string,
    specs: null,
    filterValues: null,
  })

  const loadCatalogSections = async () => {
    try {
      const res = await fetch('/api/admin/catalog/sections', { cache: 'no-store' })
      if (res.ok) setCatalogSections(await res.json())
    } catch (err) {
      console.error('Error loading catalog sections:', err)
    }
  }

  useEffect(() => {
    loadCatalogSections()
  }, [])

  const create = async () => {
    if (!form.title?.trim()) {
      alert('❌ Укажите название проекта')
      return
    }
    const titleToUse = form.title.trim()
    const slugVal = typeof form.slug === 'string' ? form.slug.trim() : ''
    if (slugVal && !/^[a-z0-9-]+$/.test(slugVal)) {
      alert('❌ Slug может содержать только латиницу, цифры и дефисы. Оставьте пустым — сгенерируется из названия.')
      return
    }
    const subsub = form.subsubsectionId ? allSubsubsections.find((x: any) => x.id === form.subsubsectionId) : null
    const subsectionIdToSend = form.subsubsectionId && subsub ? subsub._subsectionId : form.subsectionId
    const technicalSpecs = (form.characteristics || [])
      .filter((c: { name: string; value: string }) => c.name?.trim())
      .map((c: { name: string; value: string }) => `${c.name.trim()}: ${(c.value || '').trim()}`)
      .join('\n')
    const formData = {
      ...form,
      title: titleToUse,
      image: form.image || '/images/1.png',
      slug: slugVal || undefined,
      area: 20,
      priceFrom: Number(form.priceFrom) || 0,
      priceTo: null,
      buildTime: 14,
      material: 'кирпич',
      completion: 'под ключ',
      region: 'Москва',
      videoUrl: form.videoUrl?.trim() || null,
      technicalSpecs: technicalSpecs || null,
      subsectionId: subsectionIdToSend || null,
      subsubsectionId: form.subsubsectionId || null,
    }
    try {
      const res = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        const result = await res.json()
        try {
          if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            const ch = new BroadcastChannel('projects-updated')
            ch.postMessage({ type: 'projects-updated', ts: Date.now(), slug: result.slug })
            ch.close()
          }
          try {
            localStorage.setItem('projects-updated', String(Date.now()))
          } catch {}
        } catch {}
        alert('✅ Проект создан! Slug: ' + (result.slug || '—'))
        router.push('/admin/catalog')
      } else {
        const data = await res.json().catch(() => ({}))
        const msg = data.error || data.details || 'Ошибка создания'
        alert(`❌ ${msg}`)
      }
    } catch (err) {
      alert(`❌ ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`)
    }
  }

  const allSubsections = (catalogSections || []).flatMap((s: any) => (s.subsections || []).map((sb: any) => ({ ...sb, _sectionId: s.id })))
  const allSubsubsections = allSubsections.flatMap((sb: any) => (sb.subsubsections || []).map((ss: any) => ({ ...ss, _subsectionId: sb.id, _sectionId: sb._sectionId })))
  let currentSectionId = form.sectionId || ''
  let currentSubsectionId = form._subsectionId || form.subsectionId || ''
  if (form.subsubsectionId) {
    const ss = allSubsubsections.find((x: any) => x.id === form.subsubsectionId)
    if (ss) {
      currentSubsectionId = ss._subsectionId
      currentSectionId = ss._sectionId
    }
  } else if (form.subsectionId) {
    const sb = allSubsections.find((x: any) => x.id === form.subsectionId)
    if (sb) currentSectionId = sb._sectionId
  }
  const subsections = currentSectionId ? (catalogSections.find((s: any) => s.id === currentSectionId)?.subsections || []) : []
  const subsubsections = currentSubsectionId ? (subsections.find((sb: any) => sb.id === currentSubsectionId)?.subsubsections || []) : []

  const characteristics = form.characteristics || []

  return (
    <div className="space-y-6">
      <AdminTopBar
        title="Добавить проект"
        backHref="/admin/catalog"
        actions={
          <button onClick={create} className="px-4 py-2 bg-[#5D4E37] text-white rounded hover:bg-[#4a3d2a] transition">
            Создать проект
          </button>
        }
      />

      <section className="bg-white border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">Основная информация</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Название проекта</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="text"
            placeholder="Например: Комплекс барбекю 872"
            value={form.title || ''}
            onChange={(e) => setForm((f: any) => ({ ...f, title: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Фото проекта</label>
          <ImageUploader
            value={form.image || ''}
            onChange={(url) => setForm((f: any) => ({ ...f, image: url || '/images/1.png' }))}
            placeholder="URL или загрузить файл"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Дополнительные изображения</label>
          <AdditionalImagesField
            value={form.images || []}
            onChange={(urls) => setForm((f: any) => ({ ...f, images: urls }))}
            placeholder="URL или загрузить"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Цена (₽)</label>
          <input
            className="w-full border rounded px-3 py-2 max-w-xs"
            type="number"
            placeholder="0"
            value={form.priceFrom ?? ''}
            onChange={(e) => setForm((f: any) => ({ ...f, priceFrom: Number(e.target.value) || 0 }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ссылка на видео</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="text"
            placeholder="https://..."
            value={form.videoUrl || ''}
            onChange={(e) => setForm((f: any) => ({ ...f, videoUrl: e.target.value }))}
          />
        </div>
      </section>

      <section className="bg-white border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">Характеристики</h2>
        <p className="text-sm text-gray-500">Добавьте название раздела и значение. Например: Габариты — 1400мм×770мм, Количество кирпичей — 550 шт.</p>
        {characteristics.map((c: { name: string; value: string }, idx: number) => (
          <div key={idx} className="flex gap-3 items-center">
            <input
              className="flex-1 border rounded px-3 py-2"
              placeholder="Название (например: Габариты)"
              value={c.name || ''}
              onChange={(e) =>
                setForm((f: any) => ({
                  ...f,
                  characteristics: (f.characteristics || []).map((x: { name: string; value: string }, i: number) =>
                    i === idx ? { ...x, name: e.target.value } : x
                  ),
                }))
              }
            />
            <input
              className="flex-1 border rounded px-3 py-2"
              placeholder="Значение (например: 1400мм×770мм)"
              value={c.value || ''}
              onChange={(e) =>
                setForm((f: any) => ({
                  ...f,
                  characteristics: (f.characteristics || []).map((x: { name: string; value: string }, i: number) =>
                    i === idx ? { ...x, value: e.target.value } : x
                  ),
                }))
              }
            />
            <button
              onClick={() =>
                setForm((f: any) => ({
                  ...f,
                  characteristics: (f.characteristics || []).filter((_: any, i: number) => i !== idx),
                }))
              }
              className="px-3 py-1 text-red-600 border border-red-200 rounded shrink-0"
            >
              Удалить
            </button>
          </div>
        ))}
        <button
          onClick={() =>
            setForm((f: any) => ({
              ...f,
              characteristics: [...(f.characteristics || []), { name: '', value: '' }],
            }))
          }
          className="px-3 py-1 border rounded"
        >
          + Добавить характеристику
        </button>
      </section>

      <section className="bg-white border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">Раздел каталога</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Раздел</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={currentSectionId}
              onChange={(e) => setForm((f: any) => ({ ...f, sectionId: e.target.value || '', _subsectionId: '', subsectionId: null, subsubsectionId: null }))}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Подраздел</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={currentSubsectionId}
              onChange={(e) => {
                const val = e.target.value || null
                setForm((f: any) => ({ ...f, _subsectionId: val || '', subsectionId: val, subsubsectionId: null }))
              }}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Подраздел подраздела</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={form.subsubsectionId || ''}
              onChange={(e) => {
                const val = e.target.value || null
                setForm((f: any) => ({ ...f, subsubsectionId: val, subsectionId: val ? null : (currentSubsectionId || null) }))
              }}
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

      <section className="bg-white border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">Теги</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Теги (через запятую)</label>
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="барбекю, мангал, кирпич"
            value={(form.tags || []).join(', ')}
            onChange={(e) => setForm((f: any) => ({ ...f, tags: e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean) }))}
          />
        </div>
      </section>

      <section className="bg-white border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">Описание</h2>
        <textarea
          className="w-full border rounded px-3 py-2"
          rows={4}
          placeholder="Подробное описание печного комплекса или мангала"
          value={form.description || ''}
          onChange={(e) => setForm((f: any) => ({ ...f, description: e.target.value }))}
        />
      </section>

      <section className="bg-white border rounded-xl p-6 space-y-3">
        <h2 className="text-lg font-semibold">Преимущества</h2>
        {(form.advantages || []).map((adv: string, idx: number) => (
          <div key={idx} className="flex gap-3 items-center">
            <input
              className="flex-1 border rounded px-3 py-2"
              placeholder="Преимущество"
              value={adv}
              onChange={(e) => setForm((f: any) => ({ ...f, advantages: (f.advantages || []).map((x: string, i: number) => (i === idx ? e.target.value : x)) }))}
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
          onClick={() => setForm((f: any) => ({ ...f, advantages: [...(form.advantages || []), ''] }))}
          className="px-3 py-1 border rounded"
        >
          + Добавить преимущество
        </button>
      </section>

      <div className="flex justify-end">
        <button onClick={create} className="px-6 py-2 bg-[#5D4E37] text-white rounded hover:bg-[#4a3d2a] transition">
          Создать проект
        </button>
      </div>
    </div>
  )
}
