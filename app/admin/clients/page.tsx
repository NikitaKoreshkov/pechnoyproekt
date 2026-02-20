'use client'

import { useEffect, useState } from 'react'
import AdminTopBar from '@/components/admin/AdminTopBar'

interface Lead {
  id: string
  name?: string | null
  phone?: string | null
  message?: string | null
  purpose?: string | null
  source?: string | null
  createdAt: string
}

export default function AdminClientsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)

  const load = async () => {
    const res = await fetch('/api/admin/leads')
    if (res.ok) {
      const data = await res.json()
      setLeads(data)
    }
  }

  useEffect(() => { load() }, [])

  const toggle = (id: string) => setSelected(s => ({ ...s, [id]: !s[id] }))
  const allSelected = leads.length && leads.every(l => selected[l.id])
  const toggleAll = () => {
    if (allSelected) setSelected({})
    else setSelected(Object.fromEntries(leads.map(l => [l.id, true])))
  }

  const deleteSelected = async (all?: boolean) => {
    const ids = Object.keys(selected).filter(id => selected[id])
    if (!all && ids.length === 0) return alert('Выберите клиентов для удаления')
    const message = all ? 'Удалить всех клиентов?' : `Удалить ${ids.length} клиент(ов)?`
    if (!confirm(message)) return
    
    setLoading(true)
    const res = await fetch('/api/admin/leads', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(all ? { all: true } : { ids })
    })
    setLoading(false)
    
    if (res.ok) {
      setSelected({})
      await load()
      alert(all ? '✅ Все клиенты успешно удалены!' : `✅ Удалено ${ids.length} клиент(ов)`)
    } else {
      alert('❌ Ошибка удаления')
    }
  }

  return (
    <div className="space-y-4">
      <AdminTopBar title="Все клиенты" backHref="/admin" actions={
        <>
          <button onClick={() => deleteSelected(false)} disabled={!Object.values(selected).some(Boolean) || loading}
            className="px-3 py-1.5 bg-red-600 text-white rounded disabled:opacity-50">Удалить выбранные</button>
          <button onClick={() => deleteSelected(true)} disabled={!leads.length || loading}
            className="px-3 py-1.5 bg-red-100 text-red-700 rounded border border-red-200">Удалить все</button>
        </>
      } />

      <div className="overflow-x-auto rounded border">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="text-left bg-gray-50">
              <th className="p-3"><input type="checkbox" checked={!!allSelected} onChange={toggleAll} /></th>
              <th className="p-3">Время</th>
              <th className="p-3">Имя</th>
              <th className="p-3">Телефон</th>
              <th className="p-3">Источник</th>
              <th className="p-3">Повод</th>
              <th className="p-3">Сообщение</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(l => (
              <tr key={l.id} className="border-t">
                <td className="p-3"><input type="checkbox" checked={!!selected[l.id]} onChange={() => toggle(l.id)} /></td>
                <td className="p-3 text-sm text-gray-500">{new Date(l.createdAt).toLocaleString('ru-RU')}</td>
                <td className="p-3">{l.name || '-'}</td>
                <td className="p-3">{l.phone || '-'}</td>
                <td className="p-3">{l.source || '-'}</td>
                <td className="p-3">{l.purpose || '-'}</td>
                <td className="p-3 max-w-xl truncate" title={l.message || ''}>{l.message || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


