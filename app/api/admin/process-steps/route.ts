import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function ensureAdmin(session: any) {
  return session?.user && ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')
}

export async function GET() {
  try {
    let config = await prisma.processStepsConfig.findFirst()
    
    if (!config) {
      const defaultAdvantages = [
        { id: 1, title: 'Доступная стоимость', description: 'Экономически выгодное решение без потери в качестве' },
        { id: 2, title: 'Легкость и удобство', description: 'Небольшой вес упрощает транспортировку и ускоряет монтаж' },
        { id: 3, title: 'Универсальность', description: 'Широкий ассортимент фитингов для любой конфигурации' },
        { id: 4, title: 'Коррозионная стойкость', description: 'Не подвержена ржавчине и воздействию агрессивных сред' },
        { id: 5, title: 'Идеальная герметичность', description: 'Надежные соединения на десятилетия' },
        { id: 6, title: 'Прочность и долговечность', description: 'Устойчива к ударным нагрузкам и экстремально долгий срок службы' }
      ]
      
      config = await prisma.processStepsConfig.create({
        data: {
          title: '«АкваГазТех» ваш надежный партнер',
          subtitle: '',
          steps: JSON.stringify({
            mainMission: 'Основная миссия компании «АкваГазТех» — обеспечить ваши задачи качественными материалами для современных инженерных систем.',
            specialization: 'Мы специализируемся на поставках труб ПНД (ПЭ) и полного спектра комплектующих для строительства наружных и внутренних сетей любой сложности.\n\nБудь то монтаж водопровода, канализации или газопровода на частном участке, или масштабная застройка городского квартала — мы гарантируем поставку всех необходимых материалов с безупречным качеством и строгим соблюдением сроков.',
            advantages: defaultAdvantages,
            conclusion: 'Выбирая «АкваГазТех», вы выбираете надежность, проверенную временем и сотнями успешных проектов. Мы поставим для вас не просто трубы, а основу для стабильной и долговечной инженерной инфраструктуры.'
          })
        }
      })
    }
    
    // Парсим JSON из steps для обратной совместимости
    let parsedData: any = {}
    try {
      if (typeof config.steps === 'string') {
        parsedData = JSON.parse(config.steps)
      } else {
        parsedData = config.steps
      }
    } catch {
      parsedData = {}
    }
    
    return NextResponse.json({
      title: config.title,
      mainMission: parsedData.mainMission || '',
      specialization: parsedData.specialization || '',
      advantages: parsedData.advantages || [],
      conclusion: parsedData.conclusion || ''
    })
  } catch (error: any) {
    console.error('[ADMIN PROCESS STEPS] GET Error:', error)
    return NextResponse.json({ error: 'Ошибка загрузки конфигурации' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  console.log('[ADMIN PROCESS STEPS] POST - Session:', !!session, session?.user?.email, session?.user?.role)
  if (!ensureAdmin(session)) {
    console.log('[ADMIN PROCESS STEPS] POST - Unauthorized')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    console.log('[ADMIN PROCESS STEPS] POST - Body:', body)
    const { title, mainMission, specialization, advantages, conclusion } = body

    // Сохраняем данные в JSON формате в поле steps
    const stepsData = {
      mainMission,
      specialization,
      advantages,
      conclusion
    }

    // Обновляем или создаем конфигурацию
    const existingConfig = await prisma.processStepsConfig.findFirst()
    console.log('[ADMIN PROCESS STEPS] POST - Existing config:', !!existingConfig)
    
    const config = existingConfig
      ? await prisma.processStepsConfig.update({
          where: { id: existingConfig.id },
          data: { 
            title, 
            subtitle: '',
            steps: stepsData
          }
        })
      : await prisma.processStepsConfig.create({
          data: { 
            title, 
            subtitle: '',
            steps: stepsData
          }
        })

    console.log('[ADMIN PROCESS STEPS] POST - Saved config:', config.id)
    return NextResponse.json({
      title: config.title,
      mainMission,
      specialization,
      advantages,
      conclusion
    })
  } catch (error: any) {
    console.error('[ADMIN PROCESS STEPS] POST Error:', error)
    return NextResponse.json({ error: 'Ошибка сохранения конфигурации' }, { status: 500 })
  }
}
