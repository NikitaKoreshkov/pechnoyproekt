'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import SparksEffect from '@/components/SparksEffect'

interface CalcOption {
  id: string
  name: string
  price: number
  image: string
  sortOrder: number
}

interface CalcData {
  standard: { main: CalcOption[]; extra: CalcOption[] }
  vip: { main: CalcOption[]; extra: CalcOption[] }
}

const EXTRA_TYPES = ['Кирпичный тандыр', 'Тандыр', 'Русская печь', 'Арийская печь', 'Коптильня', 'Казан', 'Стол', 'Мойка'] as const

function groupExtraByType(options: CalcOption[]): Map<string, { colorLabel: string; option: CalcOption }[]> {
  const map = new Map<string, { colorLabel: string; option: CalcOption }[]>()
  for (const opt of options) {
    let type = ''
    for (const t of EXTRA_TYPES) {
      if (opt.name.startsWith(t + ' ')) {
        type = t
        break
      }
    }
    if (!type) continue
    const colorLabel = opt.name.slice(type.length + 1).trim()
    if (!map.has(type)) map.set(type, [])
    map.get(type)!.push({ colorLabel, option: opt })
  }
  return map
}

const STORAGE_KEY = 'proektmangal_calc_barbecue'

export default function Calculator() {
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<CalcData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)

  // Form state
  const [mainId, setMainId] = useState<string>('')
  const [variant, setVariant] = useState<'standard' | 'vip'>('standard')
  const [sectionCount, setSectionCount] = useState(1)
  const [sectionChoices, setSectionChoices] = useState<Record<number, string>>({})
  const [sectionSubStep, setSectionSubStep] = useState<Record<number, 'type' | 'color'>>({})
  const [sectionTypeChoice, setSectionTypeChoice] = useState<Record<number, string>>({})
  const [expandedSectionMobile, setExpandedSectionMobile] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const h = () => setIsMobile(mq.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])

  useEffect(() => {
    fetch('/api/calculator/barbecue', { cache: 'no-store' })
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.mainId) setMainId(parsed.mainId)
        if (parsed.variant) setVariant(parsed.variant)
        if (parsed.sectionCount) setSectionCount(Math.min(6, Math.max(1, parsed.sectionCount)))
        if (parsed.sectionChoices) setSectionChoices(parsed.sectionChoices)
        if (parsed.sectionSubStep) setSectionSubStep(parsed.sectionSubStep)
        if (parsed.sectionTypeChoice) setSectionTypeChoice(parsed.sectionTypeChoice)
        if (parsed.currentStep) setCurrentStep(parsed.currentStep)
      } catch (_) {}
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !data) return
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        mainId,
        variant,
        sectionCount,
        sectionChoices,
        sectionSubStep,
        sectionTypeChoice,
        currentStep,
      })
    )
  }, [mainId, variant, sectionCount, sectionChoices, sectionSubStep, sectionTypeChoice, currentStep, data])

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => e.isIntersecting && setIsVisible(true),
      { threshold: 0.1 }
    )
    const el = document.getElementById('calculator')
    if (el) obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const mainOptions = data?.[variant]?.main ?? []
  const extraOptions = data?.[variant]?.extra ?? []
  const effectiveMainId = mainId || mainOptions[0]?.id || ''
  const selectedMain = mainOptions.find((o) => o.id === effectiveMainId) ?? mainOptions[0]
  const totalPrice = (() => {
    if (!data) return 0
    let sum = selectedMain?.price ?? 0
    for (let i = 1; i <= sectionCount; i++) {
      const sid = sectionChoices[i]
      const opt = extraOptions.find((o) => o.id === sid)
      if (opt) sum += opt.price
    }
    return sum
  })()

  const handleSectionChoice = (sectionNum: number, optionId: string) => {
    setSectionChoices((prev) => ({ ...prev, [sectionNum]: optionId }))
  }

  const handleSectionTypeSelect = (sectionNum: number, type: string) => {
    const prevType = sectionTypeChoice[sectionNum]
    if (prevType !== type) {
      setSectionChoices((c) => {
        const next = { ...c }
        delete next[sectionNum]
        return next
      })
    }
    setSectionTypeChoice((prev) => ({ ...prev, [sectionNum]: type }))
    setSectionSubStep((prev) => ({ ...prev, [sectionNum]: 'color' }))
  }

  const handleSectionColorSelect = (sectionNum: number, optionId: string) => {
    setSectionChoices((prev) => ({ ...prev, [sectionNum]: optionId }))
  }

  const handleSectionEdit = (sectionNum: number) => {
    setSectionSubStep((prev) => ({ ...prev, [sectionNum]: 'type' }))
    setSectionTypeChoice((prev) => {
      const next = { ...prev }
      delete next[sectionNum]
      return next
    })
    setSectionChoices((prev) => {
      const next = { ...prev }
      delete next[sectionNum]
      return next
    })
  }

  const extraByType = useMemo(
    () => (extraOptions.length ? groupExtraByType(extraOptions) : new Map()),
    [extraOptions]
  )

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep((s) => s + 1)
  }
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1)
      setTimeout(() => {
        document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
    }
  }

  const formatPrice = (n: number) => new Intl.NumberFormat('ru-RU').format(n) + ' ₽'

  const handleGetCalculation = () => {
    const mainName = selectedMain?.name ?? ''
    const sections: string[] = []
    for (let i = 1; i <= sectionCount; i++) {
      const opt = extraOptions.find((o) => o.id === sectionChoices[i])
      sections.push(opt?.name ?? '—')
    }
    const msg = `🔥 ЗАПРОС РАСЧЁТА БАРБЕКЮ

Мангал: ${mainName}
Вариант: ${variant === 'vip' ? 'ВИП' : 'Стандарт'}

Секции:
${sections.map((s, i) => `Секция ${i + 1}: ${s}`).join('\n')}

💰 Предварительно: ${formatPrice(totalPrice)}

Прошу связаться для точного расчёта!`

    const maxUrl = 'https://max.ru/u/f9LHodD0cOIpDPuCcMZgHcMs8Q34keKCS0fVwDTH9yLudQ6BH_47EGRwPTE'
    window.open(`${maxUrl}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  if (loading || !data) {
    return (
      <section id="calculator" className="py-24 bg-[#1A0F0A] scroll-mt-20 relative overflow-hidden">
        <SparksEffect />
        <div className="relative max-w-4xl mx-auto px-4 text-center py-16">
          <div className="inline-block w-12 h-12 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      </section>
    )
  }

  const canNext =
    (currentStep === 1 && (mainId || mainOptions[0]?.id)) ||
    (currentStep === 2 && variant) ||
    (currentStep === 3 && sectionCount >= 1) ||
    currentStep === 4

  return (
    <section id="calculator" className="py-24 bg-[#1A0F0A] scroll-mt-20 relative overflow-hidden">
      <SparksEffect />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(201,169,98,0.06)_0%,_transparent_50%)] pointer-events-none" />
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.3em] text-white/90 mb-4 font-medium">Инструмент</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-lora tracking-tight">
            Калькулятор барбекю
          </h2>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent mx-auto mb-6" />
          <p className="text-lg text-[#EDE8E0]/80">
            Соберите свой комплект — мангал и секции
          </p>
        </div>

        <div
          className={`transition-all duration-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.2)] p-8 md:p-10 border border-white/20">
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-white/90">Шаг {currentStep} из 4</span>
                <span className="text-sm font-medium text-white/90">{Math.round((currentStep / 4) * 100)}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="h-1.5 rounded-full transition-all duration-300 bg-white"
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                />
              </div>
            </div>

            {/* Шаг 1: Выбор мангала (основное) — на мобиле без фото, один ряд текстом */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white mb-6">
                  Выберите мангал
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {mainOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setMainId(opt.id)}
                      className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                        (mainId || effectiveMainId) === opt.id
                          ? 'border-white bg-white/20 ring-2 ring-white/50 ring-inset'
                          : 'border-white/30 bg-white/5 hover:bg-white/10 hover:border-white/50'
                      }`}
                    >
                      {opt.image && (
                        <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-white/20 mb-3 hidden sm:block">
                          <Image
                            src={opt.image}
                            alt={opt.name}
                            fill
                            className="object-cover"
                            sizes="(max-width:640px) 100vw, 33vw"
                            unoptimized
                          />
                        </div>
                      )}
                      <p className={`font-semibold ${(mainId || effectiveMainId) === opt.id ? 'text-white' : 'text-white/90'}`}>{opt.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Шаг 2: ВИП или Стандарт */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white mb-6">
                  Вариант комплектации
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-md mx-auto">
                  <button
                    type="button"
                    onClick={() => setVariant('standard')}
                    className={`relative flex flex-col items-center justify-center py-5 sm:py-8 px-4 sm:px-6 rounded-xl border-2 transition-all ${
                      variant === 'standard'
                        ? 'border-white bg-white/20 text-white ring-2 ring-white/50 ring-inset'
                        : 'border-white/30 bg-white/5 text-white/80 hover:bg-white/10 hover:border-white/50'
                    }`}
                  >
                    <span className="text-xl font-bold">Стандарт</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVariant('vip')}
                    className={`relative flex flex-col items-center justify-center py-5 sm:py-8 px-4 sm:px-6 rounded-xl border-2 transition-all ${
                      variant === 'vip'
                        ? 'border-white bg-white/20 text-white ring-2 ring-white/50 ring-inset'
                        : 'border-white/30 bg-white/5 text-white/80 hover:bg-white/10 hover:border-white/50'
                    }`}
                  >
                    <span className="text-xl font-bold">ВИП</span>
                  </button>
                </div>
              </div>
            )}

            {/* Шаг 3: Количество секций (1–6) */}
            {currentStep === 3 && (
              <div className="space-y-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Количество секций
                  </h3>
                  <p className="text-white/80 text-sm max-w-md mx-auto">
                    Русская печь, Коптильня, Казан, Тандыр — соберите комплект под свои задачи
                  </p>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setSectionCount(n)}
                      className={`relative flex flex-col items-center justify-center py-6 px-4 rounded-xl border-2 transition-all ${
                        sectionCount === n
                          ? 'border-white bg-white/20 text-white ring-2 ring-white/50 ring-inset'
                          : 'border-white/30 bg-white/5 text-white/80 hover:bg-white/10 hover:border-white/50'
                      }`}
                    >
                      <span className="text-3xl font-bold tabular-nums mb-0.5">{n}</span>
                      <span className="text-xs font-medium opacity-80">{n === 1 ? 'секция' : n < 5 ? 'секции' : 'секций'}</span>
                    </button>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 text-center">
                  <span className="text-white/60 text-xs sm:text-sm">Комплект из</span>
                  <span className="text-lg sm:text-xl font-bold text-white">{sectionCount} секц.</span>
                  <span className="text-white/60 text-xs sm:text-sm">— оптимально для вашего участка</span>
                </div>
              </div>
            )}

            {/* Шаг 4: Выбор секций — секции 1–6: Русская печь, Арийская, Коптильня и т.д. */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white mb-6">
                  Выбор секций
                </h3>

                {[1, 2, 3, 4, 5, 6]
                  .filter((n) => n <= sectionCount)
                  .map((num) => {
                    const selectedId = sectionChoices[num]
                    const selectedOpt = extraOptions.find((o) => o.id === selectedId)
                    const derivedType = selectedOpt
                      ? EXTRA_TYPES.find((t) => selectedOpt.name.startsWith(t + ' '))
                      : null
                    const typeChoice = sectionTypeChoice[num] ?? derivedType ?? ''
                    const subStep =
                      sectionSubStep[num] ?? (selectedOpt && derivedType ? 'color' : 'type')
                    const types = Array.from(extraByType.keys())
                    const colors = typeChoice ? extraByType.get(typeChoice) ?? [] : []
                    const isExpanded = !isMobile || expandedSectionMobile === num

                    return (
                      <div
                        key={num}
                        className="rounded-xl border-2 border-white/30 bg-white/5 overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => isMobile && setExpandedSectionMobile((p) => (p === num ? null : num))}
                          className="w-full p-4 sm:p-5 flex items-center justify-between text-left"
                        >
                          <label className="font-semibold text-white">
                            Секция {num}
                            {selectedOpt && (
                              <span className="ml-2 font-normal text-white/80 text-sm sm:text-base truncate max-w-[180px] sm:max-w-none inline-block align-bottom">
                                — {selectedOpt.name}
                              </span>
                            )}
                          </label>
                          {isMobile && (
                            <svg className={`w-5 h-5 text-white/80 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </button>

                        {isExpanded && (
                          <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-3 border-t border-white/20">
                            <div className="flex items-center justify-between pt-3">
                              {selectedOpt && (
                                <button
                                  type="button"
                                  onClick={() => handleSectionEdit(num)}
                                  className="text-xs sm:text-sm text-white/80 hover:text-white transition-colors"
                                >
                                  Изменить
                                </button>
                              )}
                              <span className="ml-auto" />
                            </div>

                            <div
                              className={`w-full overflow-hidden rounded-xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                                subStep === 'color' ? 'min-h-[260px] sm:min-h-[300px]' : 'min-h-[180px] sm:min-h-[220px]'
                              }`}
                            >
                              <div className="relative w-full">
                                {/* Выбор типа */}
                                <div
                                  className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 min-h-[160px] sm:min-h-[200px] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                                    subStep === 'color'
                                      ? 'absolute inset-0 -translate-x-full opacity-0 pointer-events-none'
                                      : ''
                                  }`}
                                >
                                  {types.map((t) => (
                                    <button
                                      key={t}
                                      type="button"
                                      onClick={() => handleSectionTypeSelect(num, t)}
                                      className={`min-h-[70px] sm:min-h-[88px] flex items-center justify-center rounded-xl border-2 px-3 sm:px-4 py-3 sm:py-4 text-center text-xs sm:text-base font-medium transition-all ${
                                        typeChoice === t
                                          ? 'border-white bg-white/20 text-white ring-2 ring-white/50 ring-inset'
                                          : 'border-white/30 bg-white/5 text-white/90 hover:bg-white/10 hover:border-white/50'
                                      }`}
                                    >
                                      <span className="line-clamp-2">{t}</span>
                                    </button>
                                  ))}
                                </div>

                                {/* Выбор цвета */}
                                <div
                                  className={`flex flex-col min-h-[240px] sm:min-h-[280px] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                                    subStep === 'color'
                                      ? ''
                                      : 'absolute inset-0 translate-x-full opacity-0 pointer-events-none'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                    <button
                                      type="button"
                                      onClick={() => setSectionSubStep((p) => ({ ...p, [num]: 'type' }))}
                                      className="group flex items-center gap-1.5 text-xs sm:text-base text-white/80 hover:text-white font-medium transition-colors"
                                    >
                                      <span className="transition-transform group-hover:-translate-x-0.5">←</span>
                                      К типу
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 min-h-[180px] sm:min-h-[220px]">
                                    {colors.map(({ colorLabel, option }) => (
                                      <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => handleSectionColorSelect(num, option.id)}
                                        className={`min-h-[70px] sm:min-h-[88px] flex items-center justify-center rounded-xl border-2 px-3 sm:px-4 py-3 sm:py-4 text-center text-xs sm:text-sm font-medium transition-all ${
                                          selectedId === option.id
                                            ? 'border-white bg-white/20 text-white ring-2 ring-white/50 ring-inset'
                                            : 'border-white/30 bg-white/5 text-white/90 hover:bg-white/10 hover:border-white/50'
                                        }`}
                                      >
                                        <span className="line-clamp-2">{colorLabel}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            )}

            {/* Превью комплектации — мангал по центру, секции по бокам (скрыто на телефонах) */}
            {currentStep === 4 && (
              <div className="mt-8 hidden md:block">
                <p className="text-sm font-medium text-white/90 mb-4">Ваша комплектация</p>
                <div className="flex flex-wrap justify-center items-stretch gap-2 sm:gap-3">
                  {(() => {
                    const leftCount = Math.ceil(sectionCount / 2)
                    const rightCount = sectionCount - leftCount
                    const leftSections = Array.from({ length: leftCount }, (_, i) => i + 1)
                    const rightSections = Array.from({ length: rightCount }, (_, i) => leftCount + i + 1)
                    return (
                      <div className="flex flex-nowrap justify-center items-end gap-0 -space-x-2 w-full overflow-x-auto pb-2">
                        {leftSections.map((num) => {
                          const opt = extraOptions.find((o) => o.id === sectionChoices[num])
                          const isCompact = opt?.name && ['Казан', 'Стол'].some((t) => opt.name.startsWith(t))
                          const isBrickTandoorOrSink = opt?.name && ['Кирпичный тандыр', 'Мойка'].some((t) => opt.name.startsWith(t))
                          const isTandoor = opt?.name?.startsWith('Тандыр')
                          const isRussianOrAryanStove = opt?.name && ['Русская печь', 'Арийская печь', 'Коптильня'].some((t) => opt.name.startsWith(t))
                          const imgClass = isCompact ? 'h-[65px]' : isBrickTandoorOrSink ? 'h-[82px]' : isTandoor ? 'h-[240px]' : isRussianOrAryanStove ? 'h-[175px]' : 'max-h-[200px]'
                          const imgStyle = isRussianOrAryanStove ? { height: '175px' } : undefined
                          return (
                            <div key={`l-${num}`} className="flex-shrink-0">
                              {opt?.image ? (
                                <img
                                  src={opt.image}
                                  alt={opt?.name ?? ''}
                                  className={`block w-auto object-contain ${imgClass}`}
                                  style={imgStyle}
                                />
                              ) : (
                                <div className="w-24 h-24 flex items-center justify-center text-xs text-gray-400 bg-[#EDE8E0]">
                                  {opt?.name ?? '—'}
                                </div>
                              )}
                            </div>
                          )
                        })}
                        <div className="flex-shrink-0">
                          {selectedMain?.image ? (
                                <img
                                  src={selectedMain.image}
                                  alt={selectedMain?.name ?? ''}
                                  className="block w-auto max-h-[240px] object-contain"
                                />
                          ) : (
                            <div className="w-32 h-32 flex items-center justify-center text-sm text-gray-400 bg-[#EDE8E0]">
                              {selectedMain?.name ?? 'Мангал'}
                            </div>
                          )}
                        </div>
                        {rightSections.map((num) => {
                          const opt = extraOptions.find((o) => o.id === sectionChoices[num])
                          const isCompact = opt?.name && ['Казан', 'Стол'].some((t) => opt.name.startsWith(t))
                          const isBrickTandoorOrSink = opt?.name && ['Кирпичный тандыр', 'Мойка'].some((t) => opt.name.startsWith(t))
                          const isTandoor = opt?.name?.startsWith('Тандыр')
                          const isRussianOrAryanStove = opt?.name && ['Русская печь', 'Арийская печь', 'Коптильня'].some((t) => opt.name.startsWith(t))
                          const imgClass = isCompact ? 'h-[65px]' : isBrickTandoorOrSink ? 'h-[82px]' : isTandoor ? 'h-[240px]' : isRussianOrAryanStove ? 'h-[175px]' : 'max-h-[200px]'
                          const imgStyle = isRussianOrAryanStove ? { height: '175px' } : undefined
                          return (
                            <div key={`r-${num}`} className="flex-shrink-0">
                              {opt?.image ? (
                                <img
                                  src={opt.image}
                                  alt={opt?.name ?? ''}
                                  className={`block w-auto object-contain ${imgClass}`}
                                  style={imgStyle}
                                />
                              ) : (
                                <div className="w-24 h-24 flex items-center justify-center text-xs text-gray-400 bg-[#EDE8E0]">
                                  {opt?.name ?? '—'}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}

            {/* Результат на шаге 4 */}
            {currentStep === 4 && (
              <div className="mt-6 p-6 rounded-xl bg-white/10 border border-white/30">
                <p className="text-sm uppercase tracking-wider text-white/90 mb-1">
                  Предварительная стоимость
                </p>
                <p className="text-3xl font-bold text-white mb-6">{formatPrice(totalPrice)}</p>
                <button
                  type="button"
                  onClick={handleGetCalculation}
                  className="w-full py-4 bg-white text-[#1A0F0A] font-semibold rounded-xl hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="sm:hidden">Точный расчёт</span>
                  <span className="hidden sm:inline">Получить точный расчёт</span>
                </button>
              </div>
            )}

            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-6 py-2 rounded-xl bg-white/20 hover:bg-white/30 border border-white/40 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors"
              >
                Назад
              </button>
              {currentStep < 4 && (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canNext}
                  className="px-6 py-2 rounded-xl bg-white text-[#1A0F0A] font-semibold hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Далее
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
