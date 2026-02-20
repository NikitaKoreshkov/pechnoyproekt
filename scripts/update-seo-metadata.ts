/**
 * Скрипт для обновления SEO метаданных в БД под тему труб ПНД
 * Запуск: npx tsx scripts/update-seo-metadata.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateSeoMetadata() {
  try {
    console.log('🔄 Начинаю обновление SEO метаданных...')

    const existing = await prisma.siteMetadataConfig.findFirst()
    
    if (existing) {
      console.log('📋 Текущие данные в БД:')
      console.log('   Заголовок:', existing.siteTitle)
      console.log('   Описание:', existing.siteDescription)
      console.log('   Ключевые слова:', existing.siteKeywords)
      
      const updated = await prisma.siteMetadataConfig.update({
        where: { id: existing.id },
        data: {
          siteTitle: 'Трубы ПНД и комплектующие | АкваГазТех',
          siteDescription: 'Поставка качественных труб ПНД (ПЭ) и комплектующих для водопровода, канализации и газопровода. Широкий ассортимент, быстрая доставка, гарантия качества.',
          siteKeywords: 'трубы ПНД, трубы ПЭ, комплектующие для труб, водопровод, канализация, газопровод, фитинги, Москва, Россия, Санкт-Петербург, Ленинградская область'
        }
      })
      
      console.log('\n✅ Данные в БД обновлены:')
      console.log('   Заголовок:', updated.siteTitle)
      console.log('   Описание:', updated.siteDescription)
      console.log('   Ключевые слова:', updated.siteKeywords)
    } else {
      console.log('⚠️  Конфигурация метаданных не найдена в БД. Создаю новую...')
      const created = await prisma.siteMetadataConfig.create({
        data: {
          siteTitle: 'Трубы ПНД и комплектующие | АкваГазТех',
          siteDescription: 'Поставка качественных труб ПНД (ПЭ) и комплектующих для водопровода, канализации и газопровода. Широкий ассортимент, быстрая доставка, гарантия качества.',
          siteKeywords: 'трубы ПНД, трубы ПЭ, комплектующие для труб, водопровод, канализация, газопровод, фитинги, Москва, Россия, Санкт-Петербург, Ленинградская область',
          ogImage: '/images/house.jpg'
        }
      })
      console.log('✅ Данные метаданных созданы:', created.id)
    }

    console.log('\n✅ Обновление завершено успешно!')
  } catch (error) {
    console.error('❌ Ошибка при обновлении:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateSeoMetadata()
  .then(() => {
    console.log('🎉 Скрипт выполнен успешно')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Критическая ошибка:', error)
    process.exit(1)
  })
