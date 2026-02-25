'use client'

import { useState, useEffect } from 'react'

interface Advantage {
  id: string
  title: string
  description: string
}


export default function Advantages() {
  const [isVisible, setIsVisible] = useState(false)
  const [configTitle, setConfigTitle] = useState('Наши преимущества')
  const [configSubtitle, setConfigSubtitle] = useState('Почему клиенты выбирают именно нас')
  const [advantages, setAdvantages] = useState<Advantage[]>([])

  // Загружаем конфигурацию из БД
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/admin/advantages', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setConfigTitle(data.title)
          setConfigSubtitle(data.subtitle)
          setAdvantages(data.items || [])
        }
      } catch (error) {
        console.error('Error loading advantages config:', error)
      }
    }
    loadConfig()
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

    const element = document.getElementById('advantages')
    if (element) {
      observer.observe(element)
    }

    return () => observer.disconnect()
  }, [])

  const handleAdvantageView = (advantageId: string) => {
    // Аналитика: advantage_viewed
    console.log('Advantage viewed:', advantageId)
  }

  return (
    <section id="advantages" className="py-24 bg-gradient-to-b from-[#EDE8E0] via-[#F5F0E8] to-[#EDE8E0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className="text-center mb-20">
          <p className="text-sm uppercase tracking-[0.3em] text-[#5C3825] mb-4 font-medium">Почему мы</p>
          <h2 className="text-4xl md:text-5xl font-bold text-[#1A1210] mb-6 font-lora tracking-tight">
            {configTitle || 'Наши преимущества'}
          </h2>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-[#1A0F0A]/30 to-transparent mx-auto mb-6"></div>
          <p className="text-lg text-[#5C3825]/90 max-w-2xl mx-auto leading-relaxed">
            {configSubtitle || 'Почему клиенты выбирают именно нас'}
          </p>
        </div>

        {/* Сетка преимуществ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {advantages.map((advantage, index) => (
            <div
              key={advantage.id}
              className={`group bg-white rounded-2xl p-8 md:p-10 shadow-[0_4px_24px_-4px_rgba(26,15,10,0.08)] hover:shadow-[0_20px_40px_-12px_rgba(26,15,10,0.12)] transition-all duration-300 hover:-translate-y-1 border border-[#E8E2D9] hover:border-white/50 ${
                isVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 70}ms` }}
              onMouseEnter={() => handleAdvantageView(advantage.id)}
            >
              {/* Заголовок */}
              <h3 className="text-xl font-bold text-[#1A1210] mb-4 group-hover:text-[#5C3825] transition-colors duration-300 font-lora">
                {advantage.title}
              </h3>

              {/* Описание */}
              <p className="text-[#5C3825]/85 leading-relaxed">
                {advantage.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
