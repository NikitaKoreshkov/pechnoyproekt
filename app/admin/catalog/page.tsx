'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import AdminTopBar from '@/components/admin/AdminTopBar'

interface ProjectListItem { id: string; slug: string; title: string; area: number; priceFrom: number; image: string }
interface PopularItem { id: string; title: string; image: string; area: number; priceFrom: number; priceTo?: number | null; projectSlug?: string | null }

export default function AdminCatalogPage() {
  const [items, setItems] = useState<ProjectListItem[]>([])
  const [popularItems, setPopularItems] = useState<PopularItem[]>([])

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

  useEffect(() => {
    load()
    loadPopular()
  }, [])

  return (
    <div className="space-y-6">
      <AdminTopBar title="Каталог проектов" backHref="/admin" />
      
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
            <Link href="/admin/changes/catalog-structure" className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">
              Настройка
            </Link>
          </div>
        </div>
      </div>

      {/* Настройка каталога, фильтры, популярные проекты */}
      <div className="space-y-4">
        <Link href="/admin/changes/catalog-structure" className="block p-5 rounded-xl border border-gray-200 bg-white hover:shadow-lg hover:border-gray-300 transition">
          <h2 className="text-lg font-semibold mb-1">Настройка каталога</h2>
          <p className="text-gray-600 text-sm">Разделы и подразделы каталога: создание, редактирование, удаление.</p>
        </Link>
        <Link href="/admin/catalog/filters" className="block p-5 rounded-xl border border-gray-200 bg-white hover:shadow-lg hover:border-gray-300 transition">
          <h2 className="text-lg font-semibold mb-1">Настроить фильтры</h2>
          <p className="text-gray-600 text-sm">Настройка фильтров каталога: материал, площадь, цена и другие параметры.</p>
        </Link>
        <Link href="/admin/popular-projects" className="block p-5 rounded-xl border border-gray-200 bg-white hover:shadow-lg hover:border-gray-300 transition">
          <h2 className="text-lg font-semibold mb-1">Популярные проекты</h2>
          <p className="text-gray-600 text-sm">Две панели, до 6 карточек в каждой. Настройка популярных товаров на главной.</p>
        </Link>
        <Link href="/admin/catalog/add-project" className="block p-5 rounded-xl border border-gray-200 bg-white hover:shadow-lg hover:border-gray-300 transition">
          <h2 className="text-lg font-semibold mb-1">Добавить проект</h2>
          <p className="text-gray-600 text-sm">Создание нового проекта: название, фото, раздел каталога, описание, характеристики, преимущества.</p>
        </Link>
        <Link href="/admin/catalog/projects" className="block p-5 rounded-xl border border-gray-200 bg-white hover:shadow-lg hover:border-gray-300 transition">
          <h2 className="text-lg font-semibold mb-1">Все проекты</h2>
          <p className="text-gray-600 text-sm">Просмотр, редактирование и удаление проектов. По разделам и подразделам каталога.</p>
        </Link>
      </div>
    </div>
  )
}


