import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Отключаем кеширование для этого API
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

function ensureAdmin(session: any) {
  return session?.user && ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')
}

export async function GET() {
  try {
    let config = await prisma.catalogSeoTextConfig.findFirst()
    
    // Если конфига нет, создаем дефолтный
    if (!config) {
      config = await prisma.catalogSeoTextConfig.create({
        data: {
          title: 'Трубы ПНД и комплектующие для инженерных систем',
          content: `Наша компания «АкваГазТех» специализируется на поставке качественных труб ПНД и полного спектра комплектующих для инженерных систем по всей России. Мы предлагаем широкий выбор труб различных диаметров и классов прочности для водопровода, канализации и газопровода.

В нашем каталоге представлены трубы ПНД от ведущих производителей, фитинги, запорная арматура и другие необходимые материалы для строительства наружных и внутренних сетей любой сложности. Все материалы соответствуют ГОСТам и имеют сертификаты качества. Мы работаем в Москве, Санкт-Петербурге и других городах России.

Каждая поставка включает полный комплект необходимых материалов и может быть адаптирована под ваши требования. Поставка материалов включает все этапы: от подбора ассортимента до доставки на объект. Гарантия качества на всю продукцию.`
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

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!ensureAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const body = await req.json()
    const { title, content } = body
    
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }
    
    // Обновляем или создаем конфиг
    let config = await prisma.catalogSeoTextConfig.findFirst()
    
    if (config) {
      config = await prisma.catalogSeoTextConfig.update({
        where: { id: config.id },
        data: {
          title: title.trim(),
          content: content.trim()
        }
      })
    } else {
      config = await prisma.catalogSeoTextConfig.create({
        data: {
          title: title.trim(),
          content: content.trim()
        }
      })
    }
    
    // Принудительно инвалидируем кеш для страницы каталога
    try {
      revalidatePath('/catalog')
      console.log('[Catalog SEO Text API] Cache invalidated for /catalog')
    } catch (e) {
      console.error('[Catalog SEO Text API] Failed to revalidate cache:', e)
    }
    
    // Отправляем событие для обновления на сайте в реальном времени
    // (можно использовать BroadcastChannel на клиенте)
    
    return NextResponse.json({
      ok: true,
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
    console.error('[Catalog SEO Text API] Error saving config:', error)
    return NextResponse.json(
      { error: 'Failed to save catalog SEO text config' },
      { status: 500 }
    )
  }
}

