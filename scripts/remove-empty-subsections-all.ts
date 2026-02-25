/**
 * Удаляет из каталога все подразделы с 0 проектов.
 * Запуск: npx tsx scripts/remove-empty-subsections-all.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const subsections = await prisma.catalogSubsection.findMany({
    include: { _count: { select: { projects: true } }, section: true },
  })
  const empty = subsections.filter((s) => s._count.projects === 0)
  console.log(`Найдено пустых подразделов: ${empty.length}\n`)
  for (const sub of empty) {
    await prisma.catalogSubsection.delete({ where: { id: sub.id } })
    console.log(`Удалён: ${sub.title} (slug: ${sub.slug})`)
  }
  console.log('\nГотово')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
