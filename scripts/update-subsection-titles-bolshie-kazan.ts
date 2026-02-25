/**
 * Обновление названий:
 * - Казан + Барбекю: убрать "с 1 по 100"
 * - Большие комплексы VII, VIII, IX: переименовать в с 1 по 100, со 101 по 200, с 201 по 300
 * Запуск: npx tsx scripts/update-subsection-titles-bolshie-kazan.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const UPDATES: { slug: string; newTitle: string }[] = [
  { slug: 'kazan-barbeku-s-1-po-100-proekty', newTitle: 'Казан + Барбекю' },
  { slug: 'bolshie-kompleksy-barbeku-vii-s-601-po-700', newTitle: 'Большие комплексы с 1 по 100 проект' },
  { slug: 'bolshie-kompleksy-barbeku-viii-s-701-po-800', newTitle: 'Большие комплексы со 101 по 200 проект' },
  { slug: 'bolshie-kompleksy-barbeku-ix-s-801-po-900', newTitle: 'Большие комплексы с 201 по 300 проект' },
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
