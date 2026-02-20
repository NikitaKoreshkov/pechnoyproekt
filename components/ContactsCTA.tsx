'use client'

import { useState, useEffect } from 'react'

interface FooterConfig {
  phone: string
  email: string
  addressLine1: string
  addressLine2: string
  addressLine3: string
  workingHoursLine1: string
  workingHoursLine2: string
  whatsappUrl: string
  whatsappText: string
}

export default function ContactsCTA() {
  const [isVisible, setIsVisible] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [footerConfig, setFooterConfig] = useState<FooterConfig>({
    phone: '+7 (931) 302-30-08',
    email: 'agtspb@inbox.ru',
    addressLine1: '188680, Ленинградская обл.,',
    addressLine2: 'Всеволожский р-н, г. Колтуши,',
    addressLine3: 'ул. Мира, д. 9, кв. 222',
    workingHoursLine1: 'Пн-Пт: 9:00 - 18:00',
    workingHoursLine2: 'Сб-Вс: выходные',
    whatsappUrl: 'https://max.ru/u/f9LHodD0cOJ11mRNBmwv4GMET8TQOYXsn4AglpOBhEGg5JpR7w9zmuv4jZ8',
    whatsappText: '🔧 АкваГазТех\n\nЗдравствуйте! Хочу узнать больше о трубах ПНД и комплектующих.\n\nГотов(а) ответить на ваши вопросы!'
  })

  // Загружаем конфигурацию контактов из БД
  useEffect(() => {
    const loadFooterConfig = async () => {
      try {
        const timestamp = Date.now()
        const res = await fetch(`/api/admin/footer?t=${timestamp}`, { 
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        })
        if (res.ok) {
          const data = await res.json()
          console.log('[CONTACTS CTA] Loaded footer config:', { phone: data.phone, email: data.email })
          setFooterConfig({
            phone: data.phone || '+7 (931) 302-30-08',
            email: data.email || 'agtspb@inbox.ru',
            addressLine1: data.addressLine1 || '188680, Ленинградская обл.,',
            addressLine2: data.addressLine2 || 'Всеволожский р-н, г. Колтуши,',
            addressLine3: data.addressLine3 || 'ул. Мира, д. 9, кв. 222',
            workingHoursLine1: data.workingHoursLine1 || 'Пн-Пт: 9:00 - 18:00',
            workingHoursLine2: data.workingHoursLine2 || 'Сб-Вс: выходные',
            whatsappUrl: data.whatsappUrl || 'https://max.ru/u/f9LHodD0cOJ11mRNBmwv4GMET8TQOYXsn4AglpOBhEGg5JpR7w9zmuv4jZ8',
            whatsappText: data.whatsappText || '🔧 АкваГазТех\n\nЗдравствуйте! Хочу узнать больше о трубах ПНД и комплектующих.\n\nГотов(а) ответить на ваши вопросы!'
          })
        }
      } catch (error) {
        console.error('Error loading footer config:', error)
      }
    }
    loadFooterConfig()
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    const element = document.getElementById('contacts')
    if (element) {
      observer.observe(element)
    }

    return () => observer.disconnect()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      setSubmitStatus({ type: 'error', message: 'Пожалуйста, заполните все обязательные поля' })
      setTimeout(() => setSubmitStatus(null), 3000)
      return
    }

    // Формируем сообщение для WhatsApp
    let message = `📝 ЗАЯВКА С САЙТА

👤 Имя: ${formData.name.trim()}
📞 Телефон: ${formData.phone.trim()}`

    if (formData.message.trim()) {
      message += `\n\n💬 Сообщение:\n${formData.message.trim()}`
    }

    message += '\n\nПрошу связаться со мной!'
    
    // Открываем WhatsApp
    const whatsappNumber = '79313023008'
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
    
    // Очищаем форму
    setFormData({ name: '', phone: '', message: '' })
    setSubmitStatus({ type: 'success', message: 'WhatsApp открыт! Отправьте сообщение.' })
    setTimeout(() => setSubmitStatus(null), 3000)
  }


  return (
    <section id="contacts" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`transition-all duration-500 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Контактная информация */}
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-8">
                Свяжитесь с нами
              </h2>
              
              <div className="space-y-8">
                {/* Телефон */}
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E8F0F8', color: '#1E3A5F' }}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Телефон</h3>
                    <a href={`tel:${footerConfig.phone.replace(/[\s()-]/g, '')}`} className="text-gray-600 transition-colors duration-200" style={{ '--hover-color': '#1E3A5F' } as any} onMouseEnter={(e) => e.currentTarget.style.color = '#1E3A5F'} onMouseLeave={(e) => e.currentTarget.style.color = '#4B5563'}>{footerConfig.phone}</a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E8F0F8', color: '#1E3A5F' }}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Email</h3>
                    <a href={`mailto:${footerConfig.email}`} className="text-gray-600 transition-colors duration-200" onMouseEnter={(e) => e.currentTarget.style.color = '#1E3A5F'} onMouseLeave={(e) => e.currentTarget.style.color = '#4B5563'}>{footerConfig.email}</a>
                  </div>
                </div>

                {/* Адрес */}
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E8F0F8', color: '#1E3A5F' }}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Адрес</h3>
                    <div className="text-gray-600">
                      <p>{footerConfig.addressLine1}</p>
                      <p>{footerConfig.addressLine2}</p>
                      <p>{footerConfig.addressLine3}</p>
                    </div>
                  </div>
                </div>

                {/* Часы работы */}
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E8F0F8', color: '#1E3A5F' }}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Часы работы</h3>
                    <p className="text-gray-600 mb-1">{footerConfig.workingHoursLine1}</p>
                    <p className="text-gray-600">{footerConfig.workingHoursLine2}</p>
                  </div>
                </div>
              </div>

              {/* Социальные сети */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Мы в соцсетях</h3>
                <div className="flex space-x-4">
                  <a 
                    href="https://wa.me/79313023008"
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-10 h-10 text-white rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-110" 
                    style={{ 
                      backgroundColor: '#1E3A5F',
                      willChange: 'transform',
                      backfaceVisibility: 'hidden'
                    }}
                    aria-label="WhatsApp"
                    title="WhatsApp: +7 (931) 302-30-08"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Форма заявки */}
            <div className="bg-gray-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Оставить заявку
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Ваше имя *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border rounded-lg transition-all duration-200"
                    style={{ 
                      borderColor: '#1E3A5F',
                      '--focus-ring': '#1E3A5F' 
                    } as any}
                    onFocus={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 0 2px #1E3A5F'
                      e.currentTarget.style.borderColor = '#1E3A5F'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = ''
                      e.currentTarget.style.borderColor = '#1E3A5F'
                    }}
                    placeholder="Введите ваше имя"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Телефон *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border rounded-lg transition-all duration-200"
                    style={{ 
                      borderColor: '#1E3A5F',
                      '--focus-ring': '#1E3A5F' 
                    } as any}
                    onFocus={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 0 2px #1E3A5F'
                      e.currentTarget.style.borderColor = '#1E3A5F'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = ''
                      e.currentTarget.style.borderColor = '#1E3A5F'
                    }}
                    placeholder="+7 (___) ___-__-__"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Сообщение
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border rounded-lg transition-all duration-200"
                    style={{ 
                      borderColor: '#1E3A5F',
                      '--focus-ring': '#1E3A5F' 
                    } as any}
                    onFocus={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 0 2px #1E3A5F'
                      e.currentTarget.style.borderColor = '#1E3A5F'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = ''
                      e.currentTarget.style.borderColor = '#1E3A5F'
                    }}
                    placeholder="Опишите ваши требования к трубам и материалам..."
                  />
                </div>

                {submitStatus && (
                  <div className={`p-4 rounded-lg ${submitStatus.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {submitStatus.message}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-4 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                  style={{ 
                    backgroundColor: '#1E3A5F',
                    willChange: 'transform',
                    backfaceVisibility: 'hidden'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Отправка...
                    </>
                  ) : (
                    <>
                      <svg className="hidden sm:block w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Отправить заявку
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
