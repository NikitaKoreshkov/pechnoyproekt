/**
 * Загрузка проектов Камины из папки парсера
 * - снаружи: название, цена, фото
 * - внутри: описание, доп фото
 * Запуск: npx tsx scripts/seed-kaminy-projects.ts
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

const KAMIN_BASE = path.join(process.cwd(), 'парсер', 'Камины')
const PROJECTS_DIR = path.join(KAMIN_BASE, 'проект')
const PUBLIC_KAMIN = path.join(process.cwd(), 'public', 'images', 'kaminy')
const PLACEHOLDER_IMAGE = '/images/1.png'

function parsePrice(str: string): number {
  const m = str.replace(/\s/g, '').match(/[\d]+/)
  return m ? parseInt(m[0], 10) : 0
}

function parseInfoTxt(filePath: string): Record<string, string> {
  const out: Record<string, string> = {}
  if (!fs.existsSync(filePath)) return out
  const content = fs.readFileSync(filePath, 'utf-8')
  let currentKey = ''
  const lines = content.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    // Строки с http — всегда продолжение значения (иначе "https:" ломает разбор)
    if (currentKey && trimmed && /^https?:\/\//i.test(trimmed)) {
      out[currentKey] = (out[currentKey] || '') + '\n' + trimmed
      continue
    }
    const colonIdx = line.indexOf(':')
    if (colonIdx > 0 && !line.startsWith(' ')) {
      currentKey = line.slice(0, colonIdx).trim()
      out[currentKey] = line.slice(colonIdx + 1).trim()
    } else if (currentKey && trimmed) {
      out[currentKey] = (out[currentKey] || '') + '\n' + trimmed
    }
  }
  return out
}

function parseBrickCount(val: string): number | null {
  const m = val.replace(/\s/g, '').match(/(\d+)/)
  return m ? parseInt(m[1], 10) : null
}

function brickCountToRange(n: number): string {
  if (n < 500) return 'до 500 шт.'
  if (n < 1000) return '500-1000 шт.'
  if (n < 1500) return '1000-1500 шт.'
  return '1500+ шт.'
}

function parseFootprint(gabarity: string): number | null {
  const m = gabarity.match(/(\d+)\s*мм\s*\*\s*(\d+)\s*мм/)
  if (m) return parseInt(m[1], 10) * parseInt(m[2], 10)
  return null
}

function footprintToRange(mm2: number): string {
  const m2 = mm2 / 1_000_000
  if (m2 < 0.5) return 'до 0.5 м²'
  if (m2 < 1) return '0.5-1 м²'
  if (m2 < 1.5) return '1-1.5 м²'
  if (m2 < 2) return '1.5-2 м²'
  if (m2 < 4) return '2-4 м²'
  return '4+ м²'
}

/** Размер портала: 500мм(Ш)*500мм(Г)*420мм(В) → площадь Ш×В в м², диапазон */
function parsePortalSize(val: string): string | null {
  if (!val || typeof val !== 'string') return null
  const nums = val.match(/\d+/g)
  if (!nums || nums.length < 2) return null
  let w = 0, h = 0
  if (val.includes('Ш') && val.includes('В') && val.includes('Г') && nums.length >= 3) {
    w = parseInt(nums[0], 10)
    h = parseInt(nums[2], 10)
  } else if (nums.length >= 2) {
    w = parseInt(nums[0], 10)
    h = parseInt(nums[1], 10)
  }
  if (!w || !h) return null
  const m2 = (w * h) / 1_000_000
  if (m2 < 0.25) return 'до 0.25 м²'
  if (m2 < 0.4) return '0.25-0.4 м²'
  if (m2 < 0.6) return '0.4-0.6 м²'
  if (m2 < 0.9) return '0.6-0.9 м²'
  return '0.9+ м²'
}

