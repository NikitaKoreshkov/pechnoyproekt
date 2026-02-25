/**
 * Синхронизация ОП (Отопительные печи): замена фото на сайте из kwork_photos.
 * Парсер не трогаем.
 *
 * - Копирует фото из kwork_photos/ОП в public/images/op/
 * - Удаляет доп. фото, оставляет только main + photo2 из kwork
 * - Удаляет проекты, для которых нет фото в kwork
 *
 * Запуск: npx tsx scripts/sync-op-from-kwork.ts
 * Проверка: npx tsx scripts/sync-op-from-kwork.ts --dry-run
 */
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

const BASE = path.join(process.cwd())
const KWORK = path.join(BASE, 'kwork_photos', 'ОП')
const PUBLIC_OP = path.join(BASE, 'public', 'images', 'op')

function getKworkProjectNumbers(): Set<number> {
  const nums = new Set<number>()
  if (!fs.existsSync(KWORK)) return nums
  const reWithNum = /^Отопительная(\d+)[ab]?\.(jpg|jpeg|png)$/i
  const reNoNum = /^Отопительная[ab]\.(jpg|jpeg|png)$/i
  for (const f of fs.readdirSync(KWORK)) {
    const m = f.match(reWithNum)
    if (m) nums.add(parseInt(m[1], 10))
    else if (reNoNum.test(f)) nums.add(1)
  }
  return nums
}

function getKworkPhotoPath(num: number, variant: 'a' | 'b' = 'a'): string | null {
  const suffix = num === 1 ? '' : String(num)
  for (const ext of ['.jpg', '.jpeg', '.png']) {
    const p = path.join(KWORK, `Отопительная${suffix}${variant}${ext}`)
    if (fs.existsSync(p)) return p
  }
  return null
}

function folderToNumber(folderName: string): number | null {
  if (folderName === 'ОП') return 1
  const m = folderName.match(/^ОП_(\d+)$/)
  return m ? parseInt(m[1], 10) : null
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  if (dryRun) console.log('=== РЕЖИМ ПРОВЕРКИ (--dry-run) ===\n')

  const kworkNums = getKworkProjectNumbers()
  console.log(`В kwork_photos/ОП: ${kworkNums.size} проектов\n`)

  let updated = 0
  let deleted = 0

  const subsection = await prisma.catalogSubsection.findFirst({
    where: { slug: 'op' },
    include: { projects: true },
  })
  if (!subsection) {
    console.log('Подраздел op не найден')
    return
  }

  if (kworkNums.has(1)) {
    const hasOp1 = subsection.projects.some((p) => /\/op\/ОП\//.test(p.image || ''))
    if (!hasOp1) {
      const template = subsection.projects.find((p) => p.image?.includes('ОП_2'))
      if (template && !dryRun) {
        const srcA = getKworkPhotoPath(1, 'a')
        const srcB = getKworkPhotoPath(1, 'b')
        if (srcA) {
          const folderName = 'ОП'
          const destDir = path.join(PUBLIC_OP, folderName)
          fs.mkdirSync(destDir, { recursive: true })
          const ext = path.extname(srcA)
          fs.copyFileSync(srcA, path.join(destDir, `main${ext}`))
          const mainUrl = `/images/op/${folderName}/main${ext}`
          const images: string[] = []
          if (srcB) {
            fs.copyFileSync(srcB, path.join(destDir, `photo2${ext}`))
            images.push(`/images/op/${folderName}/photo2${ext}`)
          }
          await prisma.project.create({
            data: {
              id: `proj-op-pech-${Date.now()}`,
              slug: 'op-pech',
              subsectionId: subsection.id,
              subsubsectionId: null,
              title: 'Отопительная печь',
              area: template.area,
              priceFrom: template.priceFrom,
              priceTo: template.priceTo,
              floors: template.floors,
              material: template.material,
              buildTime: template.buildTime,
              completion: template.completion,
              region: template.region,
              image: mainUrl,
              images,
              tags: template.tags,
              hasTerrasse: template.hasTerrasse,
              hasBath: template.hasBath,
              hasGarage: template.hasGarage,
              features: template.features,
              description: template.description,
              advantages: template.advantages,
              technicalSpecs: template.technicalSpecs,
              specs: template.specs,
              filterValues: template.filterValues,
              videoUrl: template.videoUrl,
              updatedAt: new Date(),
            },
          })
          console.log('  Создан: op-pech (Отопительная печь, проект 1)')
          updated++
        }
      } else if (dryRun) {
        console.log('  [DRY] Создать: op-pech (Отопительная печь)')
        updated++
      }
    }
  }

  let currentSubsection = await prisma.catalogSubsection.findFirst({
    where: { slug: 'op' },
    include: { projects: true },
  })!

  console.log(`\n📁 op (${currentSubsection.projects.length} проектов)`)

  for (const proj of currentSubsection.projects) {
    const folderMatch = proj.image?.match(/\/op\/([^/]+)\//)
    const folderName = folderMatch ? folderMatch[1] : null
    if (!folderName) {
      console.log(`  Пропуск: ${proj.slug}`)
      continue
    }

    const num = folderToNumber(folderName)
    if (num === null) {
      if (dryRun) console.log(`  [DRY] УДАЛИТЬ: ${proj.slug}`)
      else {
        await prisma.popularItem.updateMany({ where: { projectSlug: proj.slug }, data: { projectSlug: null } })
        await prisma.project.delete({ where: { id: proj.id } })
        const dir = path.join(PUBLIC_OP, folderName)
        if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true })
        console.log(`  Удалён: ${proj.slug}`)
      }
      deleted++
      continue
    }

    if (!kworkNums.has(num)) {
      if (dryRun) console.log(`  [DRY] УДАЛИТЬ (нет в kwork): ${proj.slug}`)
      else {
        await prisma.popularItem.updateMany({ where: { projectSlug: proj.slug }, data: { projectSlug: null } })
        await prisma.project.delete({ where: { id: proj.id } })
        const dir = path.join(PUBLIC_OP, folderName)
        if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true })
        console.log(`  Удалён: ${proj.slug}`)
      }
      deleted++
      continue
    }

    const srcA = getKworkPhotoPath(num, 'a')
    if (!srcA) {
      console.log(`  ОШИБКА: нет файла для ${proj.slug}`)
      continue
    }

    const destDir = path.join(PUBLIC_OP, folderName)
    if (!dryRun) fs.mkdirSync(destDir, { recursive: true })

    const ext = path.extname(srcA)
    const mainPath = path.join(destDir, `main${ext}`)

    if (dryRun) {
      console.log(`  [DRY] Обновить: ${proj.slug} <- Отопительная${num === 1 ? '' : num}a${ext}`)
    } else {
      fs.copyFileSync(srcA, mainPath)
      const mainUrl = `/images/op/${folderName}/main${ext}`

      const srcB = getKworkPhotoPath(num, 'b')
      const newImages: string[] = []
      if (srcB) {
        const photoBPath = path.join(destDir, `photo2${ext}`)
        fs.copyFileSync(srcB, photoBPath)
        newImages.push(`/images/op/${folderName}/photo2${ext}`)
      }

      for (const f of fs.readdirSync(destDir)) {
        if (f !== `main${ext}` && f !== `photo2${ext}`) {
          fs.unlinkSync(path.join(destDir, f))
        }
      }

      await prisma.project.update({
        where: { id: proj.id },
        data: { image: mainUrl, images: newImages, updatedAt: new Date() },
      })
      console.log(`  Обновлён: ${proj.slug}`)
    }
    updated++
  }

  console.log(`\n✅ Готово: обновлено ${updated}, удалено ${deleted}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
