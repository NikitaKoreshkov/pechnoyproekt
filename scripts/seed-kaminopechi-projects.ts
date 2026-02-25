/**
 * Загрузка проектов Каминопечи и Печи с камином (3 раздела):
 * - Каминопечи I с 1 по 100 проекты
 * - Каминопечи II с 101 по 200 проекты
 * - Печи с камином
 * Запуск: npx tsx scripts/seed-kaminopechi-projects.ts
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

const BASE = path.join(process.cwd(), 'парсер', 'Каминопечи и Печи с каминами')
const PUBLIC_BASE = path.join(process.cwd(), 'public', 'images')
const PLACEHOLDER_IMAGE = '/images/1.png'

const SUBSECTIONS: { folder: string; slugPrefix: string; subsectionSlug: string; imgDir: string }[] = [
  { folder: 'Каминопечи_I_с_1_по_100_проекты', slugPrefix: 'kaminopechi-', subsectionSlug: 'kaminopechi-s-1-po-100-proekty', imgDir: 'kaminopechi-1' },
  { folder: 'Каминопечи_II_с_101_по_200_проекты', slugPrefix: 'kaminopechi-', subsectionSlug: 'kaminopechi-s-101-po-200-proekty', imgDir: 'kaminopechi-2' },
  { folder: 'Печи_с_камином', slugPrefix: 'pechi-s-kaminom-', subsectionSlug: 'pechi-s-kaminom', imgDir: 'pechi-s-kaminom' }
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

function extractArea(vnutri: Record<string, string>): number {
  const keys = ['Обогреваемое помещение', 'Отапливаемое помещение', 'Обогреваемое помещение от печи', 'Отапливаемое помещение от печи']
  for (const k of keys) {
    const v = vnutri[k]
    if (v) {
      const m = v.match(/(\d+)\s*(?:кв\.?м|м²)/i)
      if (m) return parseInt(m[1], 10)
    }
  }
  return 20
}

function ploshadToRange(m2: number): string {
  if (m2 <= 15) return 'до 15 м²'
  if (m2 <= 30) return '16-30 м²'
  if (m2 <= 45) return '31-45 м²'
  if (m2 <= 60) return '46-60 м²'
  if (m2 <= 80) return '61-80 м²'
  return '81 м² и более'
}

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

  function parseDualList(body: string, yesLabel: string, noLabel: string): Record<string, string> {
    const map: Record<string, string> = {}
    const yesRegex = new RegExp(`${yesLabel}:\\s*([\\s\\S]*?)(?=${noLabel}:|===|$)`, 'i')
    const noRegex = new RegExp(`${noLabel}:\\s*([\\s\\S]*?)(?===|$)`, 'i')
    const yesMatch = body.match(yesRegex)
    const noMatch = body.match(noRegex)
    const parseList = (s: string) => s.split(',').map(x => x.trim().replace(/\s+/g, ' ')).filter(x => x && x !== '(нет)')
    const yesItems = parseList(yesMatch ? yesMatch[1] : '')
    const noItems = parseList(noMatch ? noMatch[1] : '')
    yesItems.forEach(k => { map[k] = yesLabel })
    noItems.forEach(k => { map[k] = noLabel })
    return map
  }

  function parsePloshad(body: string): Record<string, string> {
    const map: Record<string, string> = {}
    const lines = body.split('\n')
    let currentLabel = ''
    for (const line of lines) {
      const m = line.match(/^((?:до \d+ м²|\d+-\d+ м²|\d+ м² и более))\s*:\s*$/)
      if (m) {
        currentLabel = m[1]
      } else if (currentLabel) {
        const items = line.split(',').map(s => s.trim().replace(/\s+/g, ' ')).filter(s => s && s !== '(нет)')
        items.forEach(k => { map[k] = currentLabel })
        currentLabel = ''
      }
    }
    return map
  }

  function parsePlita(body: string): Record<string, string> {
    const map: Record<string, string> = {}
    const lines = body.split('\n')
    let currentLabel = ''
    for (const line of lines) {
      const m = line.match(/^(\d+мм\*\d+мм)\s*:\s*$/)
      if (m) {
        currentLabel = m[1]
      } else if (currentLabel) {
        const items = line.split(',').map(s => s.trim().replace(/\s+/g, ' ')).filter(s => s && s !== '(нет)')
        items.forEach(k => { map[k] = currentLabel })
        currentLabel = ''
      }
    }
    return map
  }

  for (let i = 0; i < sections.length; i += 2) {
    const title = (sections[i] || '').trim()
    const body = (sections[i + 1] || '').trim()
    if (!title || !body) continue

    if (title === 'Хлебная камера') {
      out.hlebnaya = parseDualList(body, 'Есть', 'Нет')
    } else if (title === 'Варочная плита') {
      out.plita = parseDualList(body, 'Да', 'Нет')
    } else if (title === 'Лежанка') {
      const withDa = parseDualList(body, 'Да', 'Нет')
      out.lezhanka = Object.keys(withDa).length > 0 ? withDa : parseDualList(body, 'Есть', 'Нет')
    } else if (title === 'Духовка') {
      out.duhovka = parseDualList(body, 'Есть', 'Нет')
    } else if (title === 'Плита') {
      out.plita = parsePlita(body)
    } else if (title === 'Площадь') {
      out.ploshad = parsePloshad(body)
    }
  }

  return out
}

function toFilterKey(folderName: string): string {
  return folderName.replace(/_/g, ' ')
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

    const filterValues: Record<string, unknown> = {}
    const fkey = filterKey(folderName)
    const area = extractArea(vnutri)

    if (filterMap.ploshad && filterMap.ploshad[fkey]) {
      filterValues.ploshad = filterMap.ploshad[fkey]
    } else if (area > 0) {
      filterValues.ploshad = ploshadToRange(area)
    }

    if (filterMap.hlebnaya) {
      filterValues.hlebnaya = filterMap.hlebnaya[fkey] ?? 'Нет'
    }
    if (filterMap.plita) {
      filterValues.plita = filterMap.plita[fkey] ?? 'Нет'
    }
    if (filterMap.lezhanka) {
      filterValues.lezhanka = filterMap.lezhanka[fkey] ?? 'Нет'
    }
    if (filterMap.duhovka) {
      filterValues.duhovka = filterMap.duhovka[fkey] ?? 'Нет'
    }

    const brickVal = vnutri['Количество кирпичей']
    const brickNum = brickVal ? parseBrickCount(brickVal) : null
    if (brickNum != null) filterValues.kirpichi = brickCountToRange(brickNum)

    const gabVal = vnutri['Габариты']
    const footprint = gabVal ? parseFootprint(gabVal) : null
    if (footprint != null) {
      filterValues.gabarity = footprintToRange(footprint)
    }

    const portalVal = vnutri['Размер портала']
    const portalRange = portalVal ? parsePortalSize(portalVal) : null
    if (portalRange) filterValues.portalSize = portalRange

    const trubaVal = vnutri['Сечение трубы'] || vnutri['Сечение канала трубы']
    const trubaNorm = trubaVal ? parseTrubaSech(trubaVal) : null
    if (trubaNorm) filterValues.trubaSech = trubaNorm

    const schemaVal = vnutri['Схема движения газов']
    if (schemaVal && typeof schemaVal === 'string') {
      const s = schemaVal.trim()
      if (/канальн/i.test(s)) filterValues.schema_gazov = 'Канальная'
      else if (/колпак/i.test(s)) filterValues.schema_gazov = 'Колпаковая'
      else if (/СДГ/i.test(s)) filterValues.schema_gazov = 'СДГ'
      else if (s) filterValues.schema_gazov = s
    }

    const technicalSpecs = buildTechnicalSpecs(vnutri) || desc.trim() || ''

    const adv: string[] = []
    if (filterValues.ploshad) adv.push(`Обогрев до ${String(filterValues.ploshad).replace('до ', '')} — комфорт в доме`)
    if (filterValues.kirpichi) adv.push(`Количество кирпичей ${filterValues.kirpichi} — надёжная конструкция`)
    if (filterValues.portalSize) adv.push(`Размер портала ${filterValues.portalSize}`)
    adv.push('Каминопечь — отопление и камин в одном устройстве')
    adv.push('Проект ProektMangal — проверенные решения')

    const sellingDesc = [
      `${title} — функциональная каминопечь для частного дома. Эффективно обогревает помещение и создаёт уютную атмосферу у камина.`,
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

  const kaminSlugs = projects.map((p) => p.slug)
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

  const portalOpts = [...new Set(projects.map(p => (p.filterValues.portalSize as string)).filter(Boolean))].sort()
  const trubaOpts = [...new Set(projects.map(p => (p.filterValues.trubaSech as string)).filter(Boolean))].sort((a, b) => {
    const aNum = a.match(/\d+/) ? parseInt(a.match(/\d+/)![0], 10) : 0
    const bNum = b.match(/\d+/) ? parseInt(b.match(/\d+/)![0], 10) : 0
    return aNum - bNum
  })
  const ploshadOpts = [...new Set(projects.map(p => (p.filterValues.ploshad as string)).filter(Boolean))].sort()
  const schemaOpts = [...new Set(projects.map(p => (p.filterValues.schema_gazov as string)).filter(Boolean))]
  const plitaOpts = [...new Set(projects.map(p => (p.filterValues.plita as string)).filter(Boolean))].sort()
  const lezhankaOpts = [...new Set(projects.map(p => (p.filterValues.lezhanka as string)).filter(Boolean))]

  const filtersConfig: Record<string, unknown> = {
    price: { title: 'Цена', type: 'range' as const, min: 0, max: 50000, step: 500 },
    gabarity: {
      title: 'Габариты',
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
    ...(ploshadOpts.length > 0 && {
      ploshad: {
        title: 'Площадь обогрева',
        type: 'checkboxes' as const,
        options: ploshadOpts.map(v => ({ label: v, value: v }))
      }
    }),
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
    }),
    ...(schemaOpts.length > 0 && {
      schema_gazov: {
        title: 'Схема газов',
        type: 'checkboxes' as const,
        options: schemaOpts.map(v => ({ label: v, value: v }))
      }
    }),
    ...(filterMap.hlebnaya && {
      hlebnaya: {
        title: 'Хлебная камера',
        type: 'checkboxes' as const,
        options: [
          { label: 'Есть', value: 'Есть' },
          { label: 'Нет', value: 'Нет' }
        ]
      }
    }),
    ...(filterMap.lezhanka && {
      lezhanka: {
        title: 'Лежанка',
        type: 'checkboxes' as const,
        options: (lezhankaOpts.length > 0 ? lezhankaOpts : ['Есть', 'Нет']).map(v => ({ label: v, value: v }))
      }
    }),
    ...(filterMap.plita && {
      plita: {
        title: 'Варочная плита',
        type: 'checkboxes' as const,
        options: plitaOpts.length > 0
          ? plitaOpts.map(v => ({ label: v, value: v }))
          : [
              { label: 'Да', value: 'Да' },
              { label: 'Нет', value: 'Нет' }
            ]
      }
    }),
    ...(filterMap.duhovka && {
      duhovka: {
        title: 'Духовка',
        type: 'checkboxes' as const,
        options: [
          { label: 'Есть', value: 'Есть' },
          { label: 'Нет', value: 'Нет' }
        ]
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
  console.log('🔥 Загрузка проектов: Каминопечи и Печи с камином...\n')

  const section = await prisma.catalogSection.findFirst({
    where: { title: { contains: 'КАМИНОПЕЧИ', mode: 'insensitive' } }
  })
  if (!section) {
    console.error('   Раздел «КАМИНОПЕЧИ И ПЕЧИ С КАМИНАМИ» не найден в каталоге')
    process.exit(1)
  }

  for (const subConf of SUBSECTIONS) {
    const subsection = await prisma.catalogSubsection.findFirst({
      where: { slug: subConf.subsectionSlug, sectionId: section.id }
    })
    if (!subsection) {
      console.log(`   Пропуск: подраздел «${subConf.folder}» не найден`)
      continue
    }
    console.log(`\n📁 ${subConf.folder}`)
    await processSubsection(subConf, subsection)
  }

  console.log('\n✅ Готово')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
