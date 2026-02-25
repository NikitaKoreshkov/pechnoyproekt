/**
 * Заменить популярные проекты на правильные: КБ 1, Барбекю 1, Комплекс барбекю 872, 871, 870, 869
 * Запуск: npx tsx scripts/seed-popular-projects-correct.ts
 */

import { PrismaClient } from '@prisma/client'
import * as path from 'path'
import * as fs from 'fs'

const prisma = new PrismaClient()
const PARSER = path.join(process.cwd(), 'парсер')

// Целевые проекты по порядку (как на референсе)
const TARGET_ITEMS = [
  { title: 'КБ 1', priceFrom: 4000 },
  { title: 'Барбекю 1', priceFrom: 4000 },
  { title: 'Комплекс барбекю 872', priceFrom: 9000 },
  { title: 'Комплекс барбекю 871', priceFrom: 12000 },
  { title: 'Комплекс барбекю 870', priceFrom: 8000 },
  { title: 'Комплекс барбекю 869', priceFrom: 9000 },
]

function findFirstImage(projPath: string): string {
  const candidates = [
    path.join(projPath, 'снаружи', 'изображения'),
    path.join(projPath, 'внутри', 'изображения'),
    path.join(projPath, 'снаружи'),
    path.join(projPath, 'внутри'),
  ]
  for (const dir of candidates) {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) continue
    const files = fs.readdirSync(dir)
    const img = files.find((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
    if (img) {
      const rel = path.relative(PARSER, path.join(dir, img))
      return `/parser/${rel.replace(/\\/g, '/')}`
    }
  }
  return '/images/1.png'
}

function titleToFolder(title: string): string {
  return title.replace(/\s+/g, '_')
}

function findProjectPath(title: string): string | null {
  const folder = titleToFolder(title)
  const bases = [
    path.join(PARSER, 'Казан + Барбекю', 'Казан_+_Барбекю_с_1_по_100_проекты', 'проект', folder),
    path.join(PARSER, 'Мангалы (со столиками или мойками)', 'проект', folder),
    path.join(PARSER, 'Большие комплексы', 'Большие_комплексы_барбекю_IX_с_801_по_900', 'проект', folder),
  ]
  for (const p of bases) {
    if (fs.existsSync(p)) return p
  }
  return null
}

async function main() {
  console.log('🔄 Заменяю популярные проекты на КБ 1, Барбекю 1, Комплекс барбекю 872/871/870/869...\n')

  // Ищем проекты в БД по названию
  const allProjects = await prisma.project.findMany({
    select: { id: true, slug: true, title: true, image: true, area: true, material: true, priceFrom: true },
  })

  // Удаляем старые популярные
  await prisma.popularItem.deleteMany({})
  await prisma.popularPanel.deleteMany({})

  const panel = await prisma.popularPanel.create({
    data: {
      id: `panel-${Date.now()}`,
      title: 'Популярные проекты',
      order: 0,
      updatedAt: new Date(),
    },
  })

  for (let i = 0; i < TARGET_ITEMS.length; i++) {
    const item = TARGET_ITEMS[i]
    const project = allProjects.find(
      (p) =>
        p.title === item.title ||
        p.title?.toLowerCase() === item.title.toLowerCase()
    )
    const projPath = findProjectPath(item.title)
    const image = projPath ? findFirstImage(projPath) : project?.image || '/images/1.png'

    await prisma.popularItem.create({
      data: {
        id: `pop-${Date.now()}-${i}`,
        panelId: panel.id,
        title: item.title,
        image: project?.image || image,
        area: 20,
        material: 'Кирпич',
        priceFrom: project?.priceFrom ?? item.priceFrom,
        priceTo: null,
        projectSlug: project?.slug || null,
        order: i,
        updatedAt: new Date(),
      },
    })
    console.log(`   ✅ ${item.title} — ${project?.slug || 'без связи'} (${item.priceFrom} ₽)`)
  }

  console.log('\n🎉 Готово! Популярные проекты обновлены.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
