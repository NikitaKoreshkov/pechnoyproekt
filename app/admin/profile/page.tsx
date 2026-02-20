'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'
import AdminTopBar from '@/components/admin/AdminTopBar'

export default function AdminProfilePage() {
  const { data: session } = useSession()
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [loading, setLoading] = useState(false)

  const changeMyPassword = async () => {
    if (!session?.user?.id) return
    if (p1.length < 6) return alert('❌ Минимум 6 символов')
    if (p1 !== p2) return alert('❌ Пароли не совпадают')
    setLoading(true)
    try {
      console.log('[CHANGE PASSWORD] Sending PATCH request')
      const res = await fetch(`/api/admin/users/${session.user.id}`, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ password: p1 }) 
      })
      console.log('[CHANGE PASSWORD] Response status:', res.status)
      setLoading(false)
      if (res.ok) {
        const result = await res.json()
        console.log('[CHANGE PASSWORD] Success:', result)
        setP1('')
        setP2('')
        alert('✅ Пароль успешно изменен!')
      } else {
        const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        console.error('[CHANGE PASSWORD] Error:', errorData)
        alert(`❌ Ошибка изменения пароля: ${errorData.error || 'Неизвестная ошибка'}`)
      }
    } catch (err) {
      console.error('[CHANGE PASSWORD] Exception:', err)
      setLoading(false)
      alert(`❌ Ошибка: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`)
    }
  }

  return (
    <div className="space-y-6">
      <AdminTopBar title="Мой профиль" backHref="/admin" />

      <div className="bg-white border rounded p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-sm text-gray-500">Email</div>
            <div className="font-medium">{session?.user?.email}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Роль</div>
            <div className="font-medium">{session?.user?.role}</div>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded p-4 space-y-3">
        <h3 className="font-semibold">Сменить пароль</h3>
        <div className="flex flex-col md:flex-row gap-3">
          <input className="border rounded px-3 py-2" type="password" placeholder="Новый пароль" value={p1} onChange={e => setP1(e.target.value)} />
          <input className="border rounded px-3 py-2" type="password" placeholder="Повторите пароль" value={p2} onChange={e => setP2(e.target.value)} />
          <button disabled={loading} onClick={changeMyPassword} className="px-4 py-2 bg-gray-900 text-white rounded">Сохранить</button>
        </div>
      </div>
    </div>
  )
}


