'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createPortal } from 'react-dom'
import SparksEffect from '@/components/SparksEffect'

export interface CatalogSubsubsection {
  id: string
  title: string
  slug: string
  order: number
}

export interface CatalogSubsection {
  id: string
  title: string
  slug: string
  order: number
  subsubsections?: CatalogSubsubsection[]
}

export interface CatalogSectionWithSubsections {
  id: string
  title: string
  slug: string
  order: number
  subsections: CatalogSubsection[]
}

interface CatalogOverlayProps {
  isOpen: boolean
  onClose: () => void
}

const ANIMATION_DURATION = 450
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'
const HOVER_TRANSITION = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'

export default function CatalogOverlay({ isOpen, onClose }: CatalogOverlayProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [sections, setSections] = useState<CatalogSectionWithSubsections[]>([])
  const [loading, setLoading] = useState(false)
  const [hoveredSection, setHoveredSection] = useState<CatalogSectionWithSubsections | null>(null)
  const [displaySection, setDisplaySection] = useState<CatalogSectionWithSubsections | null>(null)
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (hoveredSection) {
      if (contentFadeRef.current) clearTimeout(contentFadeRef.current)
      setDisplaySection(hoveredSection)
    }
    return () => {
      if (contentFadeRef.current) clearTimeout(contentFadeRef.current)
    }
  }, [hoveredSection])

  useEffect(() => {
    if (isOpen && !isExiting) {
      const t = requestAnimationFrame(() => setMounted(true))
      return () => cancelAnimationFrame(t)
    }
  }, [isOpen, isExiting])

  useEffect(() => {
    if (!isOpen) {
      setMounted(false)
      setIsExiting(false)
      setHoveredSection(null)
      setExpandedSectionId(null)
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current)
        exitTimerRef.current = null
      }
    }
  }, [isOpen])

  const handleClose = useCallback(() => {
    if (isExiting) return
    setIsExiting(true)
    setMounted(false)
    exitTimerRef.current = setTimeout(() => {
      onClose()
      setIsExiting(false)
      exitTimerRef.current = null
    }, ANIMATION_DURATION)
  }, [onClose, isExiting])

  useEffect(() => () => {
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    fetch('/api/catalog/tree', { cache: 'no-store' })
      .then((res) => res.ok ? res.json() : [])
      .then((data: CatalogSectionWithSubsections[]) => {
        setSections(data)
        const first = data[0] ?? null
        setDisplaySection(first)
        setHoveredSection(null)
      })
      .catch(() => setSections([]))
      .finally(() => setLoading(false))
  }, [isOpen])

  const handleSubsectionClick = useCallback(
    (subsectionId: string) => {
      router.push(`/catalog?subsectionId=${encodeURIComponent(subsectionId)}`)
      onClose()
    },
    [router, onClose]
  )

  const handleSubsubsectionClick = useCallback(
    (subsubsectionId: string) => {
      router.push(`/catalog?subsubsectionId=${encodeURIComponent(subsubsectionId)}`)
      onClose()
    },
    [router, onClose]
  )

  const handleAllProductsClick = useCallback(
    (sectionId: string) => {
      router.push(`/catalog?sectionId=${encodeURIComponent(sectionId)}`)
      onClose()
    },
    [router, onClose]
  )

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleEscape)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, handleClose])

  if (!isOpen) return null

  const show = mounted && !isExiting
  const activeSection = displaySection ?? sections[0] ?? null

  const overlay = (
    <div
      className="fixed inset-0 z-[9999] flex flex-col w-screen min-h-screen overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(92,56,37,0.15) 0%, transparent 50%), linear-gradient(180deg, #0D0805 0%, #140B08 40%, #1A0F0A 100%)',
        opacity: show ? 1 : 0,
        transition: `opacity ${ANIMATION_DURATION}ms ${EASE}`,
      }}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Каталог"
    >
      <div className="absolute inset-0 backdrop-blur-2xl" aria-hidden />
      <SparksEffect />

      <div
        className="relative z-10 flex flex-col flex-1 w-full min-h-full overflow-hidden"
        style={{
          transform: show ? 'scale(1) translateY(0)' : 'scale(0.98) translateY(8px)',
          opacity: show ? 1 : 0,
          transition: `transform ${ANIMATION_DURATION}ms ${EASE}, opacity ${ANIMATION_DURATION}ms ${EASE}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Панель каталога — премиальное стекло, прижата к верху */}
        <div
          className="relative flex flex-1 min-h-0 mx-4 sm:mx-6 lg:mx-8 mt-0 mb-4 sm:mb-6 lg:mb-8 rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
            border: '1px solid rgba(212,175,55,0.25)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset, 0 0 60px -20px rgba(212,175,55,0.08)',
          }}
        >
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
            aria-label="Закрыть"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex flex-1 min-h-0 overflow-hidden flex-col md:flex-row">
            {/* Мобильный аккордеон — все разделы друг под другом, по нажатию открываются подразделы */}
            <div className="md:hidden flex-1 min-h-0 overflow-y-auto p-4">
              <h2 className="text-lg font-medium tracking-[0.12em] uppercase text-white/95 font-lora mb-4">
                Каталог
              </h2>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {sections.map((section) => {
                    const isExpanded = expandedSectionId === section.id
                    const visibleSubsections = section.subsections.filter((sub) => sub.title !== 'Проекты')
                    return (
                      <div key={section.id} className="rounded-xl border border-white/[0.08] overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpandedSectionId((id) => (id === section.id ? null : section.id))}
                          className="w-full flex items-center justify-between px-5 py-4 text-left bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                        >
                          <span className="font-medium text-white/95 text-[0.9375rem]">{section.title}</span>
                          <svg
                            className={`w-5 h-5 text-white/60 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {isExpanded && (
                          <div className="border-t border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
                            <button
                              type="button"
                              onClick={() => handleAllProductsClick(section.id)}
                              className="w-full flex items-center justify-between py-3 px-4 rounded-lg text-white/90 text-sm font-medium hover:bg-white/[0.06] transition-colors"
                            >
                              Все товары раздела
                              <svg className="w-4 h-4 text-amber-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                            {visibleSubsections.map((sub) => {
                              const hasSubsubsections = (sub.subsubsections || []).length > 0
                              return (
                                <div key={sub.id} className="space-y-1">
                                  <button
                                    type="button"
                                    onClick={() => handleSubsectionClick(sub.id)}
                                    className="w-full flex items-center justify-between py-3 px-4 rounded-lg text-white/80 text-sm hover:bg-white/[0.06] transition-colors"
                                  >
                                    {sub.title}
                                    <svg className="w-4 h-4 text-amber-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </button>
                                  {hasSubsubsections && (
                                    <div className="pl-6 space-y-0.5">
                                      {(sub.subsubsections || []).map((ss) => (
                                        <button
                                          key={ss.id}
                                          type="button"
                                          onClick={() => handleSubsubsectionClick(ss.id)}
                                          className="block w-full text-left py-2 px-4 text-[0.8125rem] text-white/60 hover:text-amber-200/90 transition-colors rounded-lg hover:bg-white/[0.04]"
                                        >
                                          {ss.title}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                            {visibleSubsections.length === 0 && (
                              <p className="text-white/40 text-sm py-2">Нет подразделов</p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Десктоп: левая колонка разделов + правая подразделы */}
            <aside
              className="hidden md:flex md:w-[260px] lg:w-[300px] flex-shrink-0 flex-col border-r border-white/[0.06] overflow-hidden"
              style={{ scrollbarGutter: 'stable' }}
            >
              <h2 className="flex-shrink-0 px-6 pt-6 pb-4 text-xl lg:text-[1.5rem] font-medium tracking-[0.12em] uppercase text-white/95 font-lora">
                Каталог
              </h2>
              <nav
                className="flex-1 min-h-0 overflow-y-auto py-2 pl-6 pr-4"
                role="navigation"
                aria-label="Разделы каталога"
              >
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {sections.map((section) => {
                    const isHovered = hoveredSection?.id === section.id
                    const isActive = activeSection?.id === section.id
                    const isSelected = isHovered || isActive
                    return (
                      <button
                        key={section.id}
                        type="button"
                        onMouseEnter={() => setHoveredSection(section)}
                        onMouseLeave={() => setHoveredSection(null)}
                        onClick={() => setDisplaySection(section)}
                        className={`relative w-full text-left pl-5 pr-5 py-4 rounded-lg text-[0.8125rem] font-medium tracking-[0.04em] leading-relaxed transition-all duration-300 ${
                          isSelected
                            ? 'bg-white/[0.12] text-white'
                            : 'text-white/60 hover:bg-white/[0.06] hover:text-white/90'
                        }`}
                      >
                        {isSelected && (
                          <span
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 rounded-full bg-gradient-to-b from-amber-400/60 to-amber-600/40"
                            aria-hidden
                          />
                        )}
                        <span className="block">{section.title}</span>
                      </button>
                    )
                  })}
                </div>
              )}
              </nav>
            </aside>

            {/* Правая колонка — подразделы (только на десктопе) */}
            <main className="hidden md:flex flex-1 min-w-0 min-h-0 flex-col overflow-hidden">
              <div className="flex-1 min-h-0 p-8 lg:p-12 overflow-y-auto overflow-x-hidden">
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
                    ))}
                  </div>
                ) : activeSection ? (
                  <div key={activeSection.id} className="max-w-4xl space-y-8">
                    {(() => {
                      const visibleSubsections = activeSection.subsections.filter((sub) => sub.title !== 'Проекты')
                      return (
                      <>
                    {/* Все товары раздела */}
                    <button
                      type="button"
                      onClick={() => handleAllProductsClick(activeSection.id)}
                      className="flex items-center justify-between w-full py-4 px-6 rounded-xl border border-white/[0.12] hover:border-amber-500/30 hover:bg-white/[0.04] transition-all duration-300 group"
                    >
                      <span className="text-white/95 font-medium tracking-[0.02em]">Все товары раздела</span>
                      <svg
                        className="w-5 h-5 text-amber-400/50 group-hover:text-amber-400 group-hover:translate-x-1 transition-all duration-300"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* Сетка подразделов */}
                    {visibleSubsections.length === 0 ? (
                      <p className="text-white/40 text-sm tracking-wide py-12">Нет подразделов</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 pb-4">
                        {visibleSubsections.map((sub) => {
                          const hasSubsubsections = (sub.subsubsections || []).length > 0
                          return (
                            <div key={sub.id} className="group/item">
                              <button
                                type="button"
                                onClick={() => handleSubsectionClick(sub.id)}
                                className="w-full h-[88px] min-h-[88px] text-left py-4 px-5 rounded-xl flex items-center justify-between gap-4 text-white/90 text-[0.9375rem] font-medium tracking-[0.02em] bg-white/[0.03] border border-white/[0.08] hover:border-amber-500/20 hover:bg-white/[0.06] transition-all duration-300"
                              >
                                <span className="flex-1 min-w-0 leading-relaxed line-clamp-2">{sub.title}</span>
                                <svg
                                  className="w-5 h-5 flex-shrink-0 text-amber-400/30 group-hover/item:text-amber-400/80 group-hover/item:translate-x-1 transition-all duration-300"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={1.5}
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                              {hasSubsubsections && (
                                <div className="pl-5 pt-2.5 space-y-1">
                                  {(sub.subsubsections || []).map((ss) => (
                                    <button
                                      key={ss.id}
                                      type="button"
                                      onClick={() => handleSubsubsectionClick(ss.id)}
                                      className="block w-full text-left py-2 px-0 text-[0.8125rem] text-white/55 hover:text-amber-200/90 transition-colors duration-200 truncate tracking-wide"
                                    >
                                      {ss.title}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                    </>
                      )
                    })()}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48">
                    <p className="text-white/40 text-sm tracking-wide">Выберите раздел слева</p>
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined'
    ? createPortal(overlay, document.body)
    : overlay
}
