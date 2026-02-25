'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle } from 'lucide-react'
import SparksEffect from '@/components/SparksEffect'

interface FooterConfig {
  companyName: string
  companyDescription: string
  whatsappUrl: string
  whatsappText: string
  phone: string
  phone2?: string
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
  youtubeUrl?: string
  telegramUrl?: string
  vkUrl?: string
}

export default function Footer() {
  const [email, setEmail] = useState('')
  const [notif, setNotif] = useState<{ text: string; type: 'success'|'warning' }|null>(null)
  const notifTimeout = useRef<NodeJS.Timeout|null>(null)
  const [footerConfig, setFooterConfig] = useState<FooterConfig>({
    companyName: 'Печнойпроект',
    companyDescription: 'Качественные услуги и продукция. Надёжно, выгодно, с гарантией качества.',
    whatsappUrl: 'https://max.ru/u/f9LHodD0cOIpDPuCcMZgHcMs8Q34keKCS0fVwDTH9yLudQ6BH_47EGRwPTE',
    whatsappText: 'Печнойпроект\n\nЗдравствуйте! Хочу узнать больше о печных комплексах и мангалах.\n\nГотов(а) ответить на ваши вопросы!',
    phone: '+7 (952) 131-52-82',
    youtubeUrl: 'https://www.youtube.com/channel/UCwthYpA8PPvh6DLqUKKaG1w',
    telegramUrl: 'https://t.me/proektmangal96',
    vkUrl: 'https://vk.com/public45498931',
    email: 'agtspb@inbox.ru',
    addressLine1: 'Санкт-Петербург',
    addressLine2: '',
    addressLine3: '',
    workingHoursLine1: 'Пн-Пт: 9:00 - 18:00',
    workingHoursLine2: 'Сб-Вс: выходные',
    newsletterTitle: 'Новости и акции',
    newsletterDescription: 'Подпишитесь на рассылку и получайте информацию о новых поступлениях и специальных предложениях',
    copyright: '© 2025. Все права защищены.',
    ip: '',
    inn: 'ИНН: 4706094590, КПП: 470601001, ОГРН: 1254700021575',
    legalAddress: 'Санкт-Петербург'
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
    <footer className="relative overflow-hidden bg-[#1A0F0A] text-[#EDE8E0] border-t border-white/20">
      <SparksEffect />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* О компании */}
          <div>
            <h3 className="text-xl font-bold mb-6">{footerConfig.companyName}</h3>
            <p className="text-[#EDE6D9]/80 mb-6 leading-relaxed">
              {footerConfig.companyDescription}
            </p>
            <div className="flex flex-wrap gap-3">
              <a href={footerConfig.whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#2C1810] border border-white/10 text-white rounded-xl flex items-center justify-center hover:bg-[#3d2818] transition-all duration-200" aria-label="MAX" title={`MAX: ${footerConfig.phone}`}>
                <MessageCircle className="w-5 h-5" />
              </a>
              <a href={footerConfig.youtubeUrl || 'https://www.youtube.com/channel/UCwthYpA8PPvh6DLqUKKaG1w'} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#2C1810] border border-white/10 text-white rounded-xl flex items-center justify-center hover:bg-[#3d2818] transition-all duration-200" aria-label="YouTube">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a href={footerConfig.telegramUrl || 'https://t.me/proektmangal96'} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#2C1810] border border-white/10 text-white rounded-xl flex items-center justify-center hover:bg-[#3d2818] transition-all duration-200" aria-label="Telegram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              </a>
              <a href={footerConfig.vkUrl || 'https://vk.com/public45498931'} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#2C1810] border border-white/10 text-white rounded-xl flex items-center justify-center hover:bg-[#3d2818] transition-all duration-200" aria-label="VK">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.525-2.049-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.049.17.49-.085.744-.576.744z"/></svg>
              </a>
            </div>
          </div>

          {/* Навигация */}
          <div>
            <h3 className="text-xl font-bold mb-6">Навигация</h3>
            <ul className="space-y-3">
              <li>
                <a href="/#projects-catalog" className="text-[#EDE6D9]/80 hover:text-white transition-colors duration-200">
                  Каталог
                </a>
              </li>
              <li>
                <a href="/#calculator" className="text-[#EDE6D9]/80 hover:text-white transition-colors duration-200">
                  Калькулятор
                </a>
              </li>
              <li>
                <a href="/#process-steps" className="text-[#EDE6D9]/80 hover:text-white transition-colors duration-200">
                  Как работаем
                </a>
              </li>
              <li>
                <a href="/#advantages" className="text-[#EDE6D9]/80 hover:text-white transition-colors duration-200">
                  Преимущества
                </a>
              </li>
              <li>
                <a href="/#reviews-gallery" className="text-[#EDE6D9]/80 hover:text-white transition-colors duration-200">
                  Отзывы
                </a>
              </li>
              <li>
                <a href="/#faq" className="text-[#EDE6D9]/80 hover:text-white transition-colors duration-200">
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
                <svg className="w-5 h-5 text-white mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div>
                  <a href={`tel:${footerConfig.phone.replace(/[\s()-]/g, '')}`} className="text-[#EDE6D9]/80 hover:text-white transition-colors duration-200 block">{footerConfig.phone}</a>
                  {footerConfig.phone2 && <a href={`tel:${footerConfig.phone2.replace(/[\s()-]/g, '')}`} className="text-[#EDE6D9]/80 hover:text-white transition-colors duration-200 block mt-1">{footerConfig.phone2}</a>}
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-white mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href={`mailto:${footerConfig.email}`} className="text-[#EDE6D9]/80 hover:text-white transition-colors duration-200">{footerConfig.email}</a>
              </div>
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-white mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  {(footerConfig.addressLine1 || footerConfig.addressLine2 || footerConfig.addressLine3) ? (
                    <>
                      {footerConfig.addressLine1 && <p className="text-[#EDE6D9]/80">{footerConfig.addressLine1}</p>}
                      {footerConfig.addressLine2 && <p className="text-[#EDE6D9]/80">{footerConfig.addressLine2}</p>}
                      {footerConfig.addressLine3 && <p className="text-[#EDE6D9]/80">{footerConfig.addressLine3}</p>}
                    </>
                  ) : (
                    <p className="text-[#EDE6D9]/80">Санкт-Петербург</p>
                  )}
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-white mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-[#EDE6D9]/80">{footerConfig.workingHoursLine1}</p>
                  <p className="text-[#EDE6D9]/80">{footerConfig.workingHoursLine2}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Подписка на новости */}
          <div>
            <h3 className="text-xl font-bold mb-6">{footerConfig.newsletterTitle}</h3>
            <p className="text-[#EDE6D9]/80 mb-4">
              {footerConfig.newsletterDescription}
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ваш email"
                className="w-full px-4 py-3 bg-[#2C1810]/50 border border-white/30 rounded-xl text-[#EDE8E0] placeholder-[#EDE8E0]/50 focus:ring-2 focus:ring-white/50 focus:border-white transition-colors duration-200"
                required
              />
              <button
                type="submit"
                className="w-full px-4 py-3 bg-transparent border-2 border-white/60 text-[#EDE8E0] hover:bg-white hover:border-white hover:text-[#1A0F0A] font-semibold rounded-xl transition-all duration-200 tracking-wider"
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
        <div className="border-t border-white/20 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-[#EDE6D9]/70 text-sm">
              {footerConfig.copyright}
            </div>
            <div className="flex flex-wrap gap-4 justify-center md:justify-end text-sm">
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[#EDE6D9]/60 hover:text-white transition-colors duration-200">
                Политика конфиденциальности
              </a>
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-[#EDE6D9]/60 hover:text-white transition-colors duration-200">
                Условия использования
              </a>
              <a href="/cookies" target="_blank" rel="noopener noreferrer" className="text-[#EDE6D9]/60 hover:text-white transition-colors duration-200">
                Политика Cookie
              </a>
            </div>
          </div>
          <div className="mt-4 text-xs text-[#EDE6D9]/50 space-y-1">
            <p>{footerConfig.ip}</p>
            <p>{footerConfig.inn}</p>
            <p>{footerConfig.legalAddress}</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
