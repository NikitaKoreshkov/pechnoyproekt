/**
 * 1. Удаляет пустые дубли из раздела Барбекю
 * 2. Переносит подразделы с проектами из «Большие комплексы» в «Барбекю»
 * 3. Удаляет пустой раздел «Большие комплексы»
 *
 * Запуск: npx tsx scripts/fix-barbekue-remove-duplicates-move-bolshie.ts
 * Dry-run: DRY_RUN=1 npx tsx scripts/fix-barbekue-remove-duplicates-move-bolshie.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const DRY_RUN = process.env.DRY_RUN === '1'

const BARBEKUE_SLUGS = ['barbekyu-mangaly-kompleksy', 'barbekyu-mangaly-kompleksy-dlya-gotovki', 'mangaly-barbekyu']
const BOLSHIE_SLUG = 'bolshie-kompleksy'

async function getProjectCount(sub: { projects: { id: string }[]; subsubsections: { projects: { id: string }[] }[] }) {
  const direct = sub.projects?.length ?? 0
  const inSub = sub.subsubsections?.reduce((a, ss) => a + (ss.projects?.length ?? 0), 0) ?? 0
  return direct + inSub
}

async function main() {
  console.log(DRY_RUN ? '🔍 Dry-run\n' : '🔄 Удаление дублей + перенос Больших комплексов в Барбекю\n')

  const barbekue = await prisma.catalogSection.findFirst({
    where: { slug: { in: BARBEKUE_SLUGS } },
    include: {
      subsections: {
        include: {
          subsubsections: true,
          _count: { select: { projects: true } }
        }
      }
    }
  })
  const bolshie = await prisma.catalogSection.findFirst({
    where: { slug: BOLSHIE_SLUG },
    include: { subsections: { include: { subsubsections: true } } }
  })

  if (!barbekue) {
    console.log('❌ Раздел барбекю не найден')
    return
  }

  // 1. Удалить пустые дубли из barbekue (0 проектов)
  const toDelete: typeof barbekue.subsections = []
  for (const sub of barbekue.subsections) {
    const direct = await prisma.project.count({ where: { subsectionId: sub.id } })
    const subIds = (sub.subsubsections || []).map((ss) => ss.id)
    const inSub = subIds.length > 0 ? await prisma.project.count({ where: { subsubsectionId: { in: subIds } } }) : 0
    if (direct + inSub === 0) toDelete.push(sub)
  }

  console.log('📋 Пустые дубли для удаления:', toDelete.length)
  for (const sub of toDelete) {
    if (DRY_RUN) {
      console.log('   [DRY] удалить:', sub.slug)
    } else {
      await prisma.catalogSubsubsection.deleteMany({ where: { subsectionId: sub.id } })
      await prisma.catalogSubsection.delete({ where: { id: sub.id } })
      console.log('   ✓ удалён:', sub.slug)
    }
  }

  // 2. Перенести подразделы из Большие комплексы в Барбекю
  if (!bolshie || bolshie.subsections.length === 0) {
    console.log('\n✅ Раздел Большие комплексы пуст или не найден')
    return
  }

  const maxOrder = Math.max(-1, ...barbekue.subsections.filter((s) => !toDelete.find((d) => d.id === s.id)).map((s) => s.order))
  let nextOrder = maxOrder + 1

  console.log('\n📦 Перенос подразделов из Большие комплексы:')
  for (const sub of bolshie.subsections) {
    if (DRY_RUN) {
      console.log('   [DRY]', sub.slug, '-> order', nextOrder)
    } else {
      await prisma.catalogSubsection.update({
        where: { id: sub.id },
        data: { sectionId: barbekue.id, order: nextOrder, updatedAt: new Date() }
      })
      console.log('   ✓', sub.title)
    }
    nextOrder++
  }

  if (!DRY_RUN) {
    await prisma.catalogSection.delete({ where: { id: bolshie.id } })
    console.log('\n   Удалён раздел: БОЛЬШИЕ КОМПЛЕКСЫ')
  }

  console.log('\n✅ Готово.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
