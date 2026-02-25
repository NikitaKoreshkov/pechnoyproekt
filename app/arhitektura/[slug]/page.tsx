'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import FormattedProjectText from '@/components/FormattedProjectText'
import ImageLightbox from '@/components/ImageLightbox'
import PhotoGalleryBlock from '@/components/PhotoGalleryBlock'

interface ContentBlock {
  type: 'text' | 'photos'
  text?: string
  photoStart?: number
  photoEnd?: number
}

export default function ArhitekturaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const [data, setData] = useState<{
    name: string
    blocks: ContentBlock[]
    imagePaths: string[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState<{ open: boolean; index: number }>({ open: false, index: 0 })

  useEffect(() => {
    fetch(`/api/portfolio/vid/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found')
        return r.json()
      })
      .then(setData)
      .catch(() => router.push('/arhitektura'))
      .finally(() => setLoading(false))
  }, [slug, router])

  if (loading || !data) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center bg-gradient-to-b from-[#FAF7F2] via-[#F5F0E8] to-[#EDE8E0]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5C3825]" />
      </div>
    )
  }

  const getPhotos = (start: number, end: number) => {
    return data.imagePaths.slice(start - 1, end)
  }

  const openLightbox = (blockIndex: number, photoIndexInBlock: number) => {
    let globalIndex = 0
    for (let i = 0; i < blockIndex; i++) {
      const b = data.blocks[i]
      if (b.type === 'photos' && b.photoStart && b.photoEnd) {
        globalIndex += b.photoEnd - b.photoStart + 1
      }
    }
    globalIndex += photoIndexInBlock
    setLightbox({ open: true, index: globalIndex })
  }

  const getGlobalPhotos = () => {
    return data.blocks
      .filter((b) => b.type === 'photos' && b.photoStart && b.photoEnd)
      .flatMap((b) => getPhotos(b.photoStart!, b.photoEnd!))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF7F2] via-[#F5F0E8] to-[#EDE8E0]">
      <Header />
      <main className="pt-28 pb-32">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 lg:px-12">
          <Link
            href="/arhitektura"
            className="inline-flex items-center gap-3 text-[#5C3825] hover:text-[#1A0F0A] mb-16 font-medium tracking-[0.1em] text-sm uppercase transition-colors duration-300"
          >
            <span className="w-8 h-px bg-[#5C3825]/40" />
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            К архитектуре решений
          </Link>

          <header className="mb-24">
            <p className="text-[10px] uppercase tracking-[0.5em] text-[#5C3825]/80 mb-6 font-medium">
              Решение
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-[#1A1210] font-lora leading-[1.15] tracking-tight">
              {data.name}
            </h1>
            <div className="mt-10 w-24 h-px bg-gradient-to-r from-[#2C1810]/60 to-transparent" />
          </header>

          <article className="space-y-12 text-[#1A1210]">
            {data.blocks.map((block, idx) => {
              if (block.type === 'text' && block.text) {
                return (
                  <section key={`t-${idx}`} className="max-w-2xl">
                    <div className="text-[17px] leading-[1.95] text-[#1A1210]/90 font-light">
                      <FormattedProjectText text={block.text} />
                    </div>
                  </section>
                )
              }
              if (block.type === 'photos' && block.photoStart && block.photoEnd) {
                const photos = getPhotos(block.photoStart, block.photoEnd)
                return (
                  <PhotoGalleryBlock
                    key={`p-${idx}`}
                    photos={photos}
                    altPrefix={data.name}
                    onPhotoClick={(i) => openLightbox(idx, i)}
                  />
                )
              }
              return null
            })}
          </article>
        </div>
      </main>
      <Footer />

      {lightbox.open && (
        <ImageLightbox
          images={getGlobalPhotos()}
          currentIndex={lightbox.index}
          onClose={() => setLightbox({ open: false, index: 0 })}
          alt={data.name}
        />
      )}
    </div>
  )
}
