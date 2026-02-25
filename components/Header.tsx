'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import CallbackModal from './CallbackModal'
import CatalogOverlay from './CatalogOverlay'
import Image from 'next/image'

interface HeaderConfig {
  logoText: string
  logoImage: string | null
  showLogoText: boolean
}

interface HeaderProps {
  /** Белые ссылки и элементы для тёмного фона (checkout и т.д.) */
  variant?: 'default' | 'light'
}

export default function Header({ variant = 'default' }: HeaderProps) {
  const isLight = variant === 'light'
  const textClass = isLight ? 'text-white' : 'text-black'
  const linkUnderlineClass = isLight ? 'bg-white' : 'bg-black'
  const btnClass = isLight
    ? 'border-white text-white hover:bg-white hover:text-[#0D0805]'
    : 'border-black text-black hover:bg-[#2C1810] hover:text-white hover:border-[#2C1810]'
  // Мобильное меню
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  // Панель каталога во весь экран
  const [isCatalogOverlayOpen, setIsCatalogOverlayOpen] = useState(false)
  // Модальное окно обратного звонка
  const [isCallbackModalOpen, setIsCallbackModalOpen] = useState(false)
  // Конфигурация хедера - начинаем с null, чтобы не показывать старые данные
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Слушаем глобальное событие открытия каталога (для кнопок "Смотреть каталог", "Посмотреть весь каталог")
  useEffect(() => {
    const handler = () => setIsCatalogOverlayOpen(true)
    window.addEventListener('open-catalog-overlay', handler)
    return () => window.removeEventListener('open-catalog-overlay', handler)
  }, [])

  // Слушаем глобальное событие открытия модалки обратного звонка
  useEffect(() => {
    const handler = () => setIsCallbackModalOpen(true)
    window.addEventListener('open-callback-modal', handler)
    return () => window.removeEventListener('open-callback-modal', handler)
  }, [])

  // Загружаем конфигурацию хедера синхронно при монтировании
  useEffect(() => {
    const loadHeaderConfig = async () => {
      try {
        setIsLoading(true)
        const res = await fetch('/api/admin/header', { 
          cache: 'no-store',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-store'
          }
        })
        if (res.ok) {
          const data = await res.json()
          console.log('[HEADER] Loaded config:', data)
          // Устанавливаем загруженные данные или дефолтные значения
          if (data && (data.logoText || data.logoImage !== undefined || data.showLogoText !== undefined)) {
            setHeaderConfig(data)
          } else {
            // Если данных нет, используем дефолтные
            setHeaderConfig({
              logoText: 'Печнойпроект',
              logoImage: null,
              showLogoText: true
            })
          }
        } else {
          // Если ошибка загрузки, используем дефолтные значения
          setHeaderConfig({
            logoText: 'Печнойпроект',
            logoImage: null,
            showLogoText: true
          })
        }
      } catch (error) {
        console.error('Error loading header config:', error)
        // При ошибке тоже используем дефолтные значения
        setHeaderConfig({
          logoText: 'Печнойпроект',
          logoImage: null,
          showLogoText: true
        })
      } finally {
        setIsLoading(false)
      }
    }
    loadHeaderConfig()
  }, [])

  // Блокируем скролл страницы при открытом бургере
  useEffect(() => {
    if (typeof window === 'undefined') return
    const body = document.body
    if (isMobileOpen) {
      body.style.overflow = 'hidden'
    } else {
      body.style.overflow = ''
    }
    return () => {
      body.style.overflow = ''
    }
  }, [isMobileOpen])

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="backdrop-blur-xl bg-white/5 border-b border-white/20">
        <div className="w-full px-2 md:px-12 lg:px-16">
          <div className="grid grid-cols-2 bp:grid-cols-3 items-center h-16">
            {/* Логотип - показываем только после загрузки данных */}
            <div className="flex-shrink-0 justify-self-start">
              {!isLoading && headerConfig && (
                <Link 
                  href="/"
                  className="flex items-center gap-3"
                >
                  {headerConfig.logoImage && (
                    <Image
                      src={headerConfig.logoImage}
                      alt="Logo"
                      width={40}
                      height={40}
                      className={`h-10 w-auto object-contain brightness-0 ${isLight ? 'invert' : ''}`}
                    />
                  )}
                  {headerConfig.showLogoText && (
                    <span className={`text-base md:text-lg font-bold font-lora tracking-wide ${textClass}`}>
                      {headerConfig.logoText || 'Печнойпроект'}
                    </span>
                  )}
                </Link>
              )}
              {/* Плейсхолдер для предотвращения сдвига макета */}
              {isLoading && (
                <div className="flex items-center gap-3 h-10 w-32 bg-transparent">
                  {/* Пустой блок для резервирования места */}
                </div>
              )}
            </div>

            {/* Центральное меню */}
            <nav className={`hidden bp:flex md:space-x-4 lg:space-x-5 xl:space-x-12 justify-self-center font-inter md:text-[13px] lg:text-[13px] xl:text-[15px] ${textClass}`}>
              <Link 
                href="/portfolio" 
                className="whitespace-nowrap relative group"
              >
                Воплощённые объекты
                <span className={`absolute bottom-0 left-0 w-0 h-0.5 ${linkUnderlineClass} transition-all duration-200 group-hover:w-full`}></span>
              </Link>
              <Link 
                href={{ pathname: '/', hash: 'calculator' }} 
                className="whitespace-nowrap relative group"
              >
                Калькулятор
                <span className={`absolute bottom-0 left-0 w-0 h-0.5 ${linkUnderlineClass} transition-all duration-200 group-hover:w-full`}></span>
              </Link>
              <button
                type="button"
                onClick={() => setIsCatalogOverlayOpen(true)}
                className="whitespace-nowrap relative group"
              >
                Каталог
                <span className={`absolute bottom-0 left-0 w-0 h-0.5 ${linkUnderlineClass} transition-all duration-200 group-hover:w-full`}></span>
              </button>
              <Link 
                href="/arhitektura" 
                className="whitespace-nowrap relative group"
              >
                Архитектура решений
                <span className={`absolute bottom-0 left-0 w-0 h-0.5 ${linkUnderlineClass} transition-all duration-200 group-hover:w-full`}></span>
              </Link>
              <Link 
                href="/o-nas" 
                className="whitespace-nowrap relative group"
              >
                О нас
                <span className={`absolute bottom-0 left-0 w-0 h-0.5 ${linkUnderlineClass} transition-all duration-200 group-hover:w-full`}></span>
              </Link>
            </nav>

            {/* Бургер для мобилки */}
            <button
              aria-label="Открыть меню"
              className={`bp:hidden justify-self-end ${textClass}`}
              onClick={() => setIsMobileOpen(true)}
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {/* Правые кнопки (скрыты на мобиле) */}
            <div className="hidden bp:flex items-center justify-self-end gap-4 lg:gap-6">
              <button 
                onClick={() => setIsCallbackModalOpen(true)}
                className={`inline-flex items-center md:px-4 md:py-2 lg:px-4 lg:py-2 xl:px-4 xl:py-2 2xl:px-5 2xl:py-2.5 rounded-xl border-2 font-inter font-semibold tracking-wide transition-colors duration-200 md:text-sm lg:text-sm xl:text-sm 2xl:text-base ${btnClass}`}
              >
                Заказать звонок
              </button>
              
              {/* SVG иконка профиля - круглая */}
              <Link href="/profile" className={`inline-flex items-center ${textClass}`}>
                <svg width="28" height="28" viewBox="0 0 32 32" fill="none" className="lg:w-8 lg:h-8">
                  <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="16" cy="12" r="4" fill="currentColor"/>
                  <path d="M8 24c0-4 3.5-7 8-7s8 3 8 7" fill="currentColor"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* Мобильное меню */}
      <MobileMenu 
        open={isMobileOpen} 
        onClose={() => setIsMobileOpen(false)}
        onOpenCatalog={() => {
          setIsMobileOpen(false)
          setTimeout(() => setIsCatalogOverlayOpen(true), 200)
        }}
        onOpenCallback={() => {
          setIsMobileOpen(false)
          setTimeout(() => setIsCallbackModalOpen(true), 300)
        }}
      />
      {/* Панель каталога во весь экран */}
      <CatalogOverlay isOpen={isCatalogOverlayOpen} onClose={() => setIsCatalogOverlayOpen(false)} />
      {/* Модальное окно обратного звонка */}
      <CallbackModal isOpen={isCallbackModalOpen} onClose={() => setIsCallbackModalOpen(false)} />
    </header>
  )
}

