/**
 * Убирает "с 1 по 100" из названий подразделов Каминопечи и Русские печи.
 * Запуск: npx tsx scripts/update-subsection-titles.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const UPDATES: { slug: string; newTitle: string }[] = [
  { slug: 'russkie-pechi-s-1-po-100-proekt', newTitle: 'Русские печи' },
  { slug: 'kaminopechi-s-1-po-100-proekty', newTitle: 'Каминопечи' },
  { slug: 'bannye-pechi-i-s-1-po-100-proekty', newTitle: 'Банные печи' },
]

async function main() {
  for (const { slug, newTitle } of UPDATES) {
    const sub = await prisma.catalogSubsection.findFirst({ where: { slug } })
    if (sub) {
      await prisma.catalogSubsection.update({
        where: { id: sub.id },
        data: { title: newTitle, updatedAt: new Date() },
      })
      console.log(`Обновлено: "${sub.title}" -> "${newTitle}"`)
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
