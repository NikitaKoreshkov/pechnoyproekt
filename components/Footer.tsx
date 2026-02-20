'use client'

import { useState, useRef, useEffect } from 'react'

interface FooterConfig {
  companyName: string
  companyDescription: string
  whatsappUrl: string
  whatsappText: string
  phone: string
  email: string
  addressLine1: string
  addressLine2: string
  addressLine3: string
  workingHoursLine1: string
  workingHoursLine2: string
  newsletterTitle: string
  newsletterDescription: string
  copyright: string
  ip: string
  inn: string
  legalAddress: string
}

export default function Footer() {
  const [email, setEmail] = useState('')
  const [notif, setNotif] = useState<{ text: string; type: 'success'|'warning' }|null>(null)
  const notifTimeout = useRef<NodeJS.Timeout|null>(null)
  const [footerConfig, setFooterConfig] = useState<FooterConfig>({
    companyName: 'АкваГазТех',
    companyDescription: 'Поставка качественных труб ПНД и комплектующих для инженерных систем. Надежно, выгодно, с гарантией качества.',
    whatsappUrl: 'https://wa.me/79313023008',
    whatsappText: '🔧 АкваГазТех\n\nЗдравствуйте! Хочу узнать больше о трубах ПНД и материалах.\n\nГотов(а) ответить на ваши вопросы!',
    phone: '+7 (931) 302-30-08',
    email: 'agtspb@inbox.ru',
    addressLine1: '188680, Ленинградская обл.,',
    addressLine2: 'Всеволожский р-н, г. Колтуши,',
    addressLine3: 'ул. Мира, д. 9, кв. 222',
    workingHoursLine1: 'Пн-Пт: 9:00 - 18:00',
    workingHoursLine2: 'Сб-Вс: выходные',
    newsletterTitle: 'Новости и акции',
    newsletterDescription: 'Подпишитесь на рассылку и получайте информацию о новых поступлениях и специальных предложениях',
    copyright: '© 2025 АкваГазТех. Все права защищены.',
    ip: 'ООО "АКВАГАЗТЕХ"',
    inn: 'ИНН: 4706094590, КПП: 470601001, ОГРН: 1254700021575',
    legalAddress: 'Юридический адрес: 188680, РОССИЯ, ЛЕНИНГРАДСКАЯ ОБЛ, ВСЕВОЛОЖСКИЙ Р-Н, Г КОЛТУШИ, УЛ МИРА, Д 9, КВ 222'
  })

  // Загружаем конфигурацию футера из БД
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
          console.log('[FOOTER] Loaded config:', { 
            companyName: data.companyName, 
            copyright: data.copyright,
            phone: data.phone,
            email: data.email
          })
          setFooterConfig(data)
        }
      } catch (error) {
        console.error('Error loading footer config:', error)
      }
    }
    loadFooterConfig()
  }, [])

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (data?.alreadySubscribed) {
        setNotif({ text: 'Вы уже подписаны!', type: 'warning' })
      } else if (data?.message) {
        setNotif({ text: 'Вы успешно подписаны!', type: 'success' })
        setEmail('')
      } else {
        setNotif({ text: data?.error || 'Ошибка. Попробуйте позже', type: 'warning' })
      }
    } catch (e) {
      setNotif({ text: 'Ошибка при подключении', type: 'warning' })
    }
  }

  useEffect(() => {
    if (notif) {
      if (notifTimeout.current) clearTimeout(notifTimeout.current)
      notifTimeout.current = setTimeout(() => setNotif(null), 3000)
    }
    return () => notifTimeout.current && clearTimeout(notifTimeout.current)
  }, [notif])

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* О компании */}
          <div>
            <h3 className="text-xl font-bold mb-6">{footerConfig.companyName}</h3>
            <p className="text-gray-300 mb-6 leading-relaxed">
              {footerConfig.companyDescription}
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://wa.me/79313023008"
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 bg-gray-800 text-white rounded-lg flex items-center justify-center hover:bg-[#1E3A5F] transition-colors duration-200" 
                aria-label="WhatsApp"
                title="WhatsApp: +7 (931) 302-30-08"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Навигация */}
          <div>
            <h3 className="text-xl font-bold mb-6">Навигация</h3>
            <ul className="space-y-3">
              <li>
                <a href="/#projects-catalog" className="text-gray-300 hover:text-[#1E3A5F] transition-colors duration-200">
                  Каталог
                </a>
              </li>
              <li>
                <a href="/#calculator" className="text-gray-300 hover:text-[#1E3A5F] transition-colors duration-200">
                  Калькулятор
                </a>
              </li>
              <li>
                <a href="/#process-steps" className="text-gray-300 hover:text-[#1E3A5F] transition-colors duration-200">
                  Как работаем
                </a>
              </li>
              <li>
                <a href="/#advantages" className="text-gray-300 hover:text-[#1E3A5F] transition-colors duration-200">
                  Преимущества
                </a>
              </li>
              <li>
                <a href="/#reviews-gallery" className="text-gray-300 hover:text-[#1E3A5F] transition-colors duration-200">
                  Отзывы
                </a>
              </li>
              <li>
                <a href="/#faq" className="text-gray-300 hover:text-[#1E3A5F] transition-colors duration-200">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Контакты */}
          <div>
            <h3 className="text-xl font-bold mb-6">Контакты</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-[#1E3A5F] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div>
                  <a href={`tel:${footerConfig.phone.replace(/[\s()-]/g, '')}`} className="text-gray-300 hover:text-[#1E3A5F] transition-colors duration-200 block">{footerConfig.phone}</a>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-[#1E3A5F] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href={`mailto:${footerConfig.email}`} className="text-gray-300 hover:text-[#1E3A5F] transition-colors duration-200">{footerConfig.email}</a>
              </div>
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-[#1E3A5F] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="text-gray-300">{footerConfig.addressLine1}</p>
                  <p className="text-gray-300">{footerConfig.addressLine2}</p>
                  <p className="text-gray-300">{footerConfig.addressLine3}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-[#1E3A5F] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-gray-300">{footerConfig.workingHoursLine1}</p>
                  <p className="text-gray-300">{footerConfig.workingHoursLine2}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Подписка на новости */}
          <div>
            <h3 className="text-xl font-bold mb-6">{footerConfig.newsletterTitle}</h3>
            <p className="text-gray-300 mb-4">
              {footerConfig.newsletterDescription}
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ваш email"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent transition-colors duration-200"
                required
              />
              <button
                type="submit"
                className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 text-gray-300 hover:bg-[#1E3A5F] hover:border-[#1E3A5F] hover:text-white font-semibold rounded-lg transition-colors duration-200"
              >
                Подписаться
              </button>
              {/* Notification строго под кнопкой, не влияет на остальное */}
              <div className={`w-full transition-all duration-500 mt-2 ${notif ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                {notif && (
                  <div className={`w-full ${notif.type==='success' ? 'bg-green-500 text-white' : notif.type==='warning' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-800'} rounded-lg shadow text-center text-base font-medium px-6 py-3 transition-all duration-500`}>{notif.text}</div>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Нижняя часть футера */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              {footerConfig.copyright}
            </div>
            <div className="flex flex-wrap gap-4 justify-center md:justify-end text-sm">
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#1E3A5F] transition-colors duration-200">
                Политика конфиденциальности
              </a>
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#1E3A5F] transition-colors duration-200">
                Условия использования
              </a>
              <a href="/cookies" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#1E3A5F] transition-colors duration-200">
                Политика Cookie
              </a>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500 space-y-1">
            <p>{footerConfig.ip}</p>
            <p>{footerConfig.inn}</p>
            <p>{footerConfig.legalAddress}</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
