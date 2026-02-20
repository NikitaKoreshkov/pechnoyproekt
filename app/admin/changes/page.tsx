'use client'

import Link from 'next/link'
import AdminTopBar from '@/components/admin/AdminTopBar'

export default function ChangesPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <AdminTopBar title="Изменения на сайте" backHref="/admin" />
      <Link href="/admin/changes/header" className="block p-6 rounded-xl border border-gray-200 bg-white hover:shadow-lg transition">
        <h2 className="text-xl font-semibold mb-2">Хедер</h2>
        <p className="text-gray-600">Изменение текста и логотипа в шапке сайта.</p>
      </Link>
      <Link href="/admin/changes/hero" className="block p-6 rounded-xl border border-gray-200 bg-white hover:shadow-lg transition">
        <h2 className="text-xl font-semibold mb-2">Hero-блок</h2>
        <p className="text-gray-600">Изменение фонового изображения, заголовка и подзаголовка на главной странице.</p>
      </Link>
      <Link href="/admin/changes/process-steps" className="block p-6 rounded-xl border border-gray-200 bg-white hover:shadow-lg transition">
        <h2 className="text-xl font-semibold mb-2">О компании</h2>
        <p className="text-gray-600">Редактирование информации о компании и преимуществ труб ПНД.</p>
      </Link>
      <Link href="/admin/changes/advantages" className="block p-6 rounded-xl border border-gray-200 bg-white hover:shadow-lg transition">
        <h2 className="text-xl font-semibold mb-2">Наши преимущества</h2>
        <p className="text-gray-600">Редактирование карточек преимуществ (6 карточек).</p>
      </Link>
      <Link href="/admin/changes/popular" className="block p-6 rounded-xl border border-gray-200 bg-white hover:shadow-lg transition">
        <h2 className="text-xl font-semibold mb-2">Популярные товары</h2>
        <p className="text-gray-600">Управляйте двумя панелями и до 6 карточек в каждой.</p>
      </Link>
      <Link href="/admin/changes/calculator" className="block p-6 rounded-xl border border-gray-200 bg-white hover:shadow-lg transition">
        <h2 className="text-xl font-semibold mb-2">Калькулятор</h2>
        <p className="text-gray-600">Типы труб, обработка, доп. опции и формула.</p>
      </Link>
      <Link href="/admin/changes/reviews" className="block p-6 rounded-xl border border-gray-200 bg-white hover:shadow-lg transition">
        <h2 className="text-xl font-semibold mb-2">Отзывы</h2>
        <p className="text-gray-600">Фото, текст, имя, город, дата.</p>
      </Link>
      <Link href="/admin/changes/faq" className="block p-6 rounded-xl border border-gray-200 bg-white hover:shadow-lg transition">
        <h2 className="text-xl font-semibold mb-2">Часто задаваемые вопросы</h2>
        <p className="text-gray-600">Вопросы и ответы, управление порядком.</p>
      </Link>

      <Link href="/admin/changes/catalog-structure" className="block p-6 rounded-xl border border-gray-200 bg-white hover:shadow-lg transition">
        <h2 className="text-xl font-semibold mb-2">Настройка каталога</h2>
        <p className="text-gray-600">Разделы и подразделы каталога: создание, редактирование, удаление.</p>
      </Link>
      <Link href="/admin/changes/catalog-seo-text" className="block p-6 rounded-xl border border-gray-200 bg-white hover:shadow-lg transition">
        <h2 className="text-xl font-semibold mb-2">SEO-текст каталога</h2>
        <p className="text-gray-600">Редактирование описательного текста на странице каталога</p>
      </Link>
      <Link href="/admin/changes/footer" className="block p-6 rounded-xl border border-gray-200 bg-white hover:shadow-lg transition">
        <h2 className="text-xl font-semibold mb-2">Футер</h2>
        <p className="text-gray-600">Редактирование футера сайта: контакты, адрес, юридическая информация.</p>
      </Link>
      <Link href="/admin/changes/legal" className="block p-6 rounded-xl border border-gray-200 bg-white hover:shadow-lg transition">
        <h2 className="text-xl font-semibold mb-2">Юридические страницы</h2>
        <p className="text-gray-600">Редактирование Политики конфиденциальности, Условий использования и Cookie.</p>
      </Link>
      <Link href="/admin/changes/metadata" className="block p-6 rounded-xl border border-gray-200 bg-white hover:shadow-lg transition">
        <h2 className="text-xl font-semibold mb-2">SEO и Favicon</h2>
        <p className="text-gray-600">Настройка favicon, иконок и SEO метаданных сайта.</p>
      </Link>
    </div>
  )
}

