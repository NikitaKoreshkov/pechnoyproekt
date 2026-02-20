'use client'

import { useEffect, useState } from 'react'
import AdminTopBar from '@/components/admin/AdminTopBar'

export default function FooterEditorPage() {
  const [loading, setLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')
  
  const [companyName, setCompanyName] = useState('')
  const [companyDescription, setCompanyDescription] = useState('')
  const [whatsappUrl, setWhatsappUrl] = useState('')
  const [whatsappText, setWhatsappText] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [addressLine3, setAddressLine3] = useState('')
  const [workingHoursLine1, setWorkingHoursLine1] = useState('')
  const [workingHoursLine2, setWorkingHoursLine2] = useState('')
  const [newsletterTitle, setNewsletterTitle] = useState('')
  const [newsletterDescription, setNewsletterDescription] = useState('')
  const [copyright, setCopyright] = useState('')
  const [ip, setIp] = useState('')
  const [inn, setInn] = useState('')
  const [legalAddress, setLegalAddress] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/footer', {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-store'
        }
      })
      if (res.ok) {
        const data = await res.json()
        console.log('[FOOTER EDITOR] Loaded from server:', data)
        setCompanyName(data.companyName || '')
        setCompanyDescription(data.companyDescription || '')
        setWhatsappUrl(data.whatsappUrl || '')
        setWhatsappText(data.whatsappText || '')
        setPhone(data.phone || '')
        setEmail(data.email || '')
        setAddressLine1(data.addressLine1 || '')
        setAddressLine2(data.addressLine2 || '')
        setAddressLine3(data.addressLine3 || '')
        setWorkingHoursLine1(data.workingHoursLine1 || '')
        setWorkingHoursLine2(data.workingHoursLine2 || '')
        setNewsletterTitle(data.newsletterTitle || '')
        setNewsletterDescription(data.newsletterDescription || '')
        setCopyright(data.copyright || '')
        setIp(data.ip || '')
        setInn(data.inn || '')
        setLegalAddress(data.legalAddress || '')
      } else {
        console.error('[FOOTER EDITOR] Load failed:', res.status)
      }
    } catch (error) {
      console.error('[FOOTER EDITOR] Error loading footer config:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const save = async () => {
    if (isSaving) {
      console.log('[FOOTER EDITOR] Save already in progress, skipping')
      return
    }
    
    setIsSaving(true)
    setSavedMessage('')
    
    try {
      const payload = {
        companyName,
        companyDescription,
        whatsappUrl,
        whatsappText,
        phone,
        email,
        addressLine1,
        addressLine2,
        addressLine3,
        workingHoursLine1,
        workingHoursLine2,
        newsletterTitle,
        newsletterDescription,
        copyright,
        ip,
        inn,
        legalAddress
      }
      console.log('[FOOTER EDITOR] Saving:', payload)
      
      const res = await fetch('/api/admin/footer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
        cache: 'no-store'
      })

      const responseText = await res.text()
      console.log('[FOOTER EDITOR] Raw response:', responseText)
      
      if (res.ok) {
        const data = JSON.parse(responseText)
        console.log('[FOOTER EDITOR] Parsed response:', data)
        
        // Обновляем все поля из ответа сервера
        setCompanyName(data.companyName || '')
        setCompanyDescription(data.companyDescription || '')
        setWhatsappUrl(data.whatsappUrl || '')
        setWhatsappText(data.whatsappText || '')
        setPhone(data.phone || '')
        setEmail(data.email || '')
        setAddressLine1(data.addressLine1 || '')
        setAddressLine2(data.addressLine2 || '')
        setAddressLine3(data.addressLine3 || '')
        setWorkingHoursLine1(data.workingHoursLine1 || '')
        setWorkingHoursLine2(data.workingHoursLine2 || '')
        setNewsletterTitle(data.newsletterTitle || '')
        setNewsletterDescription(data.newsletterDescription || '')
        setCopyright(data.copyright || '')
        setIp(data.ip || '')
        setInn(data.inn || '')
        setLegalAddress(data.legalAddress || '')
        
        setSavedMessage('✅ Изменения сохранены!')
        setTimeout(() => setSavedMessage(''), 3000)
      } else {
        let errorData = { error: 'Неизвестная ошибка' }
        try {
          errorData = JSON.parse(responseText)
        } catch {
          errorData = { error: `Ошибка ${res.status}` }
        }
        console.error('[FOOTER EDITOR] Error response:', errorData)
        alert('Ошибка сохранения: ' + (errorData.error || 'Неизвестная ошибка'))
      }
    } catch (error) {
      console.error('[FOOTER EDITOR] Error saving:', error)
      alert('Ошибка сохранения: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'))
    } finally {
      setIsSaving(false)
    }
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
      <AdminTopBar title="Редактирование футера" backHref="/admin/changes" />
      <div className="max-w-4xl mx-auto space-y-6">
        {/* О компании */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">О компании</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Название компании
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4E37]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Описание
              </label>
              <textarea
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4E37]"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Контакты */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Контакты</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Телефон
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4E37]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4E37]"
              />
            </div>
          </div>
        </div>

        {/* Адрес */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Адрес</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Строка 1
              </label>
              <input
                type="text"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4E37]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Строка 2
              </label>
              <input
                type="text"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4E37]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Строка 3
              </label>
              <input
                type="text"
                value={addressLine3}
                onChange={(e) => setAddressLine3(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4E37]"
              />
            </div>
          </div>
        </div>

        {/* Время работы */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Время работы</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Строка 1
              </label>
              <input
                type="text"
                value={workingHoursLine1}
                onChange={(e) => setWorkingHoursLine1(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4E37]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Строка 2
              </label>
              <input
                type="text"
                value={workingHoursLine2}
                onChange={(e) => setWorkingHoursLine2(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4E37]"
              />
            </div>
          </div>
        </div>

        {/* Новостная рассылка */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Новостная рассылка</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Заголовок
              </label>
              <input
                type="text"
                value={newsletterTitle}
                onChange={(e) => setNewsletterTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4E37]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Описание
              </label>
              <textarea
                value={newsletterDescription}
                onChange={(e) => setNewsletterDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4E37]"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Копирайт и юридическая информация */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Копирайт и юридическая информация</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Копирайт
              </label>
              <input
                type="text"
                value={copyright}
                onChange={(e) => setCopyright(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4E37]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ИП / Название компании
              </label>
              <input
                type="text"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4E37]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ИНН
              </label>
              <input
                type="text"
                value={inn}
                onChange={(e) => setInn(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4E37]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Юридический адрес
              </label>
              <textarea
                value={legalAddress}
                onChange={(e) => setLegalAddress(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4E37]"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Сохранить */}
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
    </>
  )
}

