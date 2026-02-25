'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import SparksEffect from '@/components/SparksEffect'

interface Advantage {
  id: number | string
  title: string
  description: string
}

interface ProcessStepsData {
  title: string
  mainMission: string
  specialization: string
  advantages: Advantage[]
  conclusion: string
}

interface AdvantagesData {
  title: string
  subtitle: string
  items: Advantage[]
}

interface FooterConfig {
  phone?: string
  phone2?: string
  email?: string
  companyName?: string
}

export default function AboutPageContent() {
  const [isVisible, setIsVisible] = useState(false)
  const [processData, setProcessData] = useState<ProcessStepsData | null>(null)
  const [advantagesData, setAdvantagesData] = useState<AdvantagesData | null>(null)
  const [config, setConfig] = useState<FooterConfig>({
    phone: '+7 (952) 131-52-82',
    phone2: '+7 (982) 709-32-57',
    email: '89521315282@mail.ru',
    companyName: 'Печнойпроект',
  })

  useEffect(() => {
    const loadFooter = async () => {
      try {
        const res = await fetch('/api/admin/footer', { cache: 'no-store' })
        if (res.ok) {
          const d = await res.json()
          setConfig((c) => ({
            ...c,
            phone: d.phone || c.phone,
            phone2: d.phone2 || c.phone2,
            email: d.email || c.email,
            companyName: d.companyName || c.companyName,
          }))
        }
      } catch (_) {}
    }
    loadFooter()
  }, [])

  useEffect(() => {
    const loadProcessSteps = async () => {
      try {
        const res = await fetch('/api/process-steps', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setProcessData(data)
        }
      } catch (_) {}
    }
    loadProcessSteps()
  }, [])

  useEffect(() => {
    const loadAdvantages = async () => {
      try {
        const res = await fetch('/api/admin/advantages', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setAdvantagesData({ title: data.title, subtitle: data.subtitle, items: data.items || [] })
        }
      } catch (_) {}
    }
    loadAdvantages()
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setIsVisible(true), { threshold: 0.05 })
    obs.observe(document.getElementById('about-hero') || document.body)
    return () => obs.disconnect()
  }, [])

  const loading = !processData && !advantagesData

  if (loading) {
    return (
      <div className="pt-16 min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-[#5C3825]/60">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="pt-16">
      {/* Hero */}
      <section id="about-hero" className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A0F0A]/5 via-transparent to-[#2C1810]/5" />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 lg:px-12">
          <p className="text-[10px] uppercase tracking-[0.5em] text-[#5C3825]/80 mb-6 font-medium">
            {config.companyName}
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-light text-[#1A1210] font-lora leading-[1.1] tracking-tight max-w-4xl">
            {processData?.title || 'Ваш надёжный партнёр'}
          </h1>
          <div className="mt-12 w-24 h-px bg-gradient-to-r from-[#2C1810]/60 to-transparent" />
          <p className="mt-10 text-xl text-[#1A1210]/80 font-light max-w-2xl leading-relaxed">
            {processData?.mainMission ||
              'Основная миссия компании «Печнойпроект» — создавать печные комплексы и зоны огня, которые становятся центром вашего дома и участка на десятилетия.'}
          </p>
        </div>
      </section>

      {/* О компании + Почему выбирают нас */}
      <section className="py-20 lg:py-28 bg-white/50">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-start mb-16">
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-[#5C3825]/80 mb-8 font-medium">
                О компании
              </p>
              <div className="prose prose-lg max-w-none text-[#1A1210]/85 leading-[1.9] space-y-6">
                {processData?.specialization?.split('\n\n').map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                )) || (
                  <>
                    <p>
                      Мы специализируемся на проектировании и строительстве мангалов, печей, барбекю-зон и
                      полного спектра решений для открытого огня.
                    </p>
                    <p>
                      От компактного мангала на даче до многосекторного печного комплекса с разными вариантами
                      кладки — мы гарантируем авторский подход, безупречное исполнение и надёжность на десятилетия.
                    </p>
                  </>
                )}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-8 md:p-10 border border-[#E8E2D9] shadow-[0_8px_40px_-12px_rgba(26,15,10,0.12)]">
              <h3 className="text-2xl font-bold text-[#1A1512] mb-6 font-lora">Почему выбирают нас?</h3>
              <div className="space-y-4">
                {(processData?.advantages || []).map((item, i) => (
                  <div
                    key={item.id}
                    className={`transition-all duration-500 ${
                      isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                    }`}
                    style={{ transitionDelay: `${(i + 1) * 100}ms` }}
                  >
                    <h4 className="font-semibold text-[#1A1210] mb-1">{item.title}</h4>
                    <p className="text-sm text-[#1A1210]/75">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {processData?.conclusion && (
            <div className="relative overflow-hidden text-center bg-gradient-to-br from-[#1A0F0A] via-[#2C1810] to-[#1A0F0A] rounded-2xl p-12 md:p-16 text-[#F5F0E8] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-white/20">
              <SparksEffect />
              <p className="relative text-xl md:text-2xl font-light leading-relaxed max-w-4xl mx-auto tracking-wide">
                {processData.conclusion}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Почему мы / Наши преимущества */}
      <section className="py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-12">
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#5C3825]/80 mb-8 font-medium">
            Почему мы
          </p>
          <h2 className="text-3xl lg:text-4xl font-light text-[#1A1210] font-lora mb-4">
            {advantagesData?.title || 'Наши преимущества'}
          </h2>
          <p className="text-[#1A1210]/80 mb-16 max-w-2xl">
            {advantagesData?.subtitle || 'Почему клиенты выбирают именно нас'}
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(advantagesData?.items || []).map((item, i) => (
              <div
                key={item.id}
                className={`flex gap-4 transition-all duration-500 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${i * 70}ms` }}
              >
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-[#5C3825]/10 flex items-center justify-center text-[#5C3825] font-semibold text-sm">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-[#1A1210] mb-2">{item.title}</h3>
                  <p className="text-[#1A1210]/75 text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-24 lg:py-32 bg-gradient-to-br from-[#1A0F0A] via-[#2C1810] to-[#1A0F0A] text-white">
        <SparksEffect />
        <div className="relative max-w-4xl mx-auto px-5 sm:px-8 lg:px-12 text-center">
          <h2 className="text-3xl lg:text-4xl font-light font-lora mb-8">Есть вопросы? Звоните!</h2>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <a
              href={`tel:${config.phone?.replace(/\D/g, '')}`}
              className="text-2xl font-light hover:text-[#E8D5A3] transition-colors"
            >
              {config.phone}
            </a>
            {config.phone2 && (
              <a
                href={`tel:${config.phone2.replace(/\D/g, '')}`}
                className="text-2xl font-light hover:text-[#E8D5A3] transition-colors"
              >
                {config.phone2}
              </a>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-10 justify-center items-center">
            <Link
              href="/#calculator"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-white/40 hover:bg-white/10 transition-all font-medium tracking-widest text-sm uppercase"
            >
              Калькулятор барбекю
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-callback-modal'))}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white/15 hover:bg-white/25 transition-all font-medium tracking-widest text-sm uppercase"
            >
              Перезвоните мне
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
