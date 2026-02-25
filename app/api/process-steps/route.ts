import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Принудительно делаем API динамическим для мгновенного обновления
export const dynamic = 'force-dynamic'
export const revalidate = 0

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
          id: 'default',
          title: 'Ваш надёжный партнёр',
          subtitle: '',
          steps: JSON.stringify({
            mainMission: 'Основная миссия компании — обеспечить ваши задачи качественными решениями и надёжным сервисом.',
            specialization: 'Мы специализируемся на поставках качественной продукции и услуг. Широкий ассортимент, индивидуальный подход, соблюдение сроков.',
            advantages: defaultAdvantages,
            conclusion: 'Выбирая нас, вы выбираете надёжность, проверенную временем и успешными проектами.'
          }),
          updatedAt: new Date(),
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
    console.error('[PUBLIC PROCESS STEPS] GET Error:', error)
    return NextResponse.json({ error: 'Ошибка загрузки конфигурации' }, { status: 500 })
  }
}