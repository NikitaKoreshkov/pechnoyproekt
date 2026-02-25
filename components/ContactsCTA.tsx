'use client'

import { useState, useEffect } from 'react'
import { MessageCircle } from 'lucide-react'

interface FooterConfig {
  phone: string
  phone2?: string
  email: string
  addressLine1: string
  addressLine2: string
  addressLine3: string
  workingHoursLine1: string
  workingHoursLine2: string
  whatsappUrl: string
  whatsappText: string
  youtubeUrl?: string
  telegramUrl?: string
  vkUrl?: string
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
    phone: '+7 (952) 131-52-82',
    phone2: '+7 (982) 709-32-57',
    email: '89521315282@mail.ru',
    addressLine1: 'Санкт-Петербург',
    addressLine2: '',
    addressLine3: '',
    workingHoursLine1: 'Пн-Сб с 9:00 до 20:00',
    workingHoursLine2: 'Вс — выходной',
    whatsappUrl: 'https://max.ru/u/f9LHodD0cOIpDPuCcMZgHcMs8Q34keKCS0fVwDTH9yLudQ6BH_47EGRwPTE',
    whatsappText: 'Печнойпроект\n\nЗдравствуйте! Хочу узнать больше о печных комплексах и мангалах.\n\nГотов(а) ответить на ваши вопросы!',
    youtubeUrl: 'https://www.youtube.com/channel/UCwthYpA8PPvh6DLqUKKaG1w',
    telegramUrl: 'https://t.me/proektmangal96',
    vkUrl: 'https://vk.com/public45498931',
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
            phone: data.phone || '+7 (952) 131-52-82',
            phone2: data.phone2,
            email: data.email || '89521315282@mail.ru',
            addressLine1: data.addressLine1 || 'Санкт-Петербург',
            addressLine2: data.addressLine2 || '',
            addressLine3: data.addressLine3 || '',
            workingHoursLine1: data.workingHoursLine1 || 'Пн-Сб с 9:00 до 20:00',
            workingHoursLine2: data.workingHoursLine2 || 'Вс — выходной',
            whatsappUrl: data.whatsappUrl || 'https://max.ru/u/f9LHodD0cOIpDPuCcMZgHcMs8Q34keKCS0fVwDTH9yLudQ6BH_47EGRwPTE',
            whatsappText: data.whatsappText || 'Печнойпроект\n\nЗдравствуйте! Хочу узнать больше о печных комплексах и мангалах.\n\nГотов(а) ответить на ваши вопросы!',
            youtubeUrl: data.youtubeUrl,
            telegramUrl: data.telegramUrl,
            vkUrl: data.vkUrl,
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

    // Формируем сообщение для MAX
    let message = `📝 ЗАЯВКА С САЙТА

👤 Имя: ${formData.name.trim()}
📞 Телефон: ${formData.phone.trim()}`

    if (formData.message.trim()) {
      message += `\n\n💬 Сообщение:\n${formData.message.trim()}`
    }

    message += '\n\nПрошу связаться со мной!'
    
    // Открываем MAX
    const maxUrl = footerConfig.whatsappUrl?.replace(/\/$/, '') || 'https://max.ru/u/f9LHodD0cOIpDPuCcMZgHcMs8Q34keKCS0fVwDTH9yLudQ6BH_47EGRwPTE'
    const chatUrl = `${maxUrl}?text=${encodeURIComponent(message)}`
    window.open(chatUrl, '_blank')
    
