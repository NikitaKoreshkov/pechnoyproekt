'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface TypeProject {
  slug: string
  name: string
  description: string
  image: string
  index: number
}

export default function PortfolioTypes() {
  const [projects, setProjects] = useState<TypeProject[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/portfolio/types')
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
    const el = document.getElementById('portfolio-types')
    if (el) obs.observe(el)
    return () => obs.disconnect()
  }, [])

  if (loading) {
    return (
      <section id="portfolio-types" className="py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5C3825] mx-auto" />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="portfolio-types" className="py-28 relative">
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-[#1A0F0A]/10 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-24">
          <p className="text-[11px] uppercase tracking-[0.4em] text-[#5C3825] mb-5 font-medium">Архитектура решений</p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1A1210] mb-8 font-lora tracking-tight">
            Типы печей
          </h2>
          <div className="w-28 h-px bg-gradient-to-r from-transparent via-[#2C1810]/50 to-transparent mx-auto mb-8" />
          <p className="text-lg md:text-xl text-[#5C3825]/85 max-w-2xl mx-auto leading-relaxed font-light">
            Классификация печных сооружений — от русских печей до каминопечей
          </p>
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 ${projects.length % 3 === 1 ? 'lg:[&>a:last-child]:col-start-2' : ''}`}>
          {projects.map((project, index) => (
            <Link
              key={project.slug}
              href={`/portfolio/types/${project.slug}`}
              className={`block transition-all duration-700 ease-out ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              <article className="group h-full rounded-2xl overflow-hidden bg-white border border-[#E8E2D9]/80 hover:border-[#5C3825]/25 transition-all duration-500 shadow-[0_4px_24px_-4px_rgba(26,15,10,0.06)] hover:shadow-[0_20px_50px_-12px_rgba(26,15,10,0.15)]">
                <div className="p-8 md:p-10 relative">
                  <div className="absolute left-0 top-8 bottom-8 w-0.5 bg-gradient-to-b from-transparent via-[#2C1810]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <h3 className="text-xl font-bold text-[#1A1210] font-lora mb-3 group-hover:text-[#5C3825] transition-colors duration-300 tracking-tight">
                    {project.name}
                  </h3>
                  <p className="text-[#5C3825]/75 text-[15px] leading-[1.7] line-clamp-3 font-light">
                    {project.description}
                  </p>
                  <span className="inline-flex items-center mt-6 text-sm font-medium text-[#1A0F0A]/90 tracking-[0.05em] group-hover:text-[#2C1810] transition-colors duration-300">
                    Подробнее о типах
                    <svg className="ml-3 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
