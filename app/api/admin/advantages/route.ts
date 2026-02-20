import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function ensureAdmin(session: any) {
  return session?.user && ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')
}

export async function GET() {
  try {
    let config = await prisma.advantagesConfig.findFirst()
    
    if (!config) {
const defaultAdvantages = [
  { 
    id: 'quality', 
    title: 'Качественные материалы', 
    description: 'Только сертифицированные трубы ПНД и комплектующие от проверенных производителей' 
  },
  { 
    id: 'delivery', 
    title: 'Быстрая доставка', 
    description: 'Оперативная поставка материалов в любую точку региона с соблюдением сроков' 
  },
  { 
    id: 'warranty', 
    title: 'Гарантия качества', 
    description: 'Полная гарантия на все поставляемые материалы и комплектующие' 
  },
  { 
    id: 'range', 
    title: 'Широкий ассортимент', 
    description: 'Полный спектр труб ПНД и фитингов для любых инженерных систем' 
  },
  { 
    id: 'experience', 
    title: 'Опыт работы', 
    description: 'Многолетний опыт поставок материалов для строительства инженерных сетей' 
  },
  { 
    id: 'support', 
    title: 'Профессиональная поддержка', 
    description: 'Консультации по подбору материалов и помощь в реализации проектов' 
  }
]

      config = await prisma.advantagesConfig.create({
        data: {
          title: 'Наши преимущества',
          subtitle: 'Почему выбирают «АкваГазТех» для своих проектов',
          items: defaultAdvantages
        }
      })
    }
    
    return NextResponse.json(config)
  } catch (error: any) {
    console.error('[ADMIN ADVANTAGES] GET Error:', error)
    return NextResponse.json({ error: 'Ошибка загрузки конфигурации' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  console.log('[ADMIN ADVANTAGES] POST - Session:', !!session, session?.user?.email, session?.user?.role)
  if (!ensureAdmin(session)) {
    console.log('[ADMIN ADVANTAGES] POST - Unauthorized')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    console.log('[ADMIN ADVANTAGES] POST - Body:', body)
    const { title, subtitle, items } = body

    // Обновляем или создаем конфигурацию
    const existingConfig = await prisma.advantagesConfig.findFirst()
    console.log('[ADMIN ADVANTAGES] POST - Existing config:', !!existingConfig)
    
    const config = existingConfig
      ? await prisma.advantagesConfig.update({
          where: { id: existingConfig.id },
          data: { title, subtitle, items }
        })
      : await prisma.advantagesConfig.create({
          data: { title, subtitle, items }
        })

    console.log('[ADMIN ADVANTAGES] POST - Saved config:', config.id)
    return NextResponse.json(config)
  } catch (error: any) {
    console.error('[ADMIN ADVANTAGES] POST Error:', error)
    return NextResponse.json({ error: 'Ошибка сохранения конфигурации' }, { status: 500 })
  }
}
