/**
 * Удаление дубликата раздела «Отопительно-варочные печи» (с маленьких букв).
 * Оставляет раздел «ОТОПИТЕЛЬНО-ВАРОЧНЫЕ ПЕЧИ» (заглавные).
 * Запуск: npx tsx scripts/remove-duplicate-ovp-section.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Находим раздел с названием «Отопительно-варочные печи» (первая буква заглавная, остальные строчные)
  const toDelete = await prisma.catalogSection.findFirst({
    where: { title: 'Отопительно-варочные печи' },
    include: { subsections: true }
  })

  if (!toDelete) {
    console.log('Дубликат не найден (раздел «Отопительно-варочные печи» отсутствует)')
    return
  }

  // Находим раздел «ОТОПИТЕЛЬНО-ВАРОЧНЫЕ ПЕЧИ» для переноса проектов
  const toKeep = await prisma.catalogSection.findFirst({
    where: { title: 'ОТОПИТЕЛЬНО-ВАРОЧНЫЕ ПЕЧИ' },
    include: { subsections: { where: { slug: 'ovp' } } }
  })

  const keepSubsection = toKeep?.subsections[0]

  for (const sub of toDelete.subsections) {
    const projectCount = await prisma.project.count({ where: { subsectionId: sub.id } })
    if (projectCount > 0 && keepSubsection) {
      await prisma.project.updateMany({
        where: { subsectionId: sub.id },
        data: { subsectionId: keepSubsection.id }
      })
      console.log(`Перенесено проектов: ${projectCount}`)
    }
    await prisma.catalogSubsection.delete({ where: { id: sub.id } })
  }

  await prisma.catalogSection.delete({ where: { id: toDelete.id } })
  console.log('Удалён дубликат: Отопительно-варочные печи')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