// Мобильное выезжающее меню
// Вынесем рядом, чтобы избежать SSR-модальных библиотек
export function MobileMenu({ open, onClose, onOpenCatalog, onOpenCallback }: { open: boolean; onClose: () => void; onOpenCatalog?: () => void; onOpenCallback: () => void }) {
  return (
    <div className={`fixed inset-0 z-[60] bp:hidden ${open ? '' : 'pointer-events-none'}`}>
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
        <div
        className={`absolute top-0 right-0 h-full w-80 bg-[#FAF7F2] text-[#1A1210] shadow-2xl transform transition-transform duration-300 border-l border-[#E8E2D9] ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-6 flex items-center justify-between border-b border-[#E8E2D9]">
          <span className="text-lg font-bold text-[#1A0F0A]">Меню</span>
          <button aria-label="Закрыть" onClick={onClose} className="text-[#5C3825]/80 hover:text-[#1A0F0A]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="p-4 space-y-1">
          <Link
            href="/profile"
            onClick={onClose}
            className="block px-4 py-3 rounded-lg hover:bg-[#EDE8E0] transition-colors text-[#1A1210]"
          >
            Профиль
          </Link>
          <div className="my-2 border-t border-[#E8E2D9]" />

          <Link href="/portfolio" onClick={onClose} className="block px-4 py-3 rounded-lg hover:bg-[#EDE8E0] transition-colors text-[#1A1210]">Воплощённые объекты</Link>
          <Link href={{ pathname: '/', hash: 'calculator' }} onClick={onClose} className="block px-4 py-3 rounded-lg hover:bg-[#EDE8E0] transition-colors text-[#1A1210]">Калькулятор</Link>
          <button type="button" onClick={() => { onClose(); onOpenCatalog?.(); }} className="block w-full text-left px-4 py-3 rounded-lg hover:bg-[#EDE8E0] transition-colors text-[#1A1210]">Каталог</button>
          <Link href="/arhitektura" onClick={onClose} className="block px-4 py-3 rounded-lg hover:bg-[#EDE8E0] transition-colors text-[#1A1210]">Архитектура решений</Link>
          <Link href="/o-nas" onClick={onClose} className="block px-4 py-3 rounded-lg hover:bg-[#EDE8E0] transition-colors text-[#1A1210]">О нас</Link>

          <button
            onClick={onOpenCallback}
            className="mt-4 w-full text-center px-4 py-3 rounded-xl bg-[#1A0F0A] text-white border border-[#1A0F0A] hover:bg-[#2C1810] transition-colors font-semibold"
          >
            Заказать звонок
          </button>
        </nav>
      </div>
    </div>
  )
}