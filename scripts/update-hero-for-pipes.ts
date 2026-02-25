/**
 * Скрипт для обновления данных Hero блока под тематику продажи труб
 * Запуск: npx tsx scripts/update-hero-for-pipes.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateHeroForPipes() {
  try {
    console.log('🔄 Начинаю обновление данных Hero блока под продажу труб...')

    const existing = await prisma.heroConfig.findFirst()
    
    if (existing) {
      const updated = await prisma.heroConfig.update({
        where: { id: existing.id },
        data: {
          title: 'Качественные трубы ПНД для ваших проектов',
          subtitle: 'Надёжно. Выгодно. С гарантией качества.'
        }
      })
      console.log('✅ Данные Hero блока обновлены:', updated.id)
      console.log('   Заголовок:', updated.title)
      console.log('   Подзаголовок:', updated.subtitle)
    } else {
      const created = await prisma.heroConfig.create({
        data: {
          heroImage: '/images/main.png',
          title: 'Качественные трубы ПНД для ваших проектов',
          subtitle: 'Надёжно. Выгодно. С гарантией качества.'
        }
      })
      console.log('✅ Данные Hero блока созданы:', created.id)
    }

    console.log('✅ Обновление завершено успешно!')
  } catch (error) {
    console.error('❌ Ошибка при обновлении:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateHeroForPipes()
  .then(() => {
    console.log('🎉 Скрипт выполнен успешно')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Критическая ошибка:', error)
    process.exit(1)
  })
