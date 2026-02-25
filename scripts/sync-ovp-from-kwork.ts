/**
 * Синхронизация ОВП (Отопительно-варочные печи): замена фото на сайте из kwork_photos.
 * Парсер не трогаем.
 *
 * - Копирует фото из kwork_photos/ОВП в public/images/ovp/
 * - Удаляет доп. фото, оставляет только main + photo2 из kwork
 * - Удаляет проекты, для которых нет фото в kwork
 *
 * Запуск: npx tsx scripts/sync-ovp-from-kwork.ts
 * Проверка: npx tsx scripts/sync-ovp-from-kwork.ts --dry-run
 */
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

const BASE = path.join(process.cwd())
const KWORK = path.join(BASE, 'kwork_photos', 'ОВП')
const PUBLIC_OVP = path.join(BASE, 'public', 'images', 'ovp')

function getKworkProjectNumbers(): Set<number> {
  const nums = new Set<number>()
  if (!fs.existsSync(KWORK)) return nums
  const reWithNum = /^Отопительно_варочная(\d+)[ab]?\.(jpg|jpeg|png)$/i
  const reNoNum = /^Отопительно_варочная[ab]\.(jpg|jpeg|png)$/i
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
    const p = path.join(KWORK, `Отопительно_варочная${suffix}${variant}${ext}`)
    if (fs.existsSync(p)) return p
  }
  return null
}

function folderToNumber(folderName: string): number | null {
  if (folderName === 'ОВП') return 1
  const m = folderName.match(/^ОВП_(\d+)$/)
  return m ? parseInt(m[1], 10) : null
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  if (dryRun) console.log('=== РЕЖИМ ПРОВЕРКИ (--dry-run) ===\n')

  const kworkNums = getKworkProjectNumbers()
  console.log(`В kwork_photos/ОВП: ${kworkNums.size} проектов\n`)

  let updated = 0
  let deleted = 0

  const subsection = await prisma.catalogSubsection.findFirst({
    where: { slug: 'ovp' },
    include: { projects: true },
  })
  if (!subsection) {
    console.log('Подраздел ovp не найден')
    return
  }

  if (kworkNums.has(1)) {
    const hasOvp1 = subsection.projects.some((p) => /\/ovp\/ОВП\//.test(p.image || ''))
    if (!hasOvp1) {
      const template = subsection.projects.find((p) => p.image?.includes('ОВП_2'))
      if (template && !dryRun) {
        const srcA = getKworkPhotoPath(1, 'a')
        const srcB = getKworkPhotoPath(1, 'b')
        if (srcA) {
          const folderName = 'ОВП'
          const destDir = path.join(PUBLIC_OVP, folderName)
          fs.mkdirSync(destDir, { recursive: true })
          const ext = path.extname(srcA)
          fs.copyFileSync(srcA, path.join(destDir, `main${ext}`))
          const mainUrl = `/images/ovp/${folderName}/main${ext}`
          const images: string[] = []
          if (srcB) {
            fs.copyFileSync(srcB, path.join(destDir, `photo2${ext}`))
            images.push(`/images/ovp/${folderName}/photo2${ext}`)
          }
          await prisma.project.create({
            data: {
              id: `proj-ovp-pech-${Date.now()}`,
              slug: 'ovp-pech',
              subsectionId: subsection.id,
              subsubsectionId: null,
              title: 'Отопительно-варочная печь',
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
          console.log('  Создан: ovp-pech (Отопительно-варочная печь, проект 1)')
          updated++
        }
      } else if (dryRun) {
        console.log('  [DRY] Создать: ovp-pech (Отопительно-варочная печь)')
        updated++
      }
    }
  }

  let currentSubsection = await prisma.catalogSubsection.findFirst({
    where: { slug: 'ovp' },
    include: { projects: true },
  })!

  console.log(`\n📁 ovp (${currentSubsection.projects.length} проектов)`)

  for (const proj of currentSubsection.projects) {
    const folderMatch = proj.image.match(/\/ovp\/([^/]+)\//)
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
        const dir = path.join(PUBLIC_OVP, folderName)
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
        const dir = path.join(PUBLIC_OVP, folderName)
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

    const destDir = path.join(PUBLIC_OVP, folderName)
    if (!dryRun) fs.mkdirSync(destDir, { recursive: true })

    const ext = path.extname(srcA)
    const mainPath = path.join(destDir, `main${ext}`)

    if (dryRun) {
      console.log(`  [DRY] Обновить: ${proj.slug} <- Отопительно_варочная${num === 1 ? '' : num}a${ext}`)
    } else {
      fs.copyFileSync(srcA, mainPath)
      const mainUrl = `/images/ovp/${folderName}/main${ext}`

      const srcB = getKworkPhotoPath(num, 'b')
      const newImages: string[] = []
      if (srcB) {
        const photoBPath = path.join(destDir, `photo2${ext}`)
        fs.copyFileSync(srcB, photoBPath)
        newImages.push(`/images/ovp/${folderName}/photo2${ext}`)
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
