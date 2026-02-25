/**
 * Удаляет пустые подразделы каталога: Каминопечи II (101-200) и Печи с камином.
 * Запуск: npx tsx scripts/remove-empty-subsections.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SLUGS_TO_REMOVE = ['kaminopechi-s-101-po-200-proekty', 'pechi-s-kaminom', 'bannye-pechi-ii-s-101-po-200-proekty']

async function main() {
  for (const slug of SLUGS_TO_REMOVE) {
    const sub = await prisma.catalogSubsection.findFirst({ where: { slug } })
    if (sub) {
      const count = await prisma.project.count({ where: { subsectionId: sub.id } })
      await prisma.catalogSubsection.delete({ where: { id: sub.id } })
      console.log(`Удалён: ${sub.title} (slug: ${slug}, было проектов: ${count})`)
    } else {
      console.log(`Не найден: ${slug}`)
    }
  }
  console.log('Готово')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
