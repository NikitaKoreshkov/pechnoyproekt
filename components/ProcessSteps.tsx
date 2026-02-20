'use client'

import { useState, useEffect } from 'react'

interface Advantage {
  id: number
  title: string
  description: string
}

export default function ProcessSteps() {
  const [isVisible, setIsVisible] = useState(false)
  const [title, setTitle] = useState('«АкваГазТех» ваш надежный партнер')
  const [mainMission, setMainMission] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [advantages, setAdvantages] = useState<Advantage[]>([])
  const [conclusion, setConclusion] = useState('')

  // Загружаем конфигурацию из БД
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/admin/process-steps', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setTitle(data.title || '«АкваГазТех» ваш надежный партнер')
          setMainMission(data.mainMission || '')
          setSpecialization(data.specialization || '')
          setAdvantages(data.advantages || [])
          setConclusion(data.conclusion || '')
        }
      } catch (error) {
        console.error('Error loading company info config:', error)
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

    const element = document.getElementById('process-steps')
    if (element) {
      observer.observe(element)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section id="process-steps" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className={`text-center mb-16 transition-all duration-500 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'
        }`}>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {title}
          </h2>
        </div>

        {/* Основная миссия */}
        {mainMission && (
          <div className={`max-w-4xl mx-auto mb-12 transition-all duration-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '100ms' }}>
            <p className="text-lg text-gray-700 leading-relaxed text-center">
              {mainMission}
            </p>
          </div>
        )}

        {/* Специализация */}
        {specialization && (
          <div className={`max-w-4xl mx-auto mb-16 transition-all duration-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '200ms' }}>
            <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-line">
              {specialization}
            </p>
          </div>
        )}

        {/* Преимущества */}
        {advantages.length > 0 && (
          <div className="mb-16">
            <h3 className={`text-3xl font-bold text-gray-900 mb-12 text-center transition-all duration-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'
            }`} style={{ transitionDelay: '300ms' }}>
              Почему труба ПНД — лидер современных коммуникаций?
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {advantages.map((advantage, index) => (
                <div
                  key={advantage.id}
                  className={`bg-gray-50 rounded-xl p-6 border border-gray-200 transition-all duration-500 ${
                    isVisible 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: `${400 + index * 100}ms` }}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-[#1E3A5F] text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                      {advantage.id}
                    </div>
                    <h4 className="text-xl font-semibold text-gray-900">
                      {advantage.title}
                    </h4>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    {advantage.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Заключение */}
        {conclusion && (
          <div className={`max-w-4xl mx-auto text-center transition-all duration-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: `${400 + advantages.length * 100}ms` }}>
            <p className="text-lg text-gray-700 leading-relaxed">
              {conclusion}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
