/**
 * Скрипт для обновления информации о компании в БД
 * Запуск: npx tsx scripts/update-company-info.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateCompanyInfo() {
  try {
    console.log('🔄 Начинаю обновление информации о компании...')

    const defaultAdvantages = [
      { id: 1, title: 'Доступная стоимость', description: 'Экономически выгодное решение без потери в качестве' },
      { id: 2, title: 'Легкость и удобство', description: 'Небольшой вес упрощает транспортировку и ускоряет монтаж' },
      { id: 3, title: 'Универсальность', description: 'Широкий ассортимент фитингов для любой конфигурации' },
      { id: 4, title: 'Коррозионная стойкость', description: 'Не подвержена ржавчине и воздействию агрессивных сред' },
      { id: 5, title: 'Идеальная герметичность', description: 'Надежные соединения на десятилетия' },
      { id: 6, title: 'Прочность и долговечность', description: 'Устойчива к ударным нагрузкам и экстремально долгий срок службы' }
    ]

    const stepsData = {
      mainMission: 'Основная миссия компании «АкваГазТех» — обеспечить ваши задачи качественными материалами для современных инженерных систем.',
      specialization: 'Мы специализируемся на поставках труб ПНД (ПЭ) и полного спектра комплектующих для строительства наружных и внутренних сетей любой сложности.\n\nБудь то монтаж водопровода, канализации или газопровода на частном участке, или масштабная застройка городского квартала — мы гарантируем поставку всех необходимых материалов с безупречным качеством и строгим соблюдением сроков.',
      advantages: defaultAdvantages,
      conclusion: 'Выбирая «АкваГазТех», вы выбираете надежность, проверенную временем и сотнями успешных проектов. Мы поставим для вас не просто трубы, а основу для стабильной и долговечной инженерной инфраструктуры.'
    }

    const existing = await prisma.processStepsConfig.findFirst()
    
    if (existing) {
      console.log('📋 Обновляю существующую конфигурацию...')
      const updated = await prisma.processStepsConfig.update({
        where: { id: existing.id },
        data: {
          title: '«АкваГазТех» ваш надежный партнер',
          subtitle: '',
          steps: stepsData
        }
      })
      console.log('✅ Конфигурация обновлена:', updated.id)
    } else {
      console.log('⚠️  Конфигурация не найдена. Создаю новую...')
      const created = await prisma.processStepsConfig.create({
        data: {
          title: '«АкваГазТех» ваш надежный партнер',
          subtitle: '',
          steps: stepsData
        }
      })
      console.log('✅ Конфигурация создана:', created.id)
    }

    console.log('\n✅ Обновление завершено успешно!')
  } catch (error) {
    console.error('❌ Ошибка при обновлении:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateCompanyInfo()
  .then(() => {
    console.log('🎉 Скрипт выполнен успешно')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Критическая ошибка:', error)
    process.exit(1)
  })
