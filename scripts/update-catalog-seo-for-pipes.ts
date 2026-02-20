/**
 * Скрипт для обновления SEO текста каталога под тематику продажи труб
 * Запуск: npx tsx scripts/update-catalog-seo-for-pipes.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateCatalogSeoForPipes() {
  try {
    console.log('🔄 Начинаю обновление SEO текста каталога под продажу труб...')

    const existing = await prisma.catalogSeoTextConfig.findFirst()
    
    const newTitle = 'Трубы ПНД и комплектующие для инженерных систем'
    const newContent = `Наша компания «АкваГазТех» специализируется на поставке качественных труб ПНД и полного спектра комплектующих для инженерных систем по всей России. Мы предлагаем широкий выбор труб различных диаметров и классов прочности для водопровода, канализации и газопровода.

В нашем каталоге представлены трубы ПНД от ведущих производителей, фитинги, запорная арматура и другие необходимые материалы для строительства наружных и внутренних сетей любой сложности. Все материалы соответствуют ГОСТам и имеют сертификаты качества. Мы работаем в Москве, Санкт-Петербурге и других городах России.

Каждая поставка включает полный комплект необходимых материалов и может быть адаптирована под ваш проект. Поставка материалов включает все этапы: от подбора ассортимента до доставки на объект. Гарантия качества на всю продукцию.`
    
    if (existing) {
      const updated = await prisma.catalogSeoTextConfig.update({
        where: { id: existing.id },
        data: {
          title: newTitle,
          content: newContent
        }
      })
      console.log('✅ SEO текст каталога обновлен:', updated.id)
      console.log('   Заголовок:', updated.title)
    } else {
      const created = await prisma.catalogSeoTextConfig.create({
        data: {
          title: newTitle,
          content: newContent
        }
      })
      console.log('✅ SEO текст каталога создан:', created.id)
    }

    console.log('✅ Обновление завершено успешно!')
  } catch (error) {
    console.error('❌ Ошибка при обновлении:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateCatalogSeoForPipes()
  .then(() => {
    console.log('🎉 Скрипт выполнен успешно')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Критическая ошибка:', error)
    process.exit(1)
  })
