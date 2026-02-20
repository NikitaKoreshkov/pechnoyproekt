/**
 * Скрипт для обновления отзывов под тематику продажи труб
 * Запуск: npx tsx scripts/update-reviews-for-pipes.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateReviewsForPipes() {
  try {
    console.log('🔄 Начинаю обновление отзывов под продажу труб...')

    const reviews = [
      {
        name: 'Александр Петров',
        city: 'Москва',
        text: 'Заказывал трубы ПНД для водопровода на даче. Качество отличное, доставили быстро, все в срок. Монтаж прошел без проблем, соединения герметичные. Рекомендую!',
        image: '/images/house.jpg',
        date: new Date('2024-12-15')
      },
      {
        name: 'Мария Соколова',
        city: 'Санкт-Петербург',
        text: 'Покупали трубы и фитинги для системы отопления. Широкий ассортимент, профессиональные консультации. Материалы сертифицированные, цена адекватная. Очень довольна!',
        image: '/images/house.jpg',
        date: new Date('2024-12-10')
      },
      {
        name: 'Дмитрий Иванов',
        city: 'Казань',
        text: 'Работаем с «АкваГазТех» уже второй год. Поставляют трубы ПНД для наших строительных проектов. Всегда в срок, качество стабильное, никаких нареканий. Надежный поставщик!',
        image: '/images/house.jpg',
        date: new Date('2024-12-05')
      },
      {
        name: 'Елена Кузнецова',
        city: 'Новосибирск',
        text: 'Нужны были трубы для канализации. Подобрали именно то, что нужно, помогли с расчетом количества. Доставка быстрая, упаковка качественная. Спасибо за профессионализм!',
        image: '/images/house.jpg',
        date: new Date('2024-11-28')
      },
      {
        name: 'Сергей Волков',
        city: 'Екатеринбург',
        text: 'Заказывал металлопластиковые трубы для водоснабжения. Качество на высоте, монтажники остались довольны. Все фитинги подошли идеально, никаких протечек. Отличный сервис!',
        image: '/images/house.jpg',
        date: new Date('2024-11-20')
      },
      {
        name: 'Ольга Морозова',
        city: 'Краснодар',
        text: 'Покупали трубы ПНД для газопровода. Консультанты помогли выбрать правильный диаметр и тип. Материалы соответствуют всем требованиям, сертификаты предоставили сразу. Рекомендую!',
        image: '/images/house.jpg',
        date: new Date('2024-11-15')
      }
    ]

    // Удаляем все старые отзывы
    const deletedCount = await prisma.review.deleteMany({})
    console.log(`🗑️  Удалено старых отзывов: ${deletedCount.count}`)

    // Создаем новые отзывы
    for (const review of reviews) {
      await prisma.review.create({
        data: review
      })
      console.log(`✅ Создан отзыв от ${review.name}`)
    }

    console.log(`✅ Всего создано отзывов: ${reviews.length}`)
    console.log('✅ Обновление завершено успешно!')
  } catch (error) {
    console.error('❌ Ошибка при обновлении:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateReviewsForPipes()
  .then(() => {
    console.log('🎉 Скрипт выполнен успешно')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Критическая ошибка:', error)
    process.exit(1)
  })
