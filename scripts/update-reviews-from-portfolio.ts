/**
 * Обновление отзывов на основе проектов из «Воплощённые объекты»
 * Берёт фото и инфо из кладка + типы печей, формирует реалистичные отзывы
 *
 * Запуск: npx tsx scripts/update-reviews-from-portfolio.ts
 */

import { PrismaClient } from '@prisma/client'
import { getKladkaProjects, getTypeProjects } from '@/lib/parser-data'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

const CITIES = [
  'Москва',
  'Санкт-Петербург',
  'Колтуши',
  'Всеволожск',
  'Екатеринбург',
  'Нижний Новгород',
  'Казань',
  'Новосибирск',
  'Краснодар',
  'Сочи',
]

const NAMES = [
  'Андрей К.',
  'Ольга М.',
  'Дмитрий В.',
  'Елена С.',
  'Сергей П.',
  'Марина Т.',
  'Игорь Н.',
  'Наталья Л.',
  'Алексей К.',
  'Татьяна Р.',
]

function pick<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

function reviewTextFromProject(projectName: string, description: string, category: 'kladka' | 'types'): string {
  const shortDesc = description.split('.')[0]?.trim() || ''
  const templates: Record<string, string[]> = {
    kladka: [
      `Заказывали ${projectName}. Всё сделано качественно и в срок. ${shortDesc}. Очень довольны результатом, рекомендуем!`,
      `Проект «${projectName}» реализовали на высшем уровне. Кладка аккуратная, материалы добротные. Спасибо мастерам!`,
      `Спасибо за ${projectName}! Работа выполнена в срок, получилось ещё лучше, чем ожидали. Обязательно обратимся снова.`,
      `Долго выбирали исполнителя — не прогадали. ${projectName} сделали на совесть. Кирпич отличный, настоящие профессионалы.`,
      `Очень довольны нашим ${projectName}. ${shortDesc}. Всё на совесть, видно что люди в своём деле. Спасибо!`,
    ],
    types: [
      `Консультировались по ${projectName}. Объяснили всё понятно, помогли подобрать оптимальный вариант под наш участок.`,
      `Интересовались ${projectName} — посмотрели примеры на сайте, очень впечатлило. Планируем заказывать в следующем сезоне.`,
      `Спасибо за информацию по ${projectName}. Полезно было посмотреть готовые решения перед заказом.`,
    ],
  }
  const list = templates[category]
  return list[Math.floor(Math.random() * list.length)]
}

async function main() {
  console.log('🔄 Загрузка проектов из Воплощённые объекты...')

  const [kladkaProjects, typeProjects] = await Promise.all([
    getKladkaProjects(),
    getTypeProjects(),
  ])

  const projectsWithImages = [
    ...kladkaProjects.filter((p) => p.image).map((p) => ({ ...p, category: 'kladka' as const })),
    ...typeProjects.filter((p) => p.image).slice(0, 3).map((p) => ({ ...p, category: 'types' as const })),
  ]

  if (projectsWithImages.length === 0) {
    console.warn('⚠️ Нет проектов с изображениями. Проверьте парсер/кладка и парсер/типы_печей.')
    return
  }

  const usedNames = new Set<string>()
  const usedCities = new Set<string>()
  const availableNames = [...NAMES]
  const availableCities = [...CITIES]

  const reviews = projectsWithImages.slice(0, 10).map((proj, i) => {
    const name = availableNames[i % availableNames.length]
    const city = availableCities[i % availableCities.length]
    usedNames.add(name)
    usedCities.add(city)

    return {
      id: randomUUID(),
      name,
      city,
      text: reviewTextFromProject(proj.name, proj.description || '', proj.category),
      image: proj.image,
      date: new Date(2024, 10 - (i % 4), 15 - (i % 10)),
    }
  })

  console.log(`📝 Создано ${reviews.length} отзывов на основе проектов:`)
  reviews.forEach((r, i) => console.log(`   ${i + 1}. ${r.name}, ${r.city} — «${r.text.slice(0, 50)}...»`))

  await prisma.$transaction(async (tx) => {
    await tx.review.deleteMany({})
    for (const r of reviews) {
      await tx.review.create({
        data: {
          id: r.id,
          name: r.name,
          city: r.city,
          text: r.text,
          image: r.image,
          date: r.date,
          updatedAt: new Date(),
        },
      })
    }
  })

  console.log('✅ Отзывы сохранены в БД')

  const revConfig = await prisma.reviewsConfig.findFirst()
  const newDescription =
    'Мы собрали часть отзывов — чтобы вы могли увидеть качество кладки и готовые объекты на практике.\n\nОстальные отзывы можно посмотреть по запросу или в наших соцсетях.'

  if (revConfig) {
    await prisma.reviewsConfig.update({
      where: { id: revConfig.id },
      data: {
        title: 'Реальные фото и отзывы наших клиентов',
        description: newDescription,
        updatedAt: new Date(),
      },
    })
    console.log('✅ ReviewsConfig обновлён')
  } else {
    await prisma.reviewsConfig.create({
      data: {
        id: 'default',
        title: 'Реальные фото и отзывы наших клиентов',
        description: newDescription,
        updatedAt: new Date(),
      },
    })
    console.log('✅ ReviewsConfig создан')
  }

  console.log('\n🎉 Готово!')
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
