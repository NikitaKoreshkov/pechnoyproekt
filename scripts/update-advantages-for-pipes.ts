/**
 * Скрипт для обновления преимуществ под тематику продажи труб
 * Запуск: npx tsx scripts/update-advantages-for-pipes.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateAdvantagesForPipes() {
  try {
    console.log('🔄 Начинаю обновление преимуществ под продажу труб...')

    const advantages = [
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

    const existing = await prisma.advantagesConfig.findFirst()
    
    if (existing) {
      const updated = await prisma.advantagesConfig.update({
        where: { id: existing.id },
        data: {
          title: 'Наши преимущества',
          subtitle: 'Почему выбирают «АкваГазТех» для своих проектов',
          items: advantages
        }
      })
      console.log('✅ Преимущества обновлены:', updated.id)
    } else {
      const created = await prisma.advantagesConfig.create({
        data: {
          title: 'Наши преимущества',
          subtitle: 'Почему выбирают «АкваГазТех» для своих проектов',
          items: advantages
        }
      })
      console.log('✅ Преимущества созданы:', created.id)
    }

    console.log('✅ Обновление завершено успешно!')
  } catch (error) {
    console.error('❌ Ошибка при обновлении:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateAdvantagesForPipes()
  .then(() => {
    console.log('🎉 Скрипт выполнен успешно')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Критическая ошибка:', error)
    process.exit(1)
  })
