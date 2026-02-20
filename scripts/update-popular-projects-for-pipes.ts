/**
 * Скрипт для обновления популярных проектов под тематику продажи труб
 * Запуск: npx tsx scripts/update-popular-projects-for-pipes.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updatePopularProjectsForPipes() {
  try {
    console.log('🔄 Начинаю обновление популярных проектов под продажу труб...')

    // Удаляем все существующие популярные проекты
    await prisma.popularItem.deleteMany({})
    await prisma.popularPanel.deleteMany({})
    console.log('🗑️  Удалены все популярные проекты')

    // Получаем созданные проекты труб
    const pipeProjects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6
    })

    if (pipeProjects.length === 0) {
      console.log('⚠️  Нет проектов в базе. Сначала создайте проекты.')
      return
    }

    // Создаем панель популярных проектов
    const panel = await prisma.popularPanel.create({
      data: {
        title: 'Популярные проекты',
        order: 0,
        items: {
          create: pipeProjects.slice(0, 6).map((project, idx) => ({
            title: project.title,
            image: project.image,
            area: project.area,
            material: project.material,
            priceFrom: project.priceFrom,
            priceTo: project.priceTo,
            projectSlug: project.slug, // Связываем с реальным проектом
            order: idx,
            floors: project.floors,
            buildTime: project.buildTime,
            completion: project.completion,
            region: project.region,
            images: project.images || [],
            tags: project.tags || [],
            hasTerrasse: project.hasTerrasse,
            hasBath: project.hasBath,
            hasGarage: project.hasGarage,
            features: project.features || [],
            description: project.description,
            advantages: project.advantages || [],
            technicalSpecs: project.technicalSpecs,
            specs: project.specs,
            filterValues: project.filterValues
          }))
        }
      },
      include: { items: true }
    })

    console.log(`✅ Создана панель "Популярные проекты" с ${panel.items.length} проектами:`)
    panel.items.forEach((item, idx) => {
      console.log(`   ${idx + 1}. ${item.title} (${item.area} м, от ${item.priceFrom.toLocaleString()} ₽)`)
    })

    console.log('✅ Обновление популярных проектов завершено успешно!')
  } catch (error) {
    console.error('❌ Ошибка при обновлении популярных проектов:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updatePopularProjectsForPipes()
  .then(() => {
    console.log('🎉 Скрипт выполнен успешно')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Критическая ошибка:', error)
    process.exit(1)
  })
