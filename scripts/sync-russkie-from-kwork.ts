/**
 * Синхронизация Русские печи: замена фото на сайте (public/images + БД) из kwork_photos.
 * Парсер не трогаем.
 *
 * - Копирует фото из kwork_photos/Русские в public/images/russkie-1/
 * - Обновляет image и images в БД
 * - Удаляет проекты из БД и public, для которых нет фото в kwork
 *
 * Запуск: npx tsx scripts/sync-russkie-from-kwork.ts
 * Проверка: npx tsx scripts/sync-russkie-from-kwork.ts --dry-run
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

const BASE = path.join(process.cwd())
const KWORK = path.join(BASE, 'kwork_photos', 'Русские')
const PUBLIC_RUSSKIE = path.join(BASE, 'public', 'images')

const SUBSECTIONS = [
  { slug: 'russkie-pechi-s-1-po-100-proekt', imgDir: 'russkie-1' },
]

function getKworkProjectNumbers(): Set<number> {
  const nums = new Set<number>()
  if (!fs.existsSync(KWORK)) return nums
  const reWithNum = /^Русская(\d+)[abgv]?\.(jpg|jpeg|png)$/i
  const reNoNum = /^Русская[ab]\.(jpg|jpeg|png)$/i
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
    const p = path.join(KWORK, `Русская${suffix}${variant}${ext}`)
    if (fs.existsSync(p)) return p
  }
  return null
}

function folderToNumber(folderName: string): number | null {
  if (folderName === 'Русская_91') return 91
  if (folderName === 'Русская_печь') return 1
  const m = folderName.match(/^Русская_печь_(\d+)$/)
  return m ? parseInt(m[1], 10) : null
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  if (dryRun) console.log('=== РЕЖИМ ПРОВЕРКИ (--dry-run) ===\n')

  const kworkNums = getKworkProjectNumbers()
  console.log(`В kwork_photos/Русские: ${kworkNums.size} проектов\n`)

  let updated = 0
  let deleted = 0

  for (const sub of SUBSECTIONS) {
    let subsection = await prisma.catalogSubsection.findFirst({
      where: { slug: sub.slug },
      include: { projects: true },
    })
    if (!subsection) continue

    const publicDir = path.join(PUBLIC_RUSSKIE, sub.imgDir)

    if (sub.slug === 'russkie-pechi-s-1-po-100-proekt' && kworkNums.has(1)) {
      const hasPech1 = subsection.projects.some((p) => p.image?.includes('/Русская_печь/'))
      if (!hasPech1) {
        const template = subsection.projects.find((p) => p.image?.includes('Русская_печь_2'))
        if (template && !dryRun) {
          const srcA = getKworkPhotoPath(1, 'a')
          const srcB = getKworkPhotoPath(1, 'b')
          if (srcA) {
            const folderName = 'Русская_печь'
            const destDir = path.join(publicDir, folderName)
            fs.mkdirSync(destDir, { recursive: true })
            const ext = path.extname(srcA)
            fs.copyFileSync(srcA, path.join(destDir, `main${ext}`))
            const mainUrl = `/images/${sub.imgDir}/${folderName}/main${ext}`
            const images: string[] = []
            if (srcB) {
              fs.copyFileSync(srcB, path.join(destDir, `photo2${ext}`))
              images.push(`/images/${sub.imgDir}/${folderName}/photo2${ext}`)
            }
            await prisma.project.create({
              data: {
                id: `proj-russkie-russkaya-pech-${Date.now()}`,
                slug: 'russkie-russkaya-pech',
                subsectionId: subsection.id,
                subsubsectionId: null,
                title: 'Русская печь',
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
            console.log('\n📁 russkie-pechi-s-1-po-100-proekt')
            console.log('  Создан: russkie-russkaya-pech (Русская печь, проект 1)')
            updated++
            subsection = await prisma.catalogSubsection.findFirst({
              where: { slug: sub.slug },
              include: { projects: true },
            })!
          }
        } else if (dryRun && !hasPech1) {
          console.log('\n📁 russkie-pechi-s-1-po-100-proekt')
          console.log('  [DRY] Создать: russkie-russkaya-pech (Русская печь)')
          updated++
        }
      }
    }

    console.log(`\n📁 ${sub.slug} (${subsection!.projects.length} проектов)`)

    for (const proj of subsection!.projects) {
      const folderMatch = proj.image.match(/\/russkie-[12]\/([^/]+)\//)
      const folderName = folderMatch ? folderMatch[1] : null
      if (!folderName) {
        console.log(`  Пропуск (нет папки в image): ${proj.slug}`)
        continue
      }

      const num = folderToNumber(folderName)
      if (num === null) {
        if (dryRun) {
          console.log(`  [DRY] УДАЛИТЬ (неизвестный формат): ${proj.slug}`)
        } else {
          await prisma.popularItem.updateMany({ where: { projectSlug: proj.slug }, data: { projectSlug: null } })
          await prisma.project.delete({ where: { id: proj.id } })
          const dir = path.join(publicDir, folderName)
          if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true })
          console.log(`  Удалён: ${proj.slug}`)
        }
        deleted++
        continue
      }

      if (!kworkNums.has(num)) {
        if (dryRun) {
          console.log(`  [DRY] УДАЛИТЬ (нет в kwork): ${proj.slug}`)
        } else {
          await prisma.popularItem.updateMany({ where: { projectSlug: proj.slug }, data: { projectSlug: null } })
          await prisma.project.delete({ where: { id: proj.id } })
          const dir = path.join(publicDir, folderName)
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

      const destDir = path.join(publicDir, folderName)
      if (!dryRun) fs.mkdirSync(destDir, { recursive: true })

      const ext = path.extname(srcA)
      const mainPath = path.join(destDir, `main${ext}`)

      if (dryRun) {
        console.log(`  [DRY] Обновить: ${proj.slug} <- Русская${num}a${ext} (удалить доп. фото)`)
      } else {
        fs.copyFileSync(srcA, mainPath)
        const mainUrl = `/images/${sub.imgDir}/${folderName}/main${ext}`

        const srcB = getKworkPhotoPath(num, 'b')
        const newImages: string[] = []
        if (srcB) {
          const photoBPath = path.join(destDir, `photo2${ext}`)
          fs.copyFileSync(srcB, photoBPath)
          newImages.push(`/images/${sub.imgDir}/${folderName}/photo2${ext}`)
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
  }

  console.log(`\n✅ Готово: обновлено ${updated}, удалено ${deleted}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
