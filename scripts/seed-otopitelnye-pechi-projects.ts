/**
 * Загрузка проектов ОП (Отопительные печи) из папки парсера
 * - снаружи: название, цена, фото
 * - внутри: описание, доп фото
 * Запуск: npx tsx scripts/seed-otopitelnye-pechi-projects.ts
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

const OP_BASE = path.join(process.cwd(), 'парсер', 'Отопительные печи')
const PROJECTS_DIR = path.join(OP_BASE, 'проект')
const FILTERS_FILE = path.join(OP_BASE, 'фильтры', 'filters.txt')
const PUBLIC_OP = path.join(process.cwd(), 'public', 'images', 'op')
const PLACEHOLDER_IMAGE = '/images/1.png'

// ОП_2 | ОП 2 -> ОП 2
function toFilterKey(folderName: string): string {
  const m = folderName.match(/^ОП[_ ]?(.*)$/i)
  if (!m) return folderName
  const num = (m[1] || '').trim()
  return num ? `ОП ${num}` : 'ОП'
}

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
  return '2+ м²'
}

function extractAreaFromDescription(desc: string): number {
  const m = desc.match(/(?:Обогреваемое|Отапливаемое)\s+помещение(?:\s+от печи)?[:\s]*(\d+)\s*(?:кв\.?м|м²)/i)
  if (m) return parseInt(m[1], 10)
  const m2 = desc.match(/помещение[:\s]*(\d+)\s*(?:кв\.?м|м²)/i)
  if (m2) return parseInt(m2[1], 10)
  const m3 = desc.match(/(\d+)\s*(?:кв\.?м|м²)/i)
  if (m3) return parseInt(m3[1], 10)
  return 20
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

interface FilterMap {
  ploshad: Record<string, string>
}

function parseFiltersTxt(): FilterMap {
  const out: FilterMap = { ploshad: {} }
  if (!fs.existsSync(FILTERS_FILE)) return out
  const content = fs.readFileSync(FILTERS_FILE, 'utf-8')
  const sections = content.split(/=== (.*?) ===/).slice(1)
  for (let i = 0; i < sections.length; i += 2) {
    const title = (sections[i] || '').trim()
    const body = (sections[i + 1] || '').trim()
    if (!title || !body) continue
    if (title === 'Площадь') {
      parsePloshad(body, out.ploshad)
    }
  }
  return out
}

function parsePloshad(body: string, map: Record<string, string>) {
  const lines = body.split('\n')
  let currentLabel = ''
  for (const line of lines) {
    const m = line.match(/^((?:до \d+ м²|\d+-\d+ м²|\d+ м² и более))\s*:\s*$/)
    if (m) {
      currentLabel = m[1]
    } else if (currentLabel) {
      const items = line.split(',').map(s => s.trim().replace(/\s+/g, ' ')).filter(Boolean)
      items.forEach(k => { map[k] = currentLabel })
      currentLabel = ''
    }
  }
}

async function main() {
  console.log('🔥 Загрузка проектов ОП (Отопительные печи)...')

  const filterMap = parseFiltersTxt()
  console.log('   Загружены фильтры: Площадь')

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
    const key = toFilterKey(f)
    const existing = seenKeys.get(key)
    if (existing) {
      seenKeys.set(key, preferFolder(f, existing))
    } else {
      seenKeys.set(key, f)
    }
  }
  const folders = Array.from(seenKeys.values())

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

  const techFields = ['Габариты', 'Обогреваемое помещение', 'Количество кирпичей', 'Схема движения газов']

  for (const folderName of folders) {
    const snaružiPath = path.join(PROJECTS_DIR, folderName, 'снаружи', 'info.txt')
    const vnutriPath = path.join(PROJECTS_DIR, folderName, 'внутри', 'info.txt')
    const snaruži = parseInfoTxt(snaružiPath)
    const vnutri = parseInfoTxt(vnutriPath)
    const title = snaruži['Название'] || folderName.replace(/_/g, ' ')
    const priceRaw = snaruži['Цена'] || vnutri['Цена'] || '0'
    const price = parsePrice(priceRaw)
    const desc = vnutri['Описание'] || ''
    const areaStr = vnutri['Обогреваемое помещение'] || desc
    const area = extractAreaFromDescription(areaStr)
    const videoUrl = extractVideoUrl(vnutri)

    const filterKey = toFilterKey(folderName)
    const filterValues: Record<string, unknown> = {}
    if (filterMap.ploshad[filterKey]) filterValues.ploshad = filterMap.ploshad[filterKey]
    const schemaVal = vnutri['Схема движения газов']
    if (schemaVal && typeof schemaVal === 'string') filterValues.schema_gazov = schemaVal.trim()
    const brickVal = vnutri['Количество кирпичей']
    const brickNum = brickVal ? parseBrickCount(brickVal) : null
    if (brickNum != null) filterValues.kirpichi = brickCountToRange(brickNum)
    const gabVal = vnutri['Габариты']
    const footprint = gabVal ? parseFootprint(gabVal) : null
    if (footprint != null) filterValues.gabarity = footprintToRange(footprint)

    const technicalSpecsLines = techFields
      .map(k => {
        const v = vnutri[k]
        if (!v || typeof v !== 'string' || !v.trim()) return null
        return `${k}: ${v.trim()}`
      })
      .filter((s): s is string => s != null)
    const technicalSpecs = technicalSpecsLines.length > 0 ? technicalSpecsLines.join('\n') : (desc.trim() || null)

    const adv: string[] = []
    if (filterValues.ploshad) adv.push(`Эффективный обогрев до ${String(filterValues.ploshad).replace('до ', '')} — комфорт в гостиной и смежных комнатах`)
    if (filterValues.schema_gazov) {
      const schema = String(filterValues.schema_gazov)
      if (schema.toLowerCase().includes('канальн')) adv.push('Канальная схема — проверенная надёжность и равномерный обогрев')
      else if (schema === 'СДГ') adv.push('Схема СДГ — повышенная эффективность теплоотдачи')
      else if (schema.toLowerCase().includes('комбин')) adv.push('Комбинированная схема — оптимальный баланс характеристик')
    }
    adv.push('Кирпичная кладка — долговечность на десятилетия и отличная теплоёмкость')
    adv.push('Проект ProektMangal — продуманная конструкция и проверенные решения')

    const sellingDesc = [
      `Отопительная печь ${title} — надёжное решение для обогрева частного дома, дачи или загородного коттеджа. Эффективно обогревает до ${area} м², создавая уютную атмосферу в холодные месяцы.`,
      `Кирпичная кладка обеспечивает долговечность и отличную теплоёмкость: печь долго сохраняет тепло даже после прогорания топлива. Равномерный обогрев без резких перепадов температуры.`,
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
    const slug = `op-${base || 'pech'}`

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
      const destDir = path.join(PUBLIC_OP, folderName)
      fs.mkdirSync(destDir, { recursive: true })
      const ext = path.extname(srcMain)
      const destPath = path.join(destDir, `main${ext}`)
      try {
        fs.copyFileSync(srcMain, destPath)
        mainImage = `/images/op/${folderName}/main${ext}`
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
          const destDir = path.join(PUBLIC_OP, folderName)
          fs.mkdirSync(destDir, { recursive: true })
          const destPath = path.join(destDir, f)
          try {
            fs.copyFileSync(fullPath, destPath)
            images.push(`/images/op/${folderName}/${f}`)
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

  // Ищем подраздел ОП в разделе "ОТОПИТЕЛЬНЫЕ ПЕЧИ"
  let subsection = await prisma.catalogSubsection.findFirst({
    where: {
      OR: [
        { slug: 'op' },
        { slug: 'otopitelnye-pechi' },
        { title: { contains: 'Отопительные печи', mode: 'insensitive' } }
      ],
      section: { title: { contains: 'ОТОПИТЕЛЬНЫЕ ПЕЧИ', mode: 'insensitive' } }
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
          { slug: 'otopitelnye-pechi' },
          { title: { contains: 'ОТОПИТЕЛЬНЫЕ ПЕЧИ', mode: 'insensitive' } }
        ]
      }
    }) as any
    if (!section) {
      const existingByTitle = await prisma.catalogSection.findFirst({
        where: { title: { equals: 'ОТОПИТЕЛЬНЫЕ ПЕЧИ', mode: 'insensitive' } }
      })
      if (existingByTitle) {
        section = existingByTitle
      } else {
        section = await prisma.catalogSection.create({
          data: {
            id: `sec-op-${Date.now()}`,
            title: 'ОТОПИТЕЛЬНЫЕ ПЕЧИ',
            slug: 'otopitelnye-pechi',
            order: 6,
            updatedAt: new Date()
          }
        })
        console.log('   Создан раздел:', section.title)
      }
    }
    subsection = await prisma.catalogSubsection.create({
      data: {
        id: `sub-op-${Date.now()}`,
        sectionId: section.id,
        title: 'Отопительные печи',
        slug: 'op',
        order: 0,
        updatedAt: new Date()
      }
    })
    subsectionId = subsection.id
    console.log('   Создан подраздел:', subsection.title)
  }

  const opSlugs = projects.map((p) => p.slug)
  const deleted = await prisma.project.deleteMany({
    where: { OR: [{ subsectionId }, { slug: { in: opSlugs } }] }
  })
  console.log(`   Удалено старых проектов ОП: ${deleted.count}`)

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

  console.log(`   Создано проектов ОП: ${projects.length}`)

  // Конфигурация фильтров для раздела ОП
  const opFiltersConfig = {
    price: { title: 'Цена', type: 'range' as const, min: 0, max: 20000, step: 500 },
    ploshad: {
      title: 'Площадь обогрева',
      type: 'checkboxes' as const,
      options: [
        { label: 'до 15 м²', value: 'до 15 м²' },
        { label: '16-30 м²', value: '16-30 м²' },
        { label: '31-45 м²', value: '31-45 м²' },
        { label: '46-60 м²', value: '46-60 м²' },
        { label: '61-80 м²', value: '61-80 м²' },
        { label: '81 м² и более', value: '81 м² и более' }
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
        { label: '2+ м²', value: '2+ м²' }
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
    schema_gazov: {
      title: 'Схема движения газов',
      type: 'checkboxes' as const,
      options: [
        { label: 'Канальная', value: 'канальная' },
        { label: 'СДГ', value: 'СДГ' },
        { label: 'Комбинированная', value: 'комбинированная' }
      ]
    }
  }

  const existingOpFilters = await prisma.catalogFiltersConfig.findFirst({
    where: { subsectionId }
  })
  if (existingOpFilters) {
    await prisma.catalogFiltersConfig.update({
      where: { id: existingOpFilters.id },
      data: { config: opFiltersConfig, updatedAt: new Date() }
    })
    console.log('   Обновлена конфигурация фильтров ОП')
  } else {
    await prisma.catalogFiltersConfig.create({
      data: {
        id: `cfg-op-${Date.now()}`,
        config: opFiltersConfig,
        sectionId: section.id,
        subsectionId,
        updatedAt: new Date()
      }
    })
    console.log('   Создана конфигурация фильтров ОП')
  }

  console.log('✅ Готово')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
