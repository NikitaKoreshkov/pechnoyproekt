'use client'

import { useEffect, useState } from 'react'
import AdminTopBar from '@/components/admin/AdminTopBar'

interface FAQItem { question: string; answer: string; order?: number }

export default function FAQEditorPage() {
  const [items, setItems] = useState<FAQItem[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    const res = await fetch('/api/admin/faq')
    if (res.ok) setItems(await res.json())
  }
  useEffect(() => { load() }, [])

  const add = () => setItems(it => [...it, { question: '', answer: '' }])
  const remove = (idx: number) => setItems(it => it.filter((_, i) => i !== idx))
  const move = (idx: number, dir: -1 | 1) => setItems(it => {
    const copy = [...it]; const target = idx + dir; if (target < 0 || target >= copy.length) return it; [copy[idx], copy[target]] = [copy[target], copy[idx]]; return copy
  })

  const save = async () => {
    setLoading(true)
    try {
      const payload = items.map((it, idx) => ({ ...it, order: idx }))
      console.log('[SAVE FAQ] Sending POST request:', payload)
      const res = await fetch('/api/admin/faq', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      })
      console.log('[SAVE FAQ] Response status:', res.status)
      setLoading(false)
      if (res.ok) {
        const result = await res.json()
        console.log('[SAVE FAQ] Success:', result)
        // Принудительно перезагружаем данные
        await fetch('/api/admin/faq', { cache: 'no-store' })
          .then(r => r.json())
          .then(data => {
            console.log('[SAVE FAQ] Reloaded data:', data)
            setItems(data)
          })
        
        // Отправляем событие для обновления FAQ на сайте в реальном времени
        if (typeof window !== 'undefined') {
          try {
            const channel = new BroadcastChannel('faq-updates')
            channel.postMessage({ type: 'FAQ_UPDATED', timestamp: Date.now() })
            channel.close()
            console.log('[SAVE FAQ] Broadcast event sent')
          } catch (e) {
            console.error('[SAVE FAQ] Failed to send broadcast:', e)
          }
        }
        
        alert('✅ FAQ успешно сохранены! Изменения будут видны на сайте в течение нескольких секунд.')
      } else {
        const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        console.error('[SAVE FAQ] Error:', errorData)
        alert(`❌ Ошибка сохранения: ${errorData.error || 'Неизвестная ошибка'}`)
      }
    } catch (err) {
      console.error('[SAVE FAQ] Exception:', err)
      setLoading(false)
      alert(`❌ Ошибка: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`)
    }
  }

  return (
    <div className="space-y-4">
      <AdminTopBar title="Часто задаваемые вопросы" backHref="/admin/changes" actions={
        <>
          <button onClick={add} className="px-3 py-1.5 border rounded">Добавить</button>
          <button onClick={save} disabled={loading} className="px-3 py-1.5 bg-gray-900 text-white rounded">Сохранить</button>
        </>
      } />
      {items.map((it, idx) => (
        <div key={idx} className="bg-white border rounded p-4 space-y-3">
          <div className="flex gap-2">
            <button onClick={() => move(idx, -1)} className="px-2 py-1 border rounded">↑</button>
            <button onClick={() => move(idx, 1)} className="px-2 py-1 border rounded">↓</button>
            <button onClick={() => remove(idx)} className="ml-auto px-3 py-1 text-red-600 border border-red-200 rounded">Удалить</button>
          </div>
          <input className="w-full border rounded px-3 py-2" placeholder="Вопрос" value={it.question} onChange={e => setItems(arr => arr.map((x, i) => i === idx ? { ...x, question: e.target.value } : x))} />
          <textarea className="w-full border rounded px-3 py-2" placeholder="Ответ" rows={4} value={it.answer} onChange={e => setItems(arr => arr.map((x, i) => i === idx ? { ...x, answer: e.target.value } : x))} />
        </div>
      ))}
    </div>
  )
}


