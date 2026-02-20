'use client'

import Link from 'next/link'

export default function AdminHomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Админ панель</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/admin/catalog" className="block p-6 rounded-xl border border-gray-200 bg-white hover:shadow-lg transition">
          <h2 className="text-xl font-semibold mb-2">Каталог проектов</h2>
          <p className="text-gray-600">Добавление, удаление и редактирование всех проектов. Полное управление данными проектов.</p>
        </Link>

        <Link href="/admin/changes" className="block p-6 rounded-xl border border-gray-200 bg-white hover:shadow-lg transition">
          <h2 className="text-xl font-semibold mb-2">Изменения на сайте</h2>
          <p className="text-gray-600">Управляйте популярными проектами, калькулятором, отзывами и FAQ.</p>
        </Link>

        <Link href="/admin/clients" className="block p-6 rounded-xl border border-gray-200 bg-white hover:shadow-lg transition">
          <h2 className="text-xl font-semibold mb-2">Все клиенты</h2>
          <p className="text-gray-600">Просмотр и удаление обращений. Массовое удаление.</p>
        </Link>

        <Link href="/admin/users" className="block p-6 rounded-xl border border-gray-200 bg-white hover:shadow-lg transition">
          <h2 className="text-xl font-semibold mb-2">Администраторы</h2>
          <p className="text-gray-600">Список админов, роли и пароли (только SUPER_ADMIN создаёт/удаляет).</p>
        </Link>

        <Link href="/admin/profile" className="block p-6 rounded-xl border border-gray-200 bg-white hover:shadow-lg transition">
          <h2 className="text-xl font-semibold mb-2">Мой профиль</h2>
          <p className="text-gray-600">Смена пароля, просмотр роли и данных учётной записи.</p>
        </Link>
      </div>
    </div>
  )
}


