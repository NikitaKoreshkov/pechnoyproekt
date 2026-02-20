'use client'

import { useEffect, useState } from 'react'
import AdminTopBar from '@/components/admin/AdminTopBar'

interface Advantage {
  id: number
  title: string
  description: string
}

export default function ProcessStepsEditorPage() {
  const [title, setTitle] = useState('')
  const [mainMission, setMainMission] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [advantages, setAdvantages] = useState<Advantage[]>([])
  const [conclusion, setConclusion] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')
  const [lastSaveTime, setLastSaveTime] = useState(0)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/process-steps', {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-store'
        }
      })
      if (res.ok) {
        const data = await res.json()
        console.log('[COMPANY INFO EDITOR] Loaded from server:', data)
        setTitle(data.title || '')
        setMainMission(data.mainMission || '')
        setSpecialization(data.specialization || '')
        setAdvantages(data.advantages || [])
        setConclusion(data.conclusion || '')
      } else {
        console.error('[COMPANY INFO EDITOR] Load failed:', res.status)
      }
    } catch (error) {
      console.error('[COMPANY INFO EDITOR] Error loading config:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const save = async () => {
    const now = Date.now()
    if (isSaving) {
      console.log('[COMPANY INFO EDITOR] Save already in progress, skipping')
      return
    }
    if (now - lastSaveTime < 1000) {
      console.log('[COMPANY INFO EDITOR] Preventing double save, too soon')
      return
    }
    setLastSaveTime(now)
    
    setIsSaving(true)
    setSavedMessage('')
    
    try {
      const payload = { title, mainMission, specialization, advantages, conclusion }
      console.log('[COMPANY INFO EDITOR] Saving:', payload)
      
      const res = await fetch('/api/admin/process-steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
        cache: 'no-store'
      })

      const responseText = await res.text()
      console.log('[COMPANY INFO EDITOR] Raw response:', responseText)

      if (res.ok) {
        const data = JSON.parse(responseText)
        console.log('[COMPANY INFO EDITOR] Parsed response:', data)
        
        // НЕ перезаписываем состояние после сохранения!
        // Пользователь уже ввел правильные данные в поля
        
        setSavedMessage('✅ Изменения сохранены!')
        
        // Принудительно обновляем главную страницу
        try {
          await fetch('/api/revalidate-homepage', {
            method: 'POST',
            credentials: 'include'
          })
          console.log('[COMPANY INFO EDITOR] Homepage revalidated')
          
          // Отправляем сигналы обновления
          localStorage.setItem('company-info-updated', Date.now().toString())
          
          // Если главная страница открыта в другой вкладке
          if (window.opener) {
            window.opener.postMessage({ type: 'COMPANY_INFO_UPDATED' }, '*')
          }
          
          // Для всех вкладок
          const bc = new BroadcastChannel('company-updates')
          bc.postMessage({ type: 'COMPANY_INFO_UPDATED' })
          bc.close()
          
        } catch (revalError) {
          console.warn('[COMPANY INFO EDITOR] Failed to revalidate homepage:', revalError)
        }
        
        setTimeout(() => setSavedMessage(''), 3000)
      } else {
        let errorData = { error: 'Неизвестная ошибка' }
        try {
          errorData = JSON.parse(responseText)
        } catch {
          errorData = { error: `Ошибка ${res.status}` }
        }
        console.error('[COMPANY INFO EDITOR] Error response:', errorData)
        alert('Ошибка сохранения: ' + (errorData.error || 'Неизвестная ошибка'))
      }
    } catch (error) {
      console.error('[COMPANY INFO EDITOR] Error saving:', error)
      alert('Ошибка сохранения: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'))
    } finally {
      setIsSaving(false)
    }
  }

  const updateAdvantage = (index: number, field: keyof Advantage, value: string) => {
    const newAdvantages = [...advantages]
    newAdvantages[index] = { ...newAdvantages[index], [field]: value }
    setAdvantages(newAdvantages)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    )
  }

  return (
    <>
      <AdminTopBar title="Редактирование информации о компании" backHref="/admin/changes" />
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Заголовок */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Заголовок</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Заголовок блока
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4E37]"
              placeholder="«АкваГазТех» ваш надежный партнер"
            />
          </div>
        </div>

        {/* Основная миссия */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Основная миссия</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Текст основной миссии
            </label>
            <textarea
              value={mainMission}
              onChange={(e) => setMainMission(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4E37]"
              rows={3}
              placeholder="Основная миссия компании «АкваГазТех» — обеспечить ваши задачи качественными материалами для современных инженерных систем."
            />
          </div>
        </div>

        {/* Специализация */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Специализация</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Текст специализации
            </label>
            <textarea
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4E37]"
              rows={4}
              placeholder="Мы специализируемся на поставках труб ПНД (ПЭ) и полного спектра комплектующих для строительства наружных и внутренних сетей любой сложности."
            />
          </div>
        </div>

        {/* Преимущества */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Почему труба ПНД — лидер современных коммуникаций?</h2>
          <div className="space-y-4">
            {advantages.map((advantage, index) => (
              <div key={advantage.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-[#5D4E37] text-white rounded-full flex items-center justify-center font-bold">
                    {advantage.id}
                  </div>
                  <h3 className="text-lg font-semibold">Преимущество {advantage.id}</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Заголовок
                    </label>
                    <input
                      type="text"
                      value={advantage.title}
                      onChange={(e) => updateAdvantage(index, 'title', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4E37]"
                      placeholder="Доступная стоимость"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Описание
                    </label>
                    <textarea
                      value={advantage.description}
                      onChange={(e) => updateAdvantage(index, 'description', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4E37]"
                      rows={2}
                      placeholder="Экономически выгодное решение без потери в качестве"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Заключение */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Заключительный текст</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Текст заключения
            </label>
            <textarea
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4E37]"
              rows={4}
              placeholder="Выбирая «АкваГазТех», вы выбираете надежность, проверенную временем и сотнями успешных проектов."
            />
          </div>
        </div>

        {/* Сохранить */}
        <div className="space-y-3">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800 font-medium">
              ⚠️ Внимание: Нажмите кнопку сохранения <strong>один раз</strong> и дождитесь подтверждения
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={save}
              disabled={isSaving}
              className="flex-1 bg-[#5D4E37] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#6D5D4A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
            {savedMessage && (
              <div className="flex items-center text-green-600 font-medium">
                {savedMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
