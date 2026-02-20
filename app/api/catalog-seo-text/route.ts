import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Отключаем кеширование для этого API
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'
export const fetchCache = 'force-no-store'

export async function GET() {
  try {
    const config = await prisma.catalogSeoTextConfig.findFirst()
    
    // Если конфига нет, возвращаем дефолтные значения
    if (!config) {
      return NextResponse.json({
        title: 'Трубы ПНД и комплектующие для инженерных систем',
          content: `Наша компания «АкваГазТех» специализируется на поставке качественных труб ПНД (ПЭ) и полного спектра комплектующих для строительства наружных и внутренних инженерных сетей любой сложности. Мы предлагаем широкий ассортимент труб различного диаметра и назначения для водопровода, канализации и газопровода.

В нашем каталоге представлены трубы ПНД от 20 до 630 мм, включая все необходимые фитинги, переходники, краны и другие комплектующие. Все материалы соответствуют ГОСТам и имеют необходимые сертификаты качества. Мы работаем в Москве, Санкт-Петербурге и по всей России.

Каждая поставка включает полный комплект документов, сертификаты качества и может быть адаптирована под ваши потребности. Поставка материалов включает все этапы: от подбора ассортимента до доставки на объект. Гарантия качества на всю продукцию — соответствие ГОСТам.`
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    }
    
    return NextResponse.json({
      title: config.title,
      content: config.content
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('[Catalog SEO Text API] Error fetching config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch catalog SEO text config' },
      { status: 500 }
    )
  }
}