/** Сечение трубы: 130мм*260мм или D=350мм → нормализованная строка */
function parseTrubaSech(val: string): string | null {
  if (!val || typeof val !== 'string') return null
  const d = val.match(/D\s*=\s*(\d+)\s*мм/i)
  if (d) return `D ${d[1]}мм`
  const m = val.match(/(\d+)\s*мм\s*[×*x]\s*(\d+)\s*мм|(\d+)\s*мм\s*\*\s*(\d+)\s*мм/i)
  if (m) {
    const a = parseInt(m[1] || m[3], 10)
    const b = parseInt(m[2] || m[4], 10)
    return `${Math.min(a, b)}×${Math.max(a, b)}`
  }
  const nums = val.match(/\d+/g)
  if (nums && nums.length >= 2) {
    const a = parseInt(nums[0], 10)
    const b = parseInt(nums[1], 10)
    return `${Math.min(a, b)}×${Math.max(a, b)}`
  }
  return null
}

function extractVideoUrl(innerInfo: Record<string, string>): string | null {
  const videoKey = innerInfo['Видео'] || ''
  const videoMatch = videoKey.match(/(https?:\/\/[^\s\n]+)/)
  if (videoMatch) return videoMatch[1].trim()
  const desc = innerInfo['Описание'] || ''
  const m = desc.match(/Видео:\s*(https?:\/\/[^\s\n]+)/i)
  if (m) return m[1].trim()
  return null
}

