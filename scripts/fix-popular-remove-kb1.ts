/**
 * КБ 1 удалён при синхронизации (нет фото в kwork).
 * Заменяем в «Популярные» на КБ 2.
 * Запуск: npx tsx scripts/fix-popular-remove-kb1.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const kb1Item = await prisma.popularItem.findFirst({
    where: { title: 'КБ 1' },
  })
  if (!kb1Item) {
    console.log('PopularItem «КБ 1» не найден')
    return
  }

  const kb2 = await prisma.project.findFirst({
    where: { title: 'КБ 2' },
  })
  if (!kb2) {
    console.log('Проект КБ 2 не найден, удаляю КБ 1 из популярных')
    await prisma.popularItem.delete({ where: { id: kb1Item.id } })
    console.log('Удалено')
    return
  }

  await prisma.popularItem.update({
    where: { id: kb1Item.id },
    data: {
      title: 'КБ 2',
      projectSlug: kb2.slug,
      image: kb2.image,
      images: kb2.images || [],
      priceFrom: kb2.priceFrom ?? 4000,
      area: kb2.area ?? 20,
      material: kb2.material ?? 'Кирпич',
      updatedAt: new Date(),
    },
  })
  console.log('Заменено: КБ 1 -> КБ 2 в популярных')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
