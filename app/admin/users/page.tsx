'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import AdminTopBar from '@/components/admin/AdminTopBar'

type Role = 'ADMIN' | 'SUPER_ADMIN'

interface AdminUser { id: string; email: string; name?: string | null; role: Role; createdAt: string }

export default function AdminUsersPage() {
  const { data: session } = useSession()
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', name: '', password: '' })
  const [error, setError] = useState('')
  const isSuper = session?.user.role === 'SUPER_ADMIN'

  const load = async () => {
    const res = await fetch('/api/admin/users')
    if (res.ok) setAdmins(await res.json())
  }
  useEffect(() => { load() }, [])

  const createAdmin = async () => {
    if (!isSuper) return
    setError('')
    setLoading(true)
    try {
      console.log('[CREATE ADMIN] Sending POST request')
      const res = await fetch('/api/admin/users', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: 'ADMIN' })
      })
      console.log('[CREATE ADMIN] Response status:', res.status)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.error || 'Не удалось создать администратора (возможно, email уже существует).')
        console.error('[CREATE ADMIN] Error:', data)
      } else {
        const result = await res.json()
        console.log('[CREATE ADMIN] Success:', result)
        setForm({ email: '', name: '', password: '' })
        await load()
        alert('✅ Администратор успешно добавлен!')
      }
    } catch (err) {
      console.error('[CREATE ADMIN] Exception:', err)
      setError(`Ошибка: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`)
    } finally {
      setLoading(false)
    }
  }

  const changeRole = async (id: string, role: Role) => {
    if (!isSuper) return
    try {
      console.log('[CHANGE ROLE] Sending PATCH request:', { id, role })
      const res = await fetch(`/api/admin/users/${id}`, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ role }) 
      })
      console.log('[CHANGE ROLE] Response status:', res.status)
      if (res.ok) {
        const result = await res.json()
        console.log('[CHANGE ROLE] Success:', result)
        await load()
        alert('✅ Роль успешно изменена!')
      } else {
        const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        console.error('[CHANGE ROLE] Error:', errorData)
        alert(`❌ Ошибка изменения роли: ${errorData.error || 'Неизвестная ошибка'}`)
      }
    } catch (err) {
      console.error('[CHANGE ROLE] Exception:', err)
      alert(`❌ Ошибка: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`)
    }
  }

  const remove = async (id: string) => {
    if (!isSuper) return
    if (!confirm('Удалить этого администратора?')) return
    try {
      console.log('[DELETE ADMIN] Sending DELETE request:', id)
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      console.log('[DELETE ADMIN] Response status:', res.status)
      if (res.ok) {
        const result = await res.json()
        console.log('[DELETE ADMIN] Success:', result)
        await load()
        alert('✅ Администратор успешно удален!')
      } else {
        const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        console.error('[DELETE ADMIN] Error:', errorData)
        alert(`❌ Ошибка удаления: ${errorData.error || 'Неизвестная ошибка'}`)
      }
    } catch (err) {
      console.error('[DELETE ADMIN] Exception:', err)
      alert(`❌ Ошибка: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`)
    }
  }

  return (
    <div className="space-y-8">
      <AdminTopBar title="Администраторы" backHref="/admin" />
      <div>
        <h2 className="text-xl font-semibold mb-4">Администраторы</h2>
        <div className="text-sm text-gray-500 mb-2">Всего: {admins.length}</div>
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="text-left bg-gray-50">
                <th className="p-3">Email</th>
                <th className="p-3">Имя</th>
                <th className="p-3">Роль</th>
                <th className="p-3">Действия</th>
              </tr>
            </thead>
            <tbody>
              {admins.map(a => (
                <tr key={a.id} className="border-t">
                  <td className="p-3">{a.email}</td>
                  <td className="p-3">{a.name || '-'}</td>
                  <td className="p-3">
                    {isSuper ? (
                      <select value={a.role} onChange={e => changeRole(a.id, e.target.value as Role)} className="border rounded px-2 py-1">
                        <option value="ADMIN">ADMIN</option>
                        <option value="SUPER_ADMIN" disabled>SUPER_ADMIN</option>
                      </select>
                    ) : a.role}
                  </td>
                  <td className="p-3 space-x-2">
                    {isSuper && (
                      <button onClick={() => remove(a.id)} className="px-3 py-1 text-red-600 border border-red-200 rounded">Удалить</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isSuper && (
        <div className="bg-white border rounded p-4 space-y-3">
          <h3 className="font-semibold">Добавить администратора</h3>
          {error && <div className="p-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="border rounded px-3 py-2" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <input className="border rounded px-3 py-2" placeholder="Имя" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <input className="border rounded px-3 py-2" placeholder="Пароль" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>
          <button disabled={loading} onClick={createAdmin} className="px-4 py-2 bg-[#5D4E37] text-white rounded">Добавить</button>
        </div>
      )}
    </div>
  )
}


