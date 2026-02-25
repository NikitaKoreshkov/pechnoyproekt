'use client'

import { useState, useEffect } from 'react'
import SparksEffect from '@/components/SparksEffect'

interface Advantage {
  id: number
  title: string
  description: string
}

interface CompanyInfo {
  title: string
  mainMission: string
  specialization: string
  advantages: Advantage[]
  conclusion: string
}

export default function AboutCompany() {
  const [isVisible, setIsVisible] = useState(false)
  const [data, setData] = useState<CompanyInfo | null>(null)
  const [loading, setLoading] = useState(true)

  // Загружаем данные из API
  const loadData = async () => {
    try {
      // Добавляем случайный параметр для избежания кеша
      const timestamp = Date.now()
      const res = await fetch(`/api/process-steps?t=${timestamp}`, { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      if (res.ok) {
        const companyData = await res.json()
        setData(companyData)
        console.log('[AboutCompany] Data refreshed:', companyData.title)
      } else {
        console.error('Failed to load company info')
      }
    } catch (error) {
      console.error('Error loading company info:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    
    // Слушаем события обновления от админки
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'company-info-updated') {
        console.log('[AboutCompany] Received update signal, refreshing data...')
        loadData()
      }
    }
    
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'COMPANY_INFO_UPDATED') {
        console.log('[AboutCompany] Received postMessage update, refreshing data...')
        loadData()
      }
    }
    
    // BroadcastChannel для обновления между вкладками
    const bc = new BroadcastChannel('company-updates')
    const handleBroadcast = (e: MessageEvent) => {
      if (e.data?.type === 'COMPANY_INFO_UPDATED') {
        console.log('[AboutCompany] Received broadcast update, refreshing data...')
        loadData()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('message', handleMessage)
    bc.addEventListener('message', handleBroadcast)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('message', handleMessage)
      bc.removeEventListener('message', handleBroadcast)
      bc.close()
    }
  }, [])

  // Intersection Observer для анимации
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    const element = document.getElementById('about-company')
    if (element) {
      observer.observe(element)
    }

    return () => observer.disconnect()
  }, [])

  // Показываем loader во время загрузки
  if (loading) {
    return (
      <section id="about-company" className="py-28 bg-gradient-to-b from-[#FAF7F2] via-[#F5F0E8] to-[#FAF7F2]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-96 mx-auto mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-64 mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Фолбэк если данные не загрузились
  if (!data) {
    return null
  }

  return (
    <section id="about-company" className="py-28 bg-gradient-to-b from-[#FAF7F2] via-[#F5F0E8] to-[#FAF7F2]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          {/* Заголовок */}
          <div className="text-center mb-20">
            <p className="text-sm uppercase tracking-[0.3em] text-[#5C3825] mb-4 font-medium">О нас</p>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1A1210] mb-6 font-lora tracking-tight">
              <span className="block">{data.title || 'Ваш надёжный партнёр'}</span>
            </h2>
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-[#1A0F0A]/30 to-transparent mx-auto mb-6"></div>
          </div>

          {/* Основной контент */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            {/* Левая колонка - текст */}
            <div className="space-y-6">
              {data.mainMission && (
                <p className="text-lg text-gray-700 leading-relaxed">
                  {data.mainMission}
                </p>
              )}
              {data.specialization && (
                <div className="text-lg text-gray-700 leading-relaxed space-y-4">
                  {data.specialization.split('\n\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Правая колонка - преимущества */}
            <div className="bg-white rounded-2xl shadow-[0_8px_40px_-12px_rgba(26,15,10,0.12)] p-8 md:p-10 border border-[#E8E2D9]">
              <h3 className="text-2xl font-bold text-[#1A1512] mb-6 font-lora">
                Почему выбирают нас?
              </h3>
              <div className="space-y-4">
                {data.advantages.map((item, index) => (
                  <div 
                    key={item.id}
                    className={`transition-all duration-500 ${
                      isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                    }`}
                    style={{ transitionDelay: `${(index + 1) * 100}ms` }}
                  >
                    <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Заключение */}
          {data.conclusion && (
            <div className="relative overflow-hidden text-center bg-gradient-to-br from-[#1A0F0A] via-[#2C1810] to-[#1A0F0A] rounded-2xl p-12 md:p-16 text-[#F5F0E8] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-white/20">
              <SparksEffect />
              <p className="relative text-xl md:text-2xl font-light leading-relaxed max-w-4xl mx-auto tracking-wide">
                {data.conclusion}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
