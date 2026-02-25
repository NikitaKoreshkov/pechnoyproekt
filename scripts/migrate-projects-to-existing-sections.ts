/**
 * Перенос проектов из новых разделов (созданных seed) в существующие разделы каталога.
 * Удаляет старые проекты из существующих подразделов и дублирующие разделы.
 *
 * Запуск: npx tsx scripts/migrate-projects-to-existing-sections.ts
 * Режим dry-run (только вывод): DRY_RUN=1 npx tsx scripts/migrate-projects-to-existing-sections.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const DRY_RUN = process.env.DRY_RUN === '1'

// Slugs новых подразделов (созданных seed) -> slugs существующих подразделов
// Если существующий подраздел имеет другой slug — укажи его здесь или в titles
const SUBSECTION_SLUG_MAP: Record<string, string> = {
  // Мангалы
  'mangaly-so-stolikami-ili-moikami': 'mangaly-so-stolikami-ili-moikami',
  // Казан
  'kazan-barbeku-s-1-po-100-proekty': 'kazan-barbeku-s-1-po-100-proekty',
  'kazan-barbeku-ii-s-101-po-200-proekty': 'kazan-barbeku-ii-s-101-po-200-proekty',
  // Большие комплексы
  'bolshie-kompleksy-s-1-po-100-proekt': 'bolshie-kompleksy-s-1-po-100-proekt',
  'bolshie-kompleksy-ii-s-101-po-200-proekt': 'bolshie-kompleksy-ii-s-101-po-200-proekt',
  'bolshie-kompleksy-iii-s-201-po-300-proekt': 'bolshie-kompleksy-iii-s-201-po-300-proekt',
  'bolshie-kompleksy-barbeku-iv-s-301-po-400-proekty': 'bolshie-kompleksy-barbeku-iv-s-301-po-400-proekty',
  'bolshie-kompleksy-v-s-401-po-500': 'bolshie-kompleksy-v-s-401-po-500',
  'bolshie-kompleksy-barbeku-vi-s-501-po-600': 'bolshie-kompleksy-barbeku-vi-s-501-po-600',
  'bolshie-kompleksy-barbeku-vii-s-601-po-700': 'bolshie-kompleksy-barbeku-vii-s-601-po-700',
  'bolshie-kompleksy-barbeku-viii-s-701-po-800': 'bolshie-kompleksy-barbeku-viii-s-701-po-800',
  'bolshie-kompleksy-barbeku-ix-s-801-po-900': 'bolshie-kompleksy-barbeku-ix-s-801-po-900'
}

// Slugs разделов, созданных seed (их можно удалить после переноса)
const NEW_SECTION_SLUGS = ['mangaly-so-stolikami-ili-moikami', 'kazan-barbeku', 'bolshie-kompleksy']

// Возможные slugs существующего раздела (или задай TARGET_SECTION в env)
const EXISTING_PARENT_SLUGS = [
  'barbekyu-mangaly-kompleksy',
  'barbekyu-mangaly-kompleksy-dlya-gotovki',
  'mangaly-barbekyu'
]

async function main() {
  console.log(DRY_RUN ? '🔍 Режим dry-run (изменения не применяются)\n' : '🔄 Миграция проектов в существующие разделы\n')

  const sections = await prisma.catalogSection.findMany({
    orderBy: { order: 'asc' },
    include: {
      subsections: { orderBy: { order: 'asc' }, include: { subsubsections: true } }
    }
  })

  console.log('📂 Текущая структура каталога:\n')
  for (const s of sections) {
    console.log(`  Раздел: ${s.title} (slug: ${s.slug}, id: ${s.id})`)
    for (const sub of s.subsections) {
      const projCount = await prisma.project.count({ where: { subsectionId: sub.id } })
      const subProjCount = await prisma.project.count({ where: { subsubsectionId: { in: sub.subsubsections.map(ss => ss.id) } } })
      console.log(`    └─ ${sub.title} (slug: ${sub.slug}, id: ${sub.id}) — проектов: ${projCount}, в подподразделах: ${subProjCount}`)
      for (const ss of sub.subsubsections) {
        const ssCount = await prisma.project.count({ where: { subsubsectionId: ss.id } })
        console.log(`        └─ ${ss.title} (slug: ${ss.slug}) — проектов: ${ssCount}`)
      }
    }
    console.log('')
  }

  // Ищем существующий "родительский" раздел
  const targetSlug = process.env.TARGET_SECTION
  let existingParent = targetSlug
    ? sections.find(s => s.slug === targetSlug)
    : sections.find(
        s => EXISTING_PARENT_SLUGS.includes(s.slug) ||
        /барбекю.*мангал|мангал.*комплекс|комплекс.*готовк/i.test(s.title)
      )
  if (!existingParent) {
    existingParent = sections.find(s => s.subsections.some(sub =>
      /мангал|казан|больш/i.test(sub.title)
    ) && !NEW_SECTION_SLUGS.includes(s.slug))
  }
  if (!existingParent) {
    console.log('⚠️  Не найден существующий раздел (БАРБЕКЮ, МАНГАЛЫ, КОМПЛЕКСЫ).')
    console.log('   Задай TARGET_SECTION=<slug> или добавь slug в EXISTING_PARENT_SLUGS.\n')
    console.log('   Доступные разделы:', sections.map(s => `${s.slug} (${s.title})`).join('\n   '))
    return
  }
  console.log(`\n✅ Выбран существующий раздел: ${existingParent.title} (${existingParent.slug})\n`)

  const existingSubsections = existingParent.subsections
  const existingBySlug = new Map(existingSubsections.map(s => [s.slug, s]))
  const existingById = new Map(existingSubsections.map(s => [s.id, s]))

  // Собираем все подразделы из "новых" разделов
  const newSections = sections.filter(s => NEW_SECTION_SLUGS.includes(s.slug))
  const projectsToMove: { projectId: string; slug: string; title: string; fromSubId: string; toSubId: string }[] = []
  const oldProjectIds: string[] = []

  const targetsToClear = new Set<string>()

  for (const sec of newSections) {
    for (const sub of sec.subsections) {
      const targetSlug = SUBSECTION_SLUG_MAP[sub.slug] ?? sub.slug
      let target = existingBySlug.get(targetSlug)
      if (!target) {
        const byTitle = existingSubsections.find(es =>
          es.title.toLowerCase().includes(sub.title.toLowerCase().slice(0, 20)) ||
          sub.title.toLowerCase().includes(es.title.toLowerCase().slice(0, 20))
        )
        target = byTitle || undefined
      }
      if (!target) {
        console.log(`   ⚠️  Нет соответствующего подраздела для "${sub.title}" (slug: ${sub.slug})`)
        continue
      }

      const projects = await prisma.project.findMany({ where: { subsectionId: sub.id }, select: { id: true, slug: true, title: true } })
      for (const p of projects) {
        projectsToMove.push({
          projectId: p.id,
          slug: p.slug,
          title: p.title,
          fromSubId: sub.id,
          toSubId: target.id
        })
      }

      if (sub.id !== target.id) {
        targetsToClear.add(target.id)
      }
    }
  }

  for (const targetId of targetsToClear) {
    const oldInTarget = await prisma.project.findMany({ where: { subsectionId: targetId }, select: { id: true } })
    oldProjectIds.push(...oldInTarget.map(p => p.id))
  }

  const uniqueOldIds = [...new Set(oldProjectIds)]
  console.log(`📦 Проектов к переносу: ${projectsToMove.length}`)
  console.log(`🗑️  Старых проектов к удалению в целевых подразделах: ${uniqueOldIds.length}`)

  if (projectsToMove.length === 0 && uniqueOldIds.length === 0) {
    console.log('\n   Нечего переносить. Возможно, структура уже совпадает или проекты не найдены.')
    return
  }

  if (!DRY_RUN) {
    if (uniqueOldIds.length > 0) {
      const deleted = await prisma.project.deleteMany({ where: { id: { in: uniqueOldIds } } })
      console.log(`\n   Удалено старых проектов: ${deleted.count}`)
    }
    let moved = 0
    for (const p of projectsToMove) {
      await prisma.project.update({
        where: { id: p.projectId },
        data: { subsectionId: p.toSubId, subsubsectionId: null, updatedAt: new Date() }
      })
      moved++
    }
    console.log(`   Перенесено проектов: ${moved}`)

    for (const sec of newSections) {
      const subIds = sec.subsections.map(s => s.id)
      const remaining = await prisma.project.count({ where: { subsectionId: { in: subIds } } })
      if (remaining === 0) {
        for (const sub of sec.subsections) {
          await prisma.catalogFiltersConfig.deleteMany({ where: { subsectionId: sub.id } })
        }
        await prisma.catalogSubsection.deleteMany({ where: { sectionId: sec.id } })
        await prisma.catalogSection.delete({ where: { id: sec.id } })
        console.log(`   Удалён дублирующий раздел: ${sec.title}`)
      }
    }
  }

  console.log('\n✅ Готово')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
