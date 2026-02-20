import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function ensureAdmin(session: any) {
  return session?.user && ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')
}

export async function GET() {
  try {
    let config = await prisma.reviewsConfig.findFirst()
    
    if (!config) {
      console.log('[ADMIN REVIEWS CONFIG] GET - Creating default config')
      config = await prisma.reviewsConfig.create({
        data: {
          title: 'Реальные фото и отзывы наших клиентов',
          description: 'Мы собрали часть отзывов — чтобы вы могли увидеть качество наших материалов и уровень сервиса на практике.\n\nОстальные отзывы можно посмотреть по запросу или в наших соцсетях.'
        }
      })
    }
    
    console.log('[ADMIN REVIEWS CONFIG] GET - Returning config:', config.id, 'Title:', config.title)
    
    return NextResponse.json(config, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error: any) {
    console.error('[ADMIN REVIEWS CONFIG] GET Error:', error)
    return NextResponse.json({ error: 'Ошибка загрузки конфигурации: ' + (error.message || 'Неизвестная ошибка') }, { status: 500 })
  }
}

export async function POST(req: Request) {
  console.log('[ADMIN REVIEWS CONFIG] POST - Request received')
  const session = await getServerSession(authOptions)
  console.log('[ADMIN REVIEWS CONFIG] POST - Session:', !!session, session?.user?.email, session?.user?.role)
  if (!ensureAdmin(session)) {
    console.log('[ADMIN REVIEWS CONFIG] POST - Unauthorized, session:', session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    console.log('[ADMIN REVIEWS CONFIG] POST - Body received:', body)
    console.log('[ADMIN REVIEWS CONFIG] POST - Body type:', typeof body, 'Keys:', Object.keys(body))
    const {
      title,
      description
    } = body

    console.log('[ADMIN REVIEWS CONFIG] POST - Extracted title:', title, 'description length:', description?.length)

    // Проверяем, что данные не пустые
    if (!title || !description) {
      console.error('[ADMIN REVIEWS CONFIG] POST - Empty title or description. Title:', title, 'Description:', description)
      return NextResponse.json({ error: 'Заголовок и описание не могут быть пустыми' }, { status: 400 })
    }

    const existingConfig = await prisma.reviewsConfig.findFirst()
    console.log('[ADMIN REVIEWS CONFIG] POST - Existing config:', !!existingConfig, existingConfig?.id)
    
    const config = existingConfig
      ? await prisma.reviewsConfig.update({
          where: { id: existingConfig.id },
          data: {
            title: title.trim(),
            description: description.trim()
          }
        })
      : await prisma.reviewsConfig.create({
          data: {
            title: title.trim(),
            description: description.trim()
          }
        })

    console.log('[ADMIN REVIEWS CONFIG] POST - Saved config:', config.id, 'Title:', config.title, 'Description length:', config.description.length)
    
    // Возвращаем сохраненные данные с заголовками для кэширования
    return NextResponse.json(config, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error: any) {
    console.error('[ADMIN REVIEWS CONFIG] POST Error:', error)
    return NextResponse.json({ error: 'Ошибка сохранения конфигурации: ' + (error.message || 'Неизвестная ошибка') }, { status: 500 })
  }
}