async function main() {
  console.log('🔥 Загрузка проектов Камины...')

  if (!fs.existsSync(PROJECTS_DIR)) {
    console.error('   Папка проектов не найдена:', PROJECTS_DIR)
    process.exit(1)
  }

  const allFolders = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)

  const hasImages = (folderName: string): boolean => {
    const sn = path.join(PROJECTS_DIR, folderName, 'снаружи')
    const imgs = path.join(PROJECTS_DIR, folderName, 'внутри', 'изображения')
    const vn = path.join(PROJECTS_DIR, folderName, 'внутри')
    for (const dir of [sn, imgs, vn]) {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
        if (files.length > 0) return true
      }
    }
    return false
  }
  const preferFolder = (a: string, b: string): string => {
    const hasA = hasImages(a)
    const hasB = hasImages(b)
    if (hasA && !hasB) return a
    if (hasB && !hasA) return b
    return /_/.test(a) ? a : b
  }
  const seenKeys = new Map<string, string>()
  for (const f of allFolders) {
    const key = f.replace(/_/g, ' ').toLowerCase()
    const existing = seenKeys.get(key)
    if (existing) {
      seenKeys.set(key, preferFolder(f, existing))
    } else {
      seenKeys.set(key, f)
    }
  }
  const folders = Array.from(seenKeys.values())

  const techFields = ['Габариты', 'Количество кирпичей', 'Размер портала', 'Сечение трубы']

  const projects: Array<{
    folderName: string
    slug: string
    title: string
    price: number
    area: number
    description: string
    technicalSpecs: string | null
    advantages: string[]
    specs: Record<string, unknown> | null
    mainImage: string
    images: string[]
    videoUrl: string | null
    filterValues: Record<string, unknown>
  }> = []

  for (const folderName of folders) {
    const snaružiPath = path.join(PROJECTS_DIR, folderName, 'снаружи', 'info.txt')
    const vnutriPath = path.join(PROJECTS_DIR, folderName, 'внутри', 'info.txt')
    const snaruži = parseInfoTxt(snaružiPath)
    const vnutri = parseInfoTxt(vnutriPath)
    const title = snaruži['Название'] || folderName.replace(/_/g, ' ')
    const priceRaw = snaruži['Цена'] || vnutri['Цена'] || '0'
    const price = parsePrice(priceRaw)
    const desc = vnutri['Описание'] || ''
    const videoUrl = extractVideoUrl(vnutri)

    const filterValues: Record<string, unknown> = {}
    const isUglovoy = /угловой/i.test(folderName)
    filterValues.tip = isUglovoy ? 'Угловой' : 'Пристенный'

    const brickVal = vnutri['Количество кирпичей']
    const brickNum = brickVal ? parseBrickCount(brickVal) : null
    if (brickNum != null) filterValues.kirpichi = brickCountToRange(brickNum)

    const gabVal = vnutri['Габариты']
    const footprint = gabVal ? parseFootprint(gabVal) : null
    let area = 20
    if (footprint != null) {
      filterValues.gabarity = footprintToRange(footprint)
      area = Math.round((footprint / 1_000_000) * 50) || 20
    }

    const portalVal = vnutri['Размер портала']
    const portalRange = portalVal ? parsePortalSize(portalVal) : null
    if (portalRange) filterValues.portalSize = portalRange

    const trubaVal = vnutri['Сечение трубы'] || vnutri['Сечение канала трубы']
    const trubaNorm = trubaVal ? parseTrubaSech(trubaVal) : null
    if (trubaNorm) filterValues.trubaSech = trubaNorm

    const technicalSpecsLines = techFields
      .map(k => {
        const v = vnutri[k]
        if (!v || typeof v !== 'string' || !v.trim()) return null
        return `${k}: ${v.trim()}`
      })
      .filter((s): s is string => s != null)
    const technicalSpecs = technicalSpecsLines.length > 0 ? technicalSpecsLines.join('\n') : (desc.trim() || null)

    const adv: string[] = []
    adv.push(isUglovoy ? 'Угловая конструкция — экономия места и удобное размещение' : 'Пристенный камин — классический дизайн и надёжность')
    if (filterValues.gabarity) adv.push(`Габариты ${filterValues.gabarity} — компактное или просторное решение`)
    if (filterValues.kirpichi) adv.push(`Количество кирпичей ${filterValues.kirpichi} — надёжная конструкция`)
    adv.push('Кирпичная кладка — долговечность и эстетика')
    adv.push('Проект ProektMangal — продуманная конструкция и проверенные решения')

    const sellingDesc = [
      `Камин ${title} — стильное решение для загородного дома или дачи. Создаёт уютную атмосферу и становится центром интерьера.`,
      `Кирпичная кладка обеспечивает долговечность и отличный внешний вид. Правильная конструкция портала и дымохода — залог безопасной и эффективной работы.`,
      `Проект разработан ProektMangal с учётом многолетнего опыта — проверенные решения для вашего комфорта.`
    ].filter(Boolean).join('\n\n')

    const specs: Record<string, unknown> = {
      pricePanels: [
        {
          title: 'Характеристики',
          isMainPrice: true,
          options: [{ label: 'Основные', price: price, description: sellingDesc, technicalSpecs: technicalSpecs || undefined }]
        }
      ],
      technicalSpecsPanelIdx: 0,
      descriptionPanelIdx: 0,
      fieldPanelMap: {}
    }

    const base = folderName.replace(/[^a-zA-Z0-9\u0400-\u04FF]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase()
    const slug = `kamin-${base || '1'}`

    let mainImage = PLACEHOLDER_IMAGE
    const images: string[] = []

    const snaružiDir = path.join(PROJECTS_DIR, folderName, 'снаружи')
    const vnutriDir = path.join(PROJECTS_DIR, folderName, 'внутри')
    const imgsDir = path.join(vnutriDir, 'изображения')
    const imgExt = ['.jpg', '.jpeg', '.png', '.webp']

    const findFirstImage = (dir: string): string | null => {
      if (!fs.existsSync(dir)) return null
      const files = fs.readdirSync(dir).filter(f => imgExt.some(ext => f.toLowerCase().endsWith(ext)))
      const order = ['фото', '1', '01', '2', '02', '3']
      for (const name of order) {
        const found = files.find(f => f.toLowerCase().startsWith(name) || f.startsWith(name))
        if (found) return path.join(dir, found)
      }
      return files[0] ? path.join(dir, files[0]) : null
    }

    const srcMain = findFirstImage(snaružiDir) || findFirstImage(imgsDir) || findFirstImage(vnutriDir)
    if (srcMain) {
      const destDir = path.join(PUBLIC_KAMIN, folderName)
      fs.mkdirSync(destDir, { recursive: true })
      const ext = path.extname(srcMain)
      const destPath = path.join(destDir, `main${ext}`)
      try {
        fs.copyFileSync(srcMain, destPath)
        mainImage = `/images/kaminy/${folderName}/main${ext}`
      } catch (_) {}
    }

    const mainSourceFile = srcMain ? path.basename(srcMain) : ''
    const mainSourceSize = srcMain && fs.existsSync(srcMain) ? fs.statSync(srcMain).size : 0
    const addImagesFromDir = (dir: string) => {
      if (!fs.existsSync(dir)) return
      fs.readdirSync(dir)
        .filter(f => imgExt.some(ext => f.toLowerCase().endsWith(ext)))
        .sort()
        .forEach(f => {
          if (mainSourceFile && f.toLowerCase() === mainSourceFile.toLowerCase()) return
          const fullPath = path.join(dir, f)
          if (mainSourceSize && fs.existsSync(fullPath) && fs.statSync(fullPath).size === mainSourceSize) return
          const destDir = path.join(PUBLIC_KAMIN, folderName)
          fs.mkdirSync(destDir, { recursive: true })
          const destPath = path.join(destDir, f)
          try {
            fs.copyFileSync(fullPath, destPath)
            images.push(`/images/kaminy/${folderName}/${f}`)
          } catch (_) {}
        })
    }
    addImagesFromDir(snaružiDir)
    addImagesFromDir(imgsDir)
    addImagesFromDir(vnutriDir)
    if (mainImage === PLACEHOLDER_IMAGE && images[0]) mainImage = images[0]
    const uniqueImages = [...new Set(images)].filter((u) => u !== mainImage)

    projects.push({
      folderName,
      slug,
      title,
      price,
      area,
      description: sellingDesc || desc || undefined,
      technicalSpecs,
      advantages: adv,
      specs,
      mainImage,
      images: uniqueImages,
      videoUrl,
      filterValues
    })
  }

  console.log(`   Найдено проектов: ${projects.length}`)

  let subsection = await prisma.catalogSubsection.findFirst({
    where: {
      OR: [
        { slug: 'kaminy' },
        { title: { contains: 'Камины', mode: 'insensitive' } }
      ],
      section: { title: { contains: 'КАМИНЫ', mode: 'insensitive' } }
    },
    include: { section: true }
  })

  let section: { id: string; title: string }
  let subsectionId: string

  if (subsection) {
    section = subsection.section
    subsectionId = subsection.id
    console.log(`   Подраздел: «${subsection.title}» в разделе «${section.title}»`)
  } else {
    section = await prisma.catalogSection.findFirst({
      where: {
        OR: [
          { slug: 'kaminy' },
          { title: { contains: 'КАМИНЫ', mode: 'insensitive' } }
        ]
      }
    }) as any
    if (!section) {
      const existingByTitle = await prisma.catalogSection.findFirst({
        where: { title: { equals: 'КАМИНЫ', mode: 'insensitive' } }
      })
      if (existingByTitle) {
        section = existingByTitle
      } else {
        section = await prisma.catalogSection.create({
          data: {
            id: `sec-kamin-${Date.now()}`,
            title: 'КАМИНЫ',
            slug: 'kaminy',
            order: 7,
            updatedAt: new Date()
          }
        })
        console.log('   Создан раздел:', section.title)
      }
    }
    subsection = await prisma.catalogSubsection.create({
      data: {
        id: `sub-kamin-${Date.now()}`,
        sectionId: section.id,
        title: 'Камины',
        slug: 'kaminy',
        order: 0,
        updatedAt: new Date()
      }
    })
    subsectionId = subsection.id
    console.log('   Создан подраздел:', subsection.title)
  }

  const kaminSlugs = projects.map((p) => p.slug)
  const deleted = await prisma.project.deleteMany({
    where: { OR: [{ subsectionId }, { slug: { in: kaminSlugs } }] }
  })
  console.log(`   Удалено старых проектов: ${deleted.count}`)

  for (const p of projects) {
    await prisma.project.create({
      data: {
        id: `proj-${p.slug}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        slug: p.slug,
        subsectionId,
        subsubsectionId: null,
        title: p.title,
        area: p.area,
        priceFrom: p.price,
        priceTo: null,
        floors: 1,
        material: 'кирпич',
        buildTime: 14,
        completion: 'под ключ',
        region: '',
        image: p.mainImage,
        images: p.images,
        tags: [],
        hasTerrasse: false,
        hasBath: false,
        hasGarage: false,
        features: [],
        description: (p.description || null) as string | null,
        technicalSpecs: (p.technicalSpecs || null) as string | null,
        advantages: p.advantages || [],
        specs: p.specs as object | null,
        filterValues: Object.keys(p.filterValues).length > 0 ? p.filterValues : null,
        videoUrl: p.videoUrl,
        updatedAt: new Date()
      }
    })
  }

  console.log(`   Создано проектов: ${projects.length}`)

  const portalOpts = [...new Set(projects.map(p => (p.filterValues.portalSize as string)).filter(Boolean))].sort()
  const trubaOpts = [...new Set(projects.map(p => (p.filterValues.trubaSech as string)).filter(Boolean))].sort((a, b) => {
    const aNum = a.match(/\d+/) ? parseInt(a.match(/\d+/)![0], 10) : 0
    const bNum = b.match(/\d+/) ? parseInt(b.match(/\d+/)![0], 10) : 0
    return aNum - bNum
  })

  const kaminFiltersConfig = {
    price: { title: 'Цена', type: 'range' as const, min: 0, max: 50000, step: 500 },
    tip: {
      title: 'Тип камина',
      type: 'checkboxes' as const,
      options: [
        { label: 'Пристенный', value: 'Пристенный' },
        { label: 'Угловой', value: 'Угловой' }
      ]
    },
    gabarity: {
      title: 'Габариты (размер основания)',
      type: 'checkboxes' as const,
      options: [
        { label: 'до 0.5 м²', value: 'до 0.5 м²' },
        { label: '0.5-1 м²', value: '0.5-1 м²' },
        { label: '1-1.5 м²', value: '1-1.5 м²' },
        { label: '1.5-2 м²', value: '1.5-2 м²' },
        { label: '2-4 м²', value: '2-4 м²' },
        { label: '4+ м²', value: '4+ м²' }
      ]
    },
    kirpichi: {
      title: 'Количество кирпичей',
      type: 'checkboxes' as const,
      options: [
        { label: 'до 500 шт.', value: 'до 500 шт.' },
        { label: '500-1000 шт.', value: '500-1000 шт.' },
        { label: '1000-1500 шт.', value: '1000-1500 шт.' },
        { label: '1500+ шт.', value: '1500+ шт.' }
      ]
    },
    ...(portalOpts.length > 0 && {
      portalSize: {
        title: 'Размер портала',
        type: 'checkboxes' as const,
        options: portalOpts.map(v => ({ label: v, value: v }))
      }
    }),
    ...(trubaOpts.length > 0 && {
      trubaSech: {
        title: 'Сечение трубы',
        type: 'checkboxes' as const,
        options: trubaOpts.map(v => ({ label: v, value: v }))
      }
    })
  }

  const existingCfg = await prisma.catalogFiltersConfig.findFirst({
    where: { subsectionId }
  })
  if (existingCfg) {
    await prisma.catalogFiltersConfig.update({
      where: { id: existingCfg.id },
      data: { config: kaminFiltersConfig, updatedAt: new Date() }
    })
    console.log('   Обновлена конфигурация фильтров')
  } else {
    await prisma.catalogFiltersConfig.create({
      data: {
        id: `cfg-kamin-${Date.now()}`,
        config: kaminFiltersConfig,
        sectionId: section.id,
        subsectionId,
        updatedAt: new Date()
      }
    })
    console.log('   Создана конфигурация фильтров')
  }

  console.log('✅ Готово')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
