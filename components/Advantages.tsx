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
  const [configSubtitle, setConfigSubtitle] = useState('Почему клиенты выбирают именно нас для поставки труб и комплектующих')
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
    <section id="advantages" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {configTitle || 'Наши преимущества'}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {configSubtitle || 'Почему клиенты выбирают именно нас для поставки труб и комплектующих'}
          </p>
        </div>

        {/* Сетка преимуществ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {advantages.map((advantage, index) => (
            <div
              key={advantage.id}
              className={`group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-[#1E3A5F] ${
                isVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 70}ms` }}
              onMouseEnter={() => handleAdvantageView(advantage.id)}
            >
              {/* Заголовок */}
              <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-[#1E3A5F] transition-colors duration-300">
                {advantage.title}
              </h3>

              {/* Описание */}
              <p className="text-gray-600 leading-relaxed">
                {advantage.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