    // Очищаем форму
    setFormData({ name: '', phone: '', message: '' })
    setSubmitStatus({ type: 'success', message: 'MAX открыт! Отправьте сообщение.' })
    setTimeout(() => setSubmitStatus(null), 3000)
  }


  return (
    <section id="contacts" className="py-24 bg-gradient-to-b from-[#EDE8E0] via-[#F5F0E8] to-[#EDE8E0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`transition-all duration-500 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Контактная информация */}
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#5C3825] mb-4 font-medium">Контакты</p>
              <h2 className="text-4xl md:text-5xl font-bold text-[#1A1210] mb-8 font-lora tracking-tight">
                Свяжитесь с нами
              </h2>
              
              <div className="space-y-8">
                {/* Телефон */}
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#1A0F0A]/10 text-[#1A0F0A]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#1A1210] mb-2">Телефон</h3>
                    <a href={`tel:${footerConfig.phone.replace(/[\s()-]/g, '')}`} className="text-[#5C3825] hover:text-[#1A0F0A] transition-colors duration-200">{footerConfig.phone}</a>
                    {footerConfig.phone2 && <><br /><a href={`tel:${footerConfig.phone2.replace(/[\s()-]/g, '')}`} className="text-[#5C3825] hover:text-[#1A0F0A] transition-colors duration-200">{footerConfig.phone2}</a></>}
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#1A0F0A]/10 text-[#1A0F0A]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#1A1210] mb-2">Email</h3>
                    <a href={`mailto:${footerConfig.email}`} className="text-[#5C3825] hover:text-[#1A0F0A] transition-colors duration-200">{footerConfig.email}</a>
                  </div>
                </div>

                {/* Адрес */}
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#1A0F0A]/10 text-[#1A0F0A]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#1A1210] mb-2">Адрес</h3>
                    <div className="text-[#5C3825]/90">
                      <p>{footerConfig.addressLine1}</p>
                      <p>{footerConfig.addressLine2}</p>
                      <p>{footerConfig.addressLine3}</p>
                    </div>
                  </div>
                </div>

                {/* Часы работы */}
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#1A0F0A]/10 text-[#1A0F0A]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#1A1210] mb-2">Часы работы</h3>
                    <p className="text-[#5C3825]/90 mb-1">{footerConfig.workingHoursLine1}</p>
                    <p className="text-[#5C3825]/90">{footerConfig.workingHoursLine2}</p>
                  </div>
                </div>
              </div>

              {/* Социальные сети — все иконки цвета футера */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-[#1A1210] mb-4">Мы в соцсетях</h3>
                <div className="flex flex-wrap gap-3">
                  <a href={footerConfig.whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 text-white rounded-xl flex items-center justify-center transition-all duration-300 hover:opacity-90 bg-[#1A0F0A] border border-[#2C1810]" aria-label="MAX" title={`MAX: ${footerConfig.phone}`}>
                    <MessageCircle className="w-5 h-5" />
                  </a>
                  <a href={footerConfig.youtubeUrl || 'https://www.youtube.com/channel/UCwthYpA8PPvh6DLqUKKaG1w'} target="_blank" rel="noopener noreferrer" className="w-10 h-10 text-white rounded-xl flex items-center justify-center transition-all duration-300 hover:opacity-90 bg-[#1A0F0A] border border-[#2C1810]" aria-label="YouTube">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  </a>
                  <a href={footerConfig.telegramUrl || 'https://t.me/proektmangal96'} target="_blank" rel="noopener noreferrer" className="w-10 h-10 text-white rounded-xl flex items-center justify-center transition-all duration-300 hover:opacity-90 bg-[#1A0F0A] border border-[#2C1810]" aria-label="Telegram">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                  </a>
                  <a href={footerConfig.vkUrl || 'https://vk.com/public45498931'} target="_blank" rel="noopener noreferrer" className="w-10 h-10 text-white rounded-xl flex items-center justify-center transition-all duration-300 hover:opacity-90 bg-[#1A0F0A] border border-[#2C1810]" aria-label="VK">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.525-2.049-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.049.17.49-.085.744-.576.744z"/></svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Форма заявки */}
            <div className="bg-white rounded-2xl p-8 md:p-10 border border-[#E8E2D9] shadow-[0_8px_40px_-12px_rgba(26,15,10,0.12)]">
              <h3 className="text-2xl font-bold text-[#1A1210] mb-6 font-lora">
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
                      borderColor: '#1A0F0A',
                      '--focus-ring': '#4A2C1A' 
                    } as any}
                    onFocus={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255, 255, 255, 0.5)'
                      e.currentTarget.style.borderColor = '#1A0F0A'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = ''
                      e.currentTarget.style.borderColor = '#1A0F0A'
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
                      borderColor: '#1A0F0A',
                      '--focus-ring': '#4A2C1A' 
                    } as any}
                    onFocus={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255, 255, 255, 0.5)'
                      e.currentTarget.style.borderColor = '#1A0F0A'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = ''
                      e.currentTarget.style.borderColor = '#1A0F0A'
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
                      borderColor: '#1A0F0A',
                      '--focus-ring': '#4A2C1A' 
                    } as any}
                    onFocus={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255, 255, 255, 0.5)'
                      e.currentTarget.style.borderColor = '#1A0F0A'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = ''
                      e.currentTarget.style.borderColor = '#1A0F0A'
                    }}
                    placeholder="Опишите ваши требования к продукции и услугам..."
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
                  className="w-full px-6 py-4 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2 tracking-widest uppercase text-sm"
                  style={{ 
                    backgroundColor: '#1A0F0A',
                    willChange: 'transform',
                    backfaceVisibility: 'hidden',
                    boxShadow: '0 4px 20px rgba(26,15,10,0.3)'
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
