'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface CallbackModalProps {
  isOpen: boolean
  onClose: () => void
}

const STORAGE_KEY = 'aquagazteh_callback_data'

export default function CallbackModal({ isOpen, onClose }: CallbackModalProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  // Загружаем сохраненные данные при открытии модального окна
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY)
        if (savedData) {
          const parsed = JSON.parse(savedData)
          if (parsed.name && typeof parsed.name === 'string') {
            setName(parsed.name)
          }
          if (parsed.phone && typeof parsed.phone === 'string') {
            setPhone(parsed.phone)
          }
        }
      } catch (error) {
        console.error('Error loading saved callback data:', error)
      }
    }
  }, [isOpen])

  // Блокируем скролл страницы при открытом модальном окне
  useEffect(() => {
    if (typeof window === 'undefined') return
    const body = document.body
    if (isOpen) {
      body.style.overflow = 'hidden'
    } else {
      body.style.overflow = ''
    }
    return () => {
      body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim() || !phone.trim()) {
      return
    }

    // Формируем сообщение для WhatsApp
    const message = `Здравствуйте! Меня зовут ${name.trim()}. Мой номер телефона: ${phone.trim()}. Хочу заказать звонок.`
    
    // Открываем WhatsApp
    const whatsappNumber = '79313023008'
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
    
    // Сохраняем данные в localStorage для следующего раза
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          name: name.trim(),
          phone: phone.trim()
        }))
      } catch (error) {
        console.error('Error saving callback data:', error)
      }
    }
    
    // Закрываем модальное окно
    onClose()
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl transform transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900 font-inter">
            Заказать звонок
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Ваше имя
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent outline-none transition-all"
                placeholder="Введите ваше имя"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Номер телефона
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent outline-none transition-all"
                placeholder="+7 (___) ___-__-__"
              />
            </div>

            <button
              type="submit"
              disabled={!name.trim() || !phone.trim()}
              className="w-full py-3 bg-[#1E3A5F] hover:bg-[#2C5282] text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              Открыть WhatsApp
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

