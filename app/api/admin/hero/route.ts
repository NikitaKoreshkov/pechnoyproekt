import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function ensureAdmin(session: any) {
  return session?.user && ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')
}

export async function GET() {
  try {
    let config = await prisma.heroConfig.findFirst()
    
    if (!config) {
      // Создаем дефолтную конфигурацию если её нет
      config = await prisma.heroConfig.create({
        data: {
          heroImage: '/images/main.png',
          title: 'Трубы ПНД и комплектующие для инженерных систем',
          subtitle: 'Надёжно. Выгодно. С гарантией качества.'
        }
      })
    }
    
    return NextResponse.json(config)
  } catch (error: any) {
    console.error('[ADMIN HERO] GET Error:', error)
    return NextResponse.json({ error: 'Ошибка загрузки конфигурации' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  console.log('[ADMIN HERO] POST - Session:', !!session, session?.user?.email, session?.user?.role)
  if (!ensureAdmin(session)) {
    console.log('[ADMIN HERO] POST - Unauthorized')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    console.log('[ADMIN HERO] POST - Body:', body)
    const { heroImage, title, subtitle } = body

    // Обновляем или создаем конфигурацию
    const existingConfig = await prisma.heroConfig.findFirst()
    console.log('[ADMIN HERO] POST - Existing config:', !!existingConfig)
    
    const config = existingConfig
      ? await prisma.heroConfig.update({
          where: { id: existingConfig.id },
          data: {
            heroImage: heroImage || '/images/main.png',
            title: title || 'Трубы ПНД и комплектующие для инженерных систем',
            subtitle: subtitle || 'Качественные материалы. Быстрая доставка. Надёжные решения.'
          }
        })
      : await prisma.heroConfig.create({
          data: {
            heroImage: heroImage || '/images/main.png',
            title: title || 'Трубы ПНД и комплектующие для инженерных систем',
            subtitle: subtitle || 'Качественные материалы. Быстрая доставка. Надёжные решения.'
          }
        })

    console.log('[ADMIN HERO] POST - Saved config:', config.id)
    return NextResponse.json(config)
  } catch (error: any) {
    console.error('[ADMIN HERO] POST Error:', error)
    return NextResponse.json({ error: 'Ошибка сохранения конфигурации' }, { status: 500 })
  }
}

