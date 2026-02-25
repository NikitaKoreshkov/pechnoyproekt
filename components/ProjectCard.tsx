'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface ProjectCardProps {
  id: string
  title: string
  area: number
  priceFrom: number
  priceTo?: number
  buildTime: number
  material: string
  image: string
  tags?: string[]
  region?: string
  isLiked?: boolean
  onLike?: (id: string) => void
  requireAuth?: () => void
}

export default function ProjectCard({
  id,
  title,
  area,
  priceFrom,
  priceTo,
  buildTime,
  material,
  image,
  tags = [],
  region,
  isLiked = false,
  onLike,
  requireAuth
}: ProjectCardProps) {
  const [isLikedState, setIsLikedState] = useState(isLiked)

  useEffect(() => {
    setIsLikedState(isLiked)
  }, [isLiked])

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return (price / 1000000).toFixed(1) + ' млн ₽'
    } else if (price >= 1000) {
      return (price / 1000).toFixed(0) + ' тыс ₽'
    } else {
      return new Intl.NumberFormat('ru-RU').format(price) + ' ₽'
    }
  }

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!onLike) {
      requireAuth?.()
      return
    }
    
    setIsLikedState(!isLikedState)
    onLike(id)
  }

  const handleClick = (e: React.MouseEvent) => {
    // Удаленные проекты фильтруются на уровне API
    // Если проект в списке - значит он существует
    // Переход происходит автоматически через Link
  }

  return (
    <Link 
      href={`/project/${id}`}
      className="group block focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
    >
      <div className="relative bg-transparent">
        {/* Изображение */}
        <div className="relative h-64 w-full overflow-hidden">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="lazy"
            quality={85}
          />
          
          {/* Теги */}
          {tags.length > 0 && (
            <div className="absolute top-4 left-4 flex gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide uppercase bg-[#1A0F0A]/80 backdrop-blur-sm text-[#EDE8E0] border border-white/30"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}


          {/* Иконка лайка */}
          <button
            onClick={handleLike}
            className="absolute bottom-4 right-4 p-2 bg-[#FAF7F2]/95 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-white border border-[#E8E2D9]"
            aria-label={isLikedState ? 'Убрать из избранного' : 'Добавить в избранное'}
          >
            <svg
              className={`w-6 h-6 ${isLikedState ? 'fill-red-500 text-red-500' : 'fill-none'}`}
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        </div>

        {/* Контент */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-[#1A1210] mb-3 font-lora">
            {title}
          </h3>

          {/* Характеристики */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm text-[#5C3825]/80">
              <span>Диаметр:</span>
              <span className="font-semibold text-[#1A1210]">{area} м²</span>
            </div>
            <div className="flex justify-between text-sm text-[#5C3825]/80">
              <span>Материал:</span>
              <span className="font-semibold text-[#1A1210] capitalize">{material}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-[#E8E2D9]">
              <span className="font-bold text-[#1A1210]">Цена</span>
              <span className="font-bold text-base md:text-lg text-[#1A0F0A]">
                {priceTo ? `${formatPrice(priceFrom)} - ${formatPrice(priceTo)}` : `от ${formatPrice(priceFrom)}`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}