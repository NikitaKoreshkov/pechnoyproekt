'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'

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
  const [mounted, setMounted] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // При наведении или клике показываем раздел
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
    },
    [router]
  )

  const handleSubsubsectionClick = useCallback(
    (subsubsectionId: string) => {
      router.push(`/catalog?subsubsectionId=${encodeURIComponent(subsubsectionId)}`)
    },
    [router]
  )

  const handleAllProductsClick = useCallback(
    (sectionId: string) => {
      router.push(`/catalog?sectionId=${encodeURIComponent(sectionId)}`)
    },
    [router]
  )

  // Запоминаем pathname только в момент открытия overlay (не при каждом изменении)
  const pathnameOnOpenRef = useRef<string | null>(null)
  const prevIsOpenRef = useRef(false)
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      pathnameOnOpenRef.current = pathname ?? null
    }
    prevIsOpenRef.current = isOpen
  }, [isOpen, pathname])

  // Закрываем overlay только когда перешли НА каталог (pathname изменился после клика)
  useEffect(() => {
    if (!isOpen) return
    const onOpen = pathnameOnOpenRef.current
    const curr = pathname ?? null
    if (curr?.startsWith('/catalog') && onOpen !== curr) {
      const t = setTimeout(() => onClose(), 50)
      return () => clearTimeout(t)
    }
  }, [pathname, isOpen, onClose])

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

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col w-screen min-h-screen bg-black/70 backdrop-blur-md"
      style={{
        opacity: show ? 1 : 0,
        transition: `opacity ${ANIMATION_DURATION}ms ${EASE}`,
      }}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Каталог"
    >
      <div
        className="flex flex-col flex-1 w-full min-h-full max-w-none overflow-hidden"
        style={{
          transform: show ? 'scale(1) translateY(0)' : 'scale(0.98) translateY(12px)',
          opacity: show ? 1 : 0,
          transition: `transform ${ANIMATION_DURATION}ms ${EASE}, opacity ${ANIMATION_DURATION}ms ${EASE}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Премиум панель — тёмная тема */}
        <div className="flex flex-1 min-h-0 bg-[#0c1222]">
          {/* Хедер */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-5 z-20 bg-gradient-to-b from-[#0c1222] via-[#0c1222]/98 to-transparent">
            <h2 className="text-lg font-medium tracking-[0.2em] uppercase text-white/90">Каталог</h2>
            <button
              type="button"
              onClick={handleClose}
              className="group p-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all duration-300"
              aria-label="Закрыть"
            >
              <svg className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Левая колонка — разделы, hover для выбора */}
          <aside
            className="w-[340px] min-w-[280px] flex-shrink-0 border-r border-white/5 pt-20 overflow-y-auto"
            style={{ scrollbarGutter: 'stable' }}
          >
            {loading ? (
              <div className="px-6 py-8">
                <div className="h-4 w-32 rounded bg-white/10 animate-pulse" />
                <div className="mt-4 space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-10 rounded bg-white/5 animate-pulse" style={{ animationDelay: `${i * 50}ms` }} />
                  ))}
                </div>
              </div>
            ) : (
              <nav className="py-4" role="navigation" aria-label="Разделы каталога">
                {sections.map((section) => {
                  const isHovered = hoveredSection?.id === section.id
                  const isActive = activeSection?.id === section.id
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onMouseEnter={() => setHoveredSection(section)}
                      onMouseLeave={() => setHoveredSection(null)}
                      onClick={() => setDisplaySection(section)}
                      className="relative w-full text-left group"
                    >
                      <div
                        className="relative flex items-center justify-between gap-4 px-6 py-3.5 cursor-pointer transition-all duration-200"
                        style={{ transition: HOVER_TRANSITION }}
                      >
                        {/* Акцентная полоска слева */}
                        <div
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full bg-amber-400/90 transition-all duration-200"
                          style={{
                            opacity: isHovered || isActive ? 1 : 0,
                            height: isHovered ? '28px' : '20px',
                          }}
                        />
                        <span
                          className={`text-sm font-medium uppercase tracking-widest transition-colors duration-200 ${
                            isHovered || isActive ? 'text-white' : 'text-white/60 hover:text-white/80'
                          }`}
                        >
                          {section.title}
                        </span>
                        <svg
                          className={`w-4 h-4 flex-shrink-0 text-amber-400/80 transition-all duration-200 ${
                            isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1'
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      {/* Subtle hover bg */}
                      <div
                        className="absolute inset-0 bg-white/[0.03] rounded-r-lg pointer-events-none transition-opacity duration-200"
                        style={{ opacity: isHovered ? 1 : 0 }}
                      />
                    </button>
                  )
                })}
              </nav>
            )}
          </aside>

          {/* Правая колонка — подразделы при hover */}
          <main className="flex-1 min-w-0 pt-20 pl-12 pr-10 pb-10 overflow-y-auto">
            {loading ? null : activeSection ? (
              <div key={activeSection.id} className="opacity-0 animate-catalog-content">
                <p className="text-xs font-medium tracking-[0.25em] uppercase text-amber-400/80 mb-6">
                  {activeSection.title}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-0">
                  <div className="sm:col-span-full mb-4">
                    <button
                      type="button"
                      onClick={() => handleAllProductsClick(activeSection.id)}
                      className="group flex items-center justify-between gap-4 w-full px-5 py-3.5 rounded-xl text-white/90 hover:text-white hover:bg-white/5 transition-all duration-200"
                    >
                      <span className="text-sm font-medium">Все товары раздела</span>
                      <svg className="w-4 h-4 text-amber-400/70 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                  {activeSection.subsections.length === 0 ? (
                    <p className="text-white/40 text-sm sm:col-span-full">Нет подразделов</p>
                  ) : (
                    activeSection.subsections.map((sub) => {
                      const hasSubsubsections = (sub.subsubsections || []).length > 0
                      return (
                        <div key={sub.id} className="space-y-1">
                          <button
                            type="button"
                            onClick={() => handleSubsectionClick(sub.id)}
                            className="group flex items-center justify-between gap-4 w-full px-5 py-3 rounded-xl text-left text-white/70 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
                          >
                            <span className="text-sm">{sub.title}</span>
                            <svg className="w-4 h-4 text-amber-400/50 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 -translate-x-1 transition-all duration-200 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          {hasSubsubsections && (
                            <div className="pl-4 space-y-0.5">
                              {(sub.subsubsections || []).map((ss) => (
                                <button
                                  key={ss.id}
                                  type="button"
                                  onClick={() => handleSubsubsectionClick(ss.id)}
                                  className="group flex items-center justify-between gap-4 w-full px-4 py-2 rounded-lg text-left text-white/50 hover:text-white/80 hover:bg-white/[0.04] transition-all duration-200 text-sm"
                                >
                                  <span>{ss.title}</span>
                                  <svg className="w-3.5 h-3.5 text-amber-400/40 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-white/40 text-sm tracking-wide">Наведите на раздел слева</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
