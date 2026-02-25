'use client'

import { useState } from 'react'
import Image from 'next/image'

const INITIAL_COUNT = 6

interface PhotoGalleryBlockProps {
  photos: string[]
  altPrefix: string
  onPhotoClick: (index: number) => void
}

export default function PhotoGalleryBlock({
  photos,
  altPrefix,
  onPhotoClick,
}: PhotoGalleryBlockProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT)
  const visible = photos.slice(0, visibleCount)
  const remaining = photos.length - visibleCount
  const showMore = remaining > 0

  const loadMore = () => {
    setVisibleCount((prev) => Math.min(prev + INITIAL_COUNT, photos.length))
  }

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-8">
      {visible.map((src, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onPhotoClick(i)}
          className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-white ring-1 ring-[#E8E2D9] hover:ring-[#5C3825]/30 shadow-[0_4px_24px_-4px_rgba(26,15,10,0.08)] hover:shadow-[0_20px_50px_-12px_rgba(26,15,10,0.2)] transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-[#5C3825]/40 cursor-zoom-in"
        >
          <Image
            src={src}
            alt={`${altPrefix} — фото ${i + 1}`}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, 50vw"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-[#2C1810] flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all duration-300">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </div>
        </button>
      ))}
      {showMore && (
        <div className="col-span-full flex justify-center pt-4">
          <button
            type="button"
            onClick={loadMore}
            className="px-6 py-3 rounded-xl font-medium text-[#5C3825] hover:text-[#1A0F0A] bg-white ring-1 ring-[#E8E2D9] hover:ring-[#5C3825]/40 hover:bg-[#FAF7F2] transition-all duration-300"
          >
            Показать далее ({remaining})
          </button>
        </div>
      )}
    </section>
  )
}
