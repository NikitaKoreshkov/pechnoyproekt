/**
 * Скрипт для обновления конфигурации отзывов под тематику продажи труб
 * Запуск: npx tsx scripts/update-reviews-config-for-pipes.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateReviewsConfigForPipes() {
  try {
    console.log('🔄 Начинаю обновление конфигурации отзывов под продажу труб...')

    const title = 'Реальные фото и отзывы наших клиентов'
    const description = 'Мы собрали часть отзывов — чтобы вы могли увидеть качество наших материалов и уровень сервиса на практике.\n\nОстальные отзывы можно посмотреть по запросу или в наших соцсетях.'

    const existing = await prisma.reviewsConfig.findFirst()
    
    if (existing) {
      const updated = await prisma.reviewsConfig.update({
        where: { id: existing.id },
        data: {
          title,
          description
        }
      })
      console.log('✅ Конфигурация отзывов обновлена:', updated.id)
    } else {
      const created = await prisma.reviewsConfig.create({
        data: {
          title,
          description
        }
      })
      console.log('✅ Конфигурация отзывов создана:', created.id)
    }

    console.log('✅ Обновление завершено успешно!')
  } catch (error) {
    console.error('❌ Ошибка при обновлении:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateReviewsConfigForPipes()
  .then(() => {
    console.log('🎉 Скрипт выполнен успешно')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Критическая ошибка:', error)
    process.exit(1)
  })
