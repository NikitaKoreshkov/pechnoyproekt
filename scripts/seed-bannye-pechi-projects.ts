/**
 * Загрузка проектов Банные печи (2 раздела):
 * - Банные печи I с 1 по 100 проекты
 * - Банные печи II с 101 по 200 проекты
 * Запуск: npx tsx scripts/seed-bannye-pechi-projects.ts
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

const BASE = path.join(process.cwd(), 'парсер', 'Банные печи')
const PUBLIC_BASE = path.join(process.cwd(), 'public', 'images')
const PLACEHOLDER_IMAGE = '/images/1.png'

const SUBSECTIONS: { folder: string; slugPrefix: string; subsectionSlug: string; imgDir: string }[] = [
  { folder: 'Банные_печи_I_с_1_по_100_проекты', slugPrefix: 'bannye-', subsectionSlug: 'bannye-pechi-i-s-1-po-100-proekty', imgDir: 'bannye-1' },
  { folder: 'Банные_печи_II_с_101_по_200_проекты', slugPrefix: 'bannye-', subsectionSlug: 'bannye-pechi-ii-s-101-po-200-proekty', imgDir: 'bannye-2' }
]

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

function extractVolume(vnutri: Record<string, string>): number | null {
  const keys = ['Рассчитана на объем', 'Объём парной', 'Объем парной']
  for (const k of keys) {
    const v = vnutri[k]
    if (v) {
      const rangeMatch = v.match(/(\d+)\s*[-–]\s*(\d+)\s*(?:куб\.?м|м³)/i)
      if (rangeMatch) return Math.max(parseInt(rangeMatch[1], 10), parseInt(rangeMatch[2], 10))
      const m = v.match(/(\d+)\s*(?:куб\.?м|м³)/i)
      if (m) return parseInt(m[1], 10)
    }
  }
  return null
}

function volumeToRange(m3: number): string {
  if (m3 < 20) return 'до 20 куб.м'
  if (m3 < 35) return '20-35 куб.м'
  if (m3 < 50) return '35-50 куб.м'
  return '50+ куб.м'
}

function parseMassKamney(vnutri: Record<string, string>): number | null {
  const keys = ['Масса камней', 'Масса камней в двух баках']
  for (const k of keys) {
    const v = vnutri[k]
    if (v && /\d+/.test(v)) {
      const m = v.match(/(\d+)\s*кг/i)
      if (m) return parseInt(m[1], 10)
    }
  }
  return null
}

function massKamneyToRange(kg: number): string {
  if (kg < 100) return 'до 100 кг'
  if (kg < 200) return '100-200 кг'
  if (kg < 400) return '200-400 кг'
  return '400+ кг'
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

const EXCLUDE_FROM_SPECS = new Set(['Цена', 'Описание', 'Видео', 'Название'])

function buildTechnicalSpecs(vnutri: Record<string, string>): string {
  const lines: string[] = []
  for (const [k, v] of Object.entries(vnutri)) {
    if (EXCLUDE_FROM_SPECS.has(k) || !v || typeof v !== 'string') continue
    const trimmed = v.trim()
    if (!trimmed) continue
    lines.push(`${k}: ${trimmed}`)
  }
  return lines.length > 0 ? lines.join('\n') : ''
}

type FilterMap = Record<string, Record<string, string>>

function parseFiltersTxt(filtersPath: string): FilterMap {
  const out: FilterMap = {}
  if (!fs.existsSync(filtersPath)) return out

  const content = fs.readFileSync(filtersPath, 'utf-8')
  const sections = content.split(/=== (.*?) ===/).slice(1)

  function parseDualList(body: string, label1: string, label2: string): Record<string, string> {
    const map: Record<string, string> = {}
    const r1 = new RegExp(`${label1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:\\s*([\\s\\S]*?)(?=${label2.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:|===|$)`, 'i')
    const r2 = new RegExp(`${label2.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:\\s*([\\s\\S]*?)(?===|$)`, 'i')
    const m1 = body.match(r1)
    const m2 = body.match(r2)
    const parseList = (s: string) => s.split(',').map(x => x.trim().replace(/\s+/g, ' ')).filter(x => x && x !== '(нет)')
    parseList(m1 ? m1[1] : '').forEach(k => { map[k] = label1 })
    parseList(m2 ? m2[1] : '').forEach(k => { map[k] = label2 })
    return map
  }

  for (let i = 0; i < sections.length; i += 2) {
    const title = (sections[i] || '').trim()
    const body = (sections[i + 1] || '').trim()
    if (!title || !body) continue

    if (title === 'Тип печи') {
      out.tip_pechi = parseDualList(body, 'Постоянного действия', 'Периодического действия')
    }
  }

  return out
}

function toFilterKey(folderName: string): string {
  return folderName.replace(/_/g, ' ')
}

function resolveBannyeFilterKey(fkey: string, map: Record<string, string>): string | undefined {
  if (map[fkey]) return map[fkey]
  for (const [k, v] of Object.entries(map)) {
    if (k === fkey || k.startsWith(fkey + ' ') || k.startsWith(fkey + ',')) return v
  }
  return undefined
}

async function processSubsection(
  subsectionConfig: typeof SUBSECTIONS[0],
  subsection: { id: string; sectionId: string }
) {
  const projectsDir = path.join(BASE, subsectionConfig.folder, 'проект')
  const filtersPath = path.join(BASE, subsectionConfig.folder, 'фильтры', 'filters.txt')
  const publicDir = path.join(PUBLIC_BASE, subsectionConfig.imgDir)

  const filterMap = parseFiltersTxt(filtersPath)
  if (Object.keys(filterMap).length > 0) {
    console.log(`   Фильтры из filters.txt: ${Object.keys(filterMap).join(', ')}`)
  }

  if (!fs.existsSync(projectsDir)) {
    console.log(`   Папка не найдена: ${projectsDir}`)
    return
  }

  const allFolders = fs.readdirSync(projectsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)

  const hasImages = (folderName: string): boolean => {
    const sn = path.join(projectsDir, folderName, 'снаружи')
    const imgs = path.join(projectsDir, folderName, 'внутри', 'изображения')
    const vn = path.join(projectsDir, folderName, 'внутри')
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
  const filterKey = (folderName: string) => toFilterKey(folderName)

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
    const snaružiPath = path.join(projectsDir, folderName, 'снаружи', 'info.txt')
    const vnutriPath = path.join(projectsDir, folderName, 'внутри', 'info.txt')
    const snaruži = parseInfoTxt(snaružiPath)
    const vnutri = parseInfoTxt(vnutriPath)
    const title = snaruži['Название'] || folderName.replace(/_/g, ' ')
    const priceRaw = snaruži['Цена'] || vnutri['Цена'] || '0'
    const price = parsePrice(priceRaw)
    const desc = vnutri['Описание'] || ''
    const videoUrl = extractVideoUrl(vnutri)
    const volume = extractVolume(vnutri)

    const filterValues: Record<string, unknown> = {}
    const fkey = filterKey(folderName)

    if (filterMap.tip_pechi) {
      filterValues.tip_pechi = resolveBannyeFilterKey(fkey, filterMap.tip_pechi) ?? 'Периодического действия'
    }

    if (volume != null) filterValues.obem = volumeToRange(volume)

    const massKam = parseMassKamney(vnutri)
    if (massKam != null) filterValues.mass_kamney = massKamneyToRange(massKam)

    const brickVal = vnutri['Количество кирпичей']
    const brickNum = brickVal ? parseBrickCount(brickVal) : null
    if (brickNum != null) filterValues.kirpichi = brickCountToRange(brickNum)

    const gabVal = vnutri['Габариты']
    const footprint = gabVal ? parseFootprint(gabVal) : null
    if (footprint != null) filterValues.gabarity = footprintToRange(footprint)

    const technicalSpecs = buildTechnicalSpecs(vnutri) || desc.trim() || ''

    const adv: string[] = []
    if (filterValues.tip_pechi) adv.push(`Тип: ${filterValues.tip_pechi}`)
    if (filterValues.kirpichi) adv.push(`Количество кирпичей ${filterValues.kirpichi}`)
    if (volume != null && volume > 0) adv.push(`Объём парной до ${volume} куб.м.`)
    adv.push('Банная печь — качественный пар')
    adv.push('Проект ProektMangal — проверенные решения')

    const sellingDesc = [
      `${title} — банная печь для парной. ${filterValues.tip_pechi === 'Постоянного действия' ? 'Печь постоянного действия для комфортного использования.' : 'Печь периодического действия для классической бани.'}`,
      `Кирпичная кладка обеспечивает долговечность и отличную теплоёмкость. Проект разработан ProektMangal с учётом многолетнего опыта.`
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
    const slug = `${subsectionConfig.slugPrefix}${base || '1'}`

    let mainImage = PLACEHOLDER_IMAGE
    const images: string[] = []

    const snaružiDir = path.join(projectsDir, folderName, 'снаружи')
    const vnutriDir = path.join(projectsDir, folderName, 'внутри')
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
      const destDir = path.join(publicDir, folderName)
      fs.mkdirSync(destDir, { recursive: true })
      const ext = path.extname(srcMain)
      const destPath = path.join(destDir, `main${ext}`)
      try {
        fs.copyFileSync(srcMain, destPath)
        mainImage = `/images/${subsectionConfig.imgDir}/${folderName}/main${ext}`
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
          const destDir = path.join(publicDir, folderName)
          fs.mkdirSync(destDir, { recursive: true })
          const destPath = path.join(destDir, f)
          try {
            fs.copyFileSync(fullPath, destPath)
            images.push(`/images/${subsectionConfig.imgDir}/${folderName}/${f}`)
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
      area: volume ?? 15,
      description: sellingDesc || desc || undefined,
      technicalSpecs: technicalSpecs || null,
      advantages: adv,
      specs,
      mainImage,
      images: uniqueImages,
      videoUrl,
      filterValues
    })
  }

  const deleted = await prisma.project.deleteMany({
    where: { subsectionId: subsection.id }
  })
  console.log(`   Удалено старых: ${deleted.count}`)

  for (const p of projects) {
    await prisma.project.create({
      data: {
        id: `proj-${p.slug}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        slug: p.slug,
        subsectionId: subsection.id,
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
        hasBath: true,
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

  const gabarityOpts = [...new Set(projects.map(p => (p.filterValues.gabarity as string)).filter(Boolean))].sort()
  const kirpichiOpts = [...new Set(projects.map(p => (p.filterValues.kirpichi as string)).filter(Boolean))].sort()
  const tipOpts = [...new Set(projects.map(p => (p.filterValues.tip_pechi as string)).filter(Boolean))]
  const obemOrder = ['до 20 куб.м', '20-35 куб.м', '35-50 куб.м', '50+ куб.м']
  const massOrder = ['до 100 кг', '100-200 кг', '200-400 кг', '400+ кг']
  const obemOpts = [...new Set(projects.map(p => (p.filterValues.obem as string)).filter(Boolean))].sort((a, b) => obemOrder.indexOf(a) - obemOrder.indexOf(b))
  const massOpts = [...new Set(projects.map(p => (p.filterValues.mass_kamney as string)).filter(Boolean))].sort((a, b) => massOrder.indexOf(a) - massOrder.indexOf(b))

  const filtersConfig: Record<string, unknown> = {
    price: { title: 'Цена', type: 'range' as const, min: 0, max: 50000, step: 500 },
    ...(gabarityOpts.length > 0 && {
      gabarity: {
        title: 'Габариты',
        type: 'checkboxes' as const,
        options: gabarityOpts.length > 0
          ? gabarityOpts.map(v => ({ label: v, value: v }))
          : [
              { label: 'до 0.5 м²', value: 'до 0.5 м²' },
              { label: '0.5-1 м²', value: '0.5-1 м²' },
              { label: '1-1.5 м²', value: '1-1.5 м²' },
              { label: '1.5-2 м²', value: '1.5-2 м²' },
              { label: '2-4 м²', value: '2-4 м²' },
              { label: '4+ м²', value: '4+ м²' }
            ]
      }
    }),
    ...(kirpichiOpts.length > 0 && {
      kirpichi: {
        title: 'Количество кирпичей',
        type: 'checkboxes' as const,
        options: kirpichiOpts.map(v => ({ label: v, value: v }))
      }
    }),
    ...(filterMap.tip_pechi && {
      tip_pechi: {
        title: 'Тип печи',
        type: 'checkboxes' as const,
        options: tipOpts.length > 0
          ? tipOpts.map(v => ({ label: v, value: v }))
          : [
              { label: 'Постоянного действия', value: 'Постоянного действия' },
              { label: 'Периодического действия', value: 'Периодического действия' }
            ]
      }
    }),
    ...(obemOpts.length > 0 && {
      obem: {
        title: 'Рассчитана на объем',
        type: 'checkboxes' as const,
        options: obemOpts.map(v => ({ label: v, value: v }))
      }
    }),
    ...(massOpts.length > 0 && {
      mass_kamney: {
        title: 'Масса камней',
        type: 'checkboxes' as const,
        options: massOpts.map(v => ({ label: v, value: v }))
      }
    })
  }

  const existingCfg = await prisma.catalogFiltersConfig.findFirst({
    where: { subsectionId: subsection.id }
  })
  if (existingCfg) {
    await prisma.catalogFiltersConfig.update({
      where: { id: existingCfg.id },
      data: { config: filtersConfig, updatedAt: new Date() }
    })
    console.log(`   Обновлена конфигурация фильтров`)
  } else {
    await prisma.catalogFiltersConfig.create({
      data: {
        id: `cfg-${subsectionConfig.subsectionSlug}-${Date.now()}`,
        config: filtersConfig,
        sectionId: subsection.sectionId,
        subsectionId: subsection.id,
        updatedAt: new Date()
      }
    })
    console.log(`   Создана конфигурация фильтров`)
  }

  console.log(`   Создано проектов: ${projects.length}`)
}

async function main() {
  console.log('🔥 Загрузка проектов: Банные печи...\n')

  let section = await prisma.catalogSection.findFirst({
    where: {
      OR: [
        { slug: 'bannye-pechi' },
        { title: { contains: 'БАННЫЕ', mode: 'insensitive' } }
      ]
    }
  })
  if (!section) {
    const existingByTitle = await prisma.catalogSection.findFirst({
      where: { title: { equals: 'БАННЫЕ ПЕЧИ', mode: 'insensitive' } }
    })
    if (existingByTitle) {
      section = existingByTitle
    } else {
      section = await prisma.catalogSection.create({
        data: {
          id: `sec-bannye-${Date.now()}`,
          title: 'БАННЫЕ ПЕЧИ',
          slug: 'bannye-pechi',
          order: 100,
          updatedAt: new Date()
        }
      })
      console.log('   Создан раздел:', section.title)
    }
  }

  for (const subConf of SUBSECTIONS) {
    let subsection = await prisma.catalogSubsection.findFirst({
      where: { slug: subConf.subsectionSlug, sectionId: section!.id },
      include: { section: true }
    })
    if (!subsection) {
      const titles: Record<string, string> = {
        'bannye-pechi-i-s-1-po-100-proekty': 'Банные печи I с 1 по 100 проекты',
        'bannye-pechi-ii-s-101-po-200-proekty': 'Банные печи II с 101 по 200 проекты'
      }
      subsection = await prisma.catalogSubsection.create({
        data: {
          id: `sub-${subConf.subsectionSlug}-${Date.now()}`,
          sectionId: section!.id,
          title: titles[subConf.subsectionSlug] || subConf.folder.replace(/_/g, ' '),
          slug: subConf.subsectionSlug,
          order: subConf.subsectionSlug.includes('101') ? 1 : 0,
          updatedAt: new Date()
        },
        include: { section: true }
      })
      console.log(`   Создан подраздел: ${subsection.title}`)
    }
    console.log(`\n📁 ${subConf.folder}`)
    await processSubsection(subConf, subsection)
  }

  console.log('\n✅ Готово')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
