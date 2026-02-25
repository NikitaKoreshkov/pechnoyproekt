/**
 * Удаляет подраздел "Русские печи со 101 по 200 проект" из каталога (в БД нет проектов).
 * Запуск: npx tsx scripts/remove-russkie-101-200.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const sub = await prisma.catalogSubsection.findFirst({
    where: { slug: 'russkie-pechi-so-101-po-200-proekt' },
  })
  if (!sub) {
    console.log('Подраздел не найден')
    return
  }
  await prisma.catalogFiltersConfig.deleteMany({ where: { subsectionId: sub.id } })
  await prisma.catalogSubsection.delete({ where: { id: sub.id } })
  console.log('Удалён подраздел "Русские печи со 101 по 200 проект"')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
