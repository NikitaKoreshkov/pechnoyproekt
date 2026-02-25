/**
 * Синхронизация Банные печи I (1-100) и Банные печи II (101-200) из kwork_photos.
 *
 * 1. Банные печи I: kwork_photos/Банные -> public/images/bannye-1
 * 2. Банные печи II: kwork_photos/Банные -> public/images/bannye-2
 *
 * Запуск: npx tsx scripts/sync-bannye-from-kwork.ts
 * Проверка: npx tsx scripts/sync-bannye-from-kwork.ts --dry-run
 */
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()
const BASE = path.join(process.cwd())

interface SubsectionConfig {
  slug: string
  imgDir: string
  kworkFolder: string
  kworkPrefix: string
  numMin: number
  numMax: number
  numFromFolder: (folderName: string) => number | null
  imagePathRegex: RegExp
}

const CONFIGS: SubsectionConfig[] = [
  {
    slug: 'bannye-pechi-i-s-1-po-100-proekty',
    imgDir: 'bannye-1',
    kworkFolder: 'Банные',
    kworkPrefix: 'Банная_печь',
    numMin: 1,
    numMax: 100,
    numFromFolder: (f) => {
      if (f === 'Банная_печь') return 1
      const m = f.match(/^Банная_печь_(\d+)/)
      return m ? parseInt(m[1], 10) : null
    },
    imagePathRegex: /\/bannye-1\/([^/]+)\//,
  },
  {
    slug: 'bannye-pechi-ii-s-101-po-200-proekty',
    imgDir: 'bannye-2',
    kworkFolder: 'Банные',
    kworkPrefix: 'Банная_печь',
    numMin: 101,
    numMax: 200,
    numFromFolder: (f) => {
      const m = f.match(/^Банная_печь_(\d+)/)
      return m ? parseInt(m[1], 10) : null
    },
    imagePathRegex: /\/bannye-2\/([^/]+)\//,
  },
]

function getKworkProjectNumbers(kworkDir: string, prefix: string, numMin: number, numMax: number): Set<number> {
  const nums = new Set<number>()
  if (!fs.existsSync(kworkDir)) return nums
  const reWithNum = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\d+)[abgv]?\\.(jpg|jpeg|png)$`, 'i')
  const reNoNum = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[ab]\\.(jpg|jpeg|png)$`, 'i')
  for (const f of fs.readdirSync(kworkDir)) {
    const m = f.match(reWithNum)
    if (m) {
      const n = parseInt(m[1], 10)
      if (n >= numMin && n <= numMax) nums.add(n)
    } else if (reNoNum.test(f) && numMin <= 1 && 1 <= numMax) nums.add(1)
  }
  return nums
}

function getKworkPhotoPath(kworkDir: string, prefix: string, num: number, variant: 'a' | 'b' = 'a'): string | null {
  const suffix = num === 1 ? '' : String(num)
  for (const ext of ['.jpg', '.jpeg', '.png']) {
    const p = path.join(kworkDir, `${prefix}${suffix}${variant}${ext}`)
    if (fs.existsSync(p)) return p
  }
  return null
}

async function processSubsection(config: SubsectionConfig, dryRun: boolean) {
  const kworkDir = path.join(BASE, 'kwork_photos', config.kworkFolder)
  const publicDir = path.join(BASE, 'public', 'images', config.imgDir)

  const kworkNums = getKworkProjectNumbers(kworkDir, config.kworkPrefix, config.numMin, config.numMax)
  console.log(`\n📁 ${config.slug} (kwork: ${config.kworkFolder}, в kwork: ${kworkNums.size} проектов)`)

  const subsection = await prisma.catalogSubsection.findFirst({
    where: { slug: config.slug },
    include: { projects: true },
  })
  if (!subsection) {
    console.log('  Подраздел не найден')
    return { updated: 0, deleted: 0 }
  }

  let updated = 0
  let deleted = 0

  for (const proj of subsection.projects) {
    const folderMatch = proj.image?.match(config.imagePathRegex)
    const folderName = folderMatch ? folderMatch[1] : null
    if (!folderName) {
      console.log(`  Пропуск: ${proj.slug}`)
      continue
    }

    const num = config.numFromFolder(folderName)
    if (num === null) {
      if (dryRun) console.log(`  [DRY] УДАЛИТЬ: ${proj.slug}`)
      else {
        await prisma.popularItem.updateMany({ where: { projectSlug: proj.slug }, data: { projectSlug: null } })
        await prisma.project.delete({ where: { id: proj.id } })
        const dir = path.join(publicDir, folderName)
        if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true })
        console.log(`  Удалён: ${proj.slug}`)
      }
      deleted++
      continue
    }

    if (num < config.numMin || num > config.numMax || !kworkNums.has(num)) {
      if (dryRun) console.log(`  [DRY] УДАЛИТЬ (нет в kwork): ${proj.slug}`)
      else {
        await prisma.popularItem.updateMany({ where: { projectSlug: proj.slug }, data: { projectSlug: null } })
        await prisma.project.delete({ where: { id: proj.id } })
        const dir = path.join(publicDir, folderName)
        if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true })
        console.log(`  Удалён: ${proj.slug}`)
      }
      deleted++
      continue
    }

    const srcA = getKworkPhotoPath(kworkDir, config.kworkPrefix, num, 'a')
    if (!srcA) {
      console.log(`  ОШИБКА: нет файла для ${proj.slug}`)
      continue
    }

    const destDir = path.join(publicDir, folderName)
    if (!dryRun) fs.mkdirSync(destDir, { recursive: true })

    const ext = path.extname(srcA)

    if (dryRun) {
      console.log(`  [DRY] Обновить: ${proj.slug} <- ${config.kworkPrefix}${num === 1 ? '' : num}a${ext}`)
    } else {
      fs.copyFileSync(srcA, path.join(destDir, `main${ext}`))
      const mainUrl = `/images/${config.imgDir}/${folderName}/main${ext}`

      const srcB = getKworkPhotoPath(kworkDir, config.kworkPrefix, num, 'b')
      const newImages: string[] = []
      if (srcB) {
        fs.copyFileSync(srcB, path.join(destDir, `photo2${ext}`))
        newImages.push(`/images/${config.imgDir}/${folderName}/photo2${ext}`)
      }

      for (const f of fs.readdirSync(destDir)) {
        if (f !== `main${ext}` && f !== `photo2${ext}`) fs.unlinkSync(path.join(destDir, f))
      }

      await prisma.project.update({
        where: { id: proj.id },
        data: { image: mainUrl, images: newImages, updatedAt: new Date() },
      })
      console.log(`  Обновлён: ${proj.slug}`)
    }
    updated++
  }

  return { updated, deleted }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  if (dryRun) console.log('=== РЕЖИМ ПРОВЕРКИ (--dry-run) ===')

  let totalUpdated = 0
  let totalDeleted = 0

  for (const config of CONFIGS) {
    const { updated, deleted } = await processSubsection(config, dryRun)
    totalUpdated += updated
    totalDeleted += deleted
  }

  console.log(`\n✅ Готово: обновлено ${totalUpdated}, удалено ${totalDeleted}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
