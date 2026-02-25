'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface KladkaProject {
  slug: string
  name: string
  description: string
  image: string
  index: number
}

export default function PortfolioKladka() {
  const [projects, setProjects] = useState<KladkaProject[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/portfolio/kladka')
      .then((r) => r.json())
      .then((data) => {
        setProjects(data.projects || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => e.isIntersecting && setIsVisible(true),
      { threshold: 0.1 }
    )
    const el = document.getElementById('portfolio-kladka')
    if (el) obs.observe(el)
    return () => obs.disconnect()
  }, [])

  if (loading) {
    return (
      <section id="portfolio-kladka" className="py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-24">
            <div className="animate-spin rounded-full h-14 w-14 border-2 border-[#5C3825]/30 border-t-[#5C3825] mx-auto" />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="portfolio-kladka" className="py-28 relative">
      {/* Декоративная линия */}
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-[#1A0F0A]/15 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-24">
          <p className="text-[11px] uppercase tracking-[0.4em] text-[#5C3825] mb-5 font-medium">
            Галерея
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1A1210] mb-8 font-lora tracking-tight">
            Готовые объекты
          </h2>
          <div className="w-28 h-px bg-gradient-to-r from-transparent via-[#2C1810]/50 to-transparent mx-auto mb-8" />
          <p className="text-lg md:text-xl text-[#5C3825]/85 max-w-2xl mx-auto leading-relaxed font-light">
            Ручная кладка кирпича по чертежам — от эскиза до сдачи заказчику
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {projects.map((project, index) => (
            <Link
              key={project.slug}
              href={`/portfolio/kladka/${project.slug}`}
              className={`block group transition-all duration-700 ease-out ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              <article className="relative h-full rounded-2xl overflow-hidden bg-white border border-[#E8E2D9]/80 hover:border-[#5C3825]/30 transition-all duration-500 shadow-[0_4px_24px_-4px_rgba(26,15,10,0.06)] hover:shadow-[0_24px_60px_-12px_rgba(26,15,10,0.18)]">
                {/* Карточка изображения с overlay */}
                <div className="aspect-[4/3] relative overflow-hidden bg-[#F5F0E8]">
                  {project.image ? (
                    <Image
                      src={project.image}
                      alt={project.name}
                      fill
                      className="object-cover transition-all duration-700 group-hover:scale-[1.08]"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[#5C3825]/30 font-lora text-xl">
                      {project.name}
                    </div>
                  )}
                  {/* Градиентный overlay при hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A0F0A]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  {/* Номер проекта */}
                  <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center text-sm font-bold text-[#1A1210] shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  {/* Стрелка */}
                  <div className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-[#2C1810] flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
                <div className="p-6 md:p-7">
                  <h3 className="text-xl font-bold text-[#1A1210] font-lora mb-3 group-hover:text-[#5C3825] transition-colors duration-300">
                    {project.name}
                  </h3>
                  <p className="text-[#5C3825]/75 text-[15px] leading-[1.65] line-clamp-3 font-light">
                    {project.description}
                  </p>
                  <span className="inline-flex items-center mt-5 text-sm font-medium text-[#1A0F0A] tracking-[0.05em] group-hover:text-[#2C1810] transition-colors">
                    Подробнее о проекте
                    <svg className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
