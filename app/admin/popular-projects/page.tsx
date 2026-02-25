'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AdminTopBar from '@/components/admin/AdminTopBar'

interface PopularItem {
  id: string
  title: string
  image: string
  area: number
  priceFrom: number
  priceTo?: number | null
  projectSlug?: string | null
}

export default function PopularProjectsPage() {
  const [items, setItems] = useState<PopularItem[]>([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/popular', { cache: 'no-store' })
      if (res.ok) {
        const panels = await res.json()
        const all = panels.flatMap((p: { items?: PopularItem[] }) => p.items || [])
        setItems(all)
      } else {
        setItems([])
      }
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const removeFromPopular = async (item: PopularItem) => {
    if (!confirm('Убрать из популярных?')) return
    setRemovingId(item.id)
    try {
      const res = await fetch(`/api/admin/popular/${item.id}`, { method: 'DELETE' })
      if (res.ok) {
        await load()
        alert('✅ Убрано из популярных')
      } else {
        const data = await res.json().catch(() => ({}))
        alert(`❌ ${data.error || 'Ошибка'}`)
      }
    } catch (e) {
      alert(`❌ ${e instanceof Error ? e.message : 'Ошибка'}`)
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <AdminTopBar title="Популярные товары" backHref="/admin/catalog" />

      <div className="bg-white border rounded-xl overflow-hidden">
        <h2 className="text-lg font-semibold p-4 border-b">Популярные товары ({items.length})</h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <p className="p-8 text-center text-gray-500">
            Нет популярных товаров. Добавляйте их со страницы «Все проекты».
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left bg-gray-50">
                  <th className="p-3">Превью</th>
                  <th className="p-3">Название</th>
                  <th className="p-3">Цена</th>
                  <th className="p-3">Действия</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">
                      <img
                        src={item.image?.startsWith('/') || item.image?.startsWith('http') ? item.image : '/images/1.png'}
                        alt={item.title}
                        className="w-16 h-12 object-cover rounded"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/images/1.png' }}
                      />
                    </td>
                    <td className="p-3 font-medium">{item.title || '—'}</td>
                    <td className="p-3 font-semibold">
                      {new Intl.NumberFormat('ru-RU').format(item.priceFrom)} ₽
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/popular/${item.id}`}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                        >
                          Редактировать
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeFromPopular(item)}
                          disabled={!!removingId}
                          className="px-3 py-1 text-red-600 border border-red-200 rounded hover:bg-red-50 text-sm disabled:opacity-50"
                        >
                          {removingId === item.id ? '…' : 'Убрать из популярных'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
