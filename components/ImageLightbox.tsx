'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import Image from 'next/image'

interface ImageLightboxProps {
  images: string[]
  currentIndex: number
  onClose: () => void
  alt: string
}

const LENS_ZOOM = 4
const LENS_SIZE = 160

export default function ImageLightbox({ images, currentIndex, onClose, alt }: ImageLightboxProps) {
  const [index, setIndex] = useState(currentIndex)
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null)
  const imageWrapperRef = useRef<HTMLDivElement>(null)

  const currentSrc = images[index] ?? images[0]

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % images.length)
  }, [images.length])

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + images.length) % images.length)
  }, [images.length])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, goNext, goPrev])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const updateRect = useCallback(() => {
    if (imageWrapperRef.current) {
      setContainerRect(imageWrapperRef.current.getBoundingClientRect())
    }
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setCursorPos({ x: e.clientX, y: e.clientY })
    updateRect()
  }

  const handleMouseEnter = () => {
    setIsHovering(true)
    updateRect()
  }

  // Позиция курсора в пикселях относительно контейнера
  const dx = containerRect ? cursorPos.x - containerRect.left : 0
  const dy = containerRect ? cursorPos.y - containerRect.top : 0

  // Смещение для img: точка (dx, dy) должна оказаться в центре лупы
  const imgLeft = LENS_SIZE / 2 - dx * LENS_ZOOM
  const imgTop = LENS_SIZE / 2 - dy * LENS_ZOOM

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm cursor-zoom-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Лупа: img с масштабом, область под курсором в центре */}
      {isHovering && containerRect && (
        <div
          className="pointer-events-none fixed z-[102] rounded-full border-2 border-white/90 shadow-2xl overflow-hidden bg-black"
          style={{
            left: cursorPos.x - LENS_SIZE / 2,
            top: cursorPos.y - LENS_SIZE / 2,
            width: LENS_SIZE,
            height: LENS_SIZE,
          }}
        >
          <img
            src={currentSrc}
            alt=""
            draggable={false}
            className="absolute select-none"
            style={{
              width: containerRect.width * LENS_ZOOM,
              height: containerRect.height * LENS_ZOOM,
              left: imgLeft,
              top: imgTop,
              minWidth: containerRect.width * LENS_ZOOM,
              minHeight: containerRect.height * LENS_ZOOM,
            }}
          />
        </div>
      )}

      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-[101] w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        aria-label="Закрыть"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goPrev() }}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-[101] w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="Предыдущее"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goNext() }}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-[101] w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="Следующее"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </>
      )}

      <div
        className="relative w-full h-full max-w-6xl max-h-[90vh] mx-4 flex items-center justify-center"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovering(false)}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={imageWrapperRef}
          className="relative w-full h-full min-h-[60vh] overflow-hidden rounded-lg"
          style={{ cursor: isHovering ? 'none' : 'zoom-in' }}
        >
          <Image
            src={currentSrc}
            alt={`${alt} — фото ${index + 1}`}
            fill
            className="object-contain"
            sizes="100vw"
            unoptimized
            draggable={false}
          />
        </div>
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[101] text-white/70 text-sm font-light tracking-widest">
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  )
}
