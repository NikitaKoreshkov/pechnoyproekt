/**
 * Загрузка проектов Казан + Барбекю (2 раздела):
 * - Казан + Барбекю с 1 по 100 проекты
 * - Казан + Барбекю II с 101 по 200 проекты
 * Запуск: npx tsx scripts/seed-kazan-barbeku-projects.ts
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

const BASE = path.join(process.cwd(), 'парсер', 'Казан + Барбекю')
const PUBLIC_BASE = path.join(process.cwd(), 'public', 'images')
const PLACEHOLDER_IMAGE = '/images/1.png'

const SUBSECTIONS: { folder: string; slugPrefix: string; subsectionSlug: string; imgDir: string }[] = [
  { folder: 'Казан_+_Барбекю_с_1_по_100_проекты', slugPrefix: 'kb-', subsectionSlug: 'kazan-barbeku-s-1-po-100-proekty', imgDir: 'kazan-1' },
  { folder: 'Казан_+_Барбекю_II_с_101_по_200_проекты', slugPrefix: 'kb-', subsectionSlug: 'kazan-barbeku-ii-s-101-po-200-proekty', imgDir: 'kazan-2' }
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

  function parseLabeledList(body: string): Record<string, string> {
    const map: Record<string, string> = {}
    const lines = body.split('\n')
    let currentLabel = ''
    for (const line of lines) {
      const m = line.match(/^([^\n,]+):\s*$/)
      if (m) currentLabel = m[1].trim()
      else if (currentLabel) {
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
    if (title === 'Казан') out.kazan = parseLabeledList(body)
    else if (title === 'Ширина мангала') out.shirina_mangala = parseLabeledList(body)
  }
  return out
}

function toFilterKey(folderName: string): string {
  return folderName.replace(/_/g, ' ')
}

function resolveFilterKey(fkey: string, map: Record<string, string>): string | undefined {
  if (map[fkey]) return map[fkey]
  for (const [k, v] of Object.entries(map)) {
    if (k === fkey || k.toLowerCase() === fkey.toLowerCase() || k.startsWith(fkey + ' ') || k.startsWith(fkey + ',')) return v
  }
  return undefined
}

function parseVkluchaet(vnutri: Record<string, string>): { stolik: string; moyka: string; koptilnya: string; tandyr: string } {
  const txt = (vnutri['Включает'] || '').toLowerCase()
  return {
    stolik: /столешниц|столик/.test(txt) ? 'Есть' : 'Нет',
    moyka: /мойк/.test(txt) ? 'Есть' : 'Нет',
    koptilnya: /коптильн/.test(txt) ? 'Есть' : 'Нет',
    tandyr: /тандыр/.test(txt) ? 'Есть' : 'Нет'
  }
}

function extractKazanFromVkluchaet(vnutri: Record<string, string>): string | null {
  const txt = vnutri['Включает'] || ''
  const m = txt.match(/казан[^,]*до\s*(\d+)\s*литров|под\s+казан[^,]*до\s*(\d+)\s*литров/i)
  if (!m) return null
  const litr = parseInt(m[1] || m[2] || '0', 10)
  if (litr <= 7) return 'до 7 литров'
  if (litr <= 12) return 'до 12 литров'
  if (litr <= 19) return 'до 19 литров'
  if (litr <= 25) return 'до 25 литров'
  return 'до 25 литров'
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
    console.log(`   Фильтры: ${Object.keys(filterMap).join(', ')}`)
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
    if (existing) seenKeys.set(key, preferFolder(f, existing))
    else seenKeys.set(key, f)
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

    if (filterMap.kazan) filterValues.kazan = resolveFilterKey(fkey, filterMap.kazan)
    if (!filterValues.kazan) filterValues.kazan = extractKazanFromVkluchaet(vnutri)
    if (filterMap.shirina_mangala) filterValues.shirina_mangala = resolveFilterKey(fkey, filterMap.shirina_mangala)
    if (!filterValues.shirina_mangala) {
      const mangalVal = vnutri['Размер мангала'] || vnutri['Размеры мангала(камина)'] || vnutri['Размер мангала(камина)']
      const wMatch = mangalVal?.match(/(\d+)\s*мм/)
      if (wMatch) {
        const w = parseInt(wMatch[1], 10)
        if (w <= 630) filterValues.shirina_mangala = 'до 630мм'
        else if (w <= 770) filterValues.shirina_mangala = 'до 770мм'
        else if (w <= 890) filterValues.shirina_mangala = 'до 890мм'
        else if (w <= 1020) filterValues.shirina_mangala = 'до 1020мм'
        else if (w <= 1140) filterValues.shirina_mangala = 'до 1140мм'
        else if (w <= 1270) filterValues.shirina_mangala = 'до 1270мм'
        else filterValues.shirina_mangala = 'до 1400мм'
      }
    }

    const vkl = parseVkluchaet(vnutri)
    filterValues.stolik = vkl.stolik
    filterValues.moyka = vkl.moyka
    filterValues.koptilnya = vkl.koptilnya
    filterValues.tandyr = vkl.tandyr

    const brickVal = vnutri['Количество кирпичей'] || vnutri['Количество кирпича']
    const brickNum = brickVal ? parseBrickCount(brickVal) : null
    if (brickNum != null) filterValues.kirpichi = brickCountToRange(brickNum)

    const gabVal = vnutri['Габариты']
    const footprint = gabVal ? parseFootprint(gabVal) : null
    if (footprint != null) filterValues.gabarity = footprintToRange(footprint)

    const technicalSpecs = buildTechnicalSpecs(vnutri) || desc.trim() || ''

    const adv: string[] = []
    if (filterValues.kazan) adv.push(`Казан ${filterValues.kazan}`)
    if (filterValues.kirpichi) adv.push(`Количество кирпичей ${filterValues.kirpichi}`)
    adv.push('Казан + Барбекю — зона готовки')
    adv.push('Проект ProektMangal — проверенные решения')

    const sellingDesc = [
      `${title} — комплекс с казаном и барбекю для загородного дома.`,
      `Кирпичная кладка обеспечивает долговечность. Проект разработан ProektMangal.`
    ].join('\n\n')

    const specs: Record<string, unknown> = {
      pricePanels: [{
        title: 'Характеристики',
        isMainPrice: true,
        options: [{ label: 'Основные', price: price, description: sellingDesc, technicalSpecs: technicalSpecs || undefined }]
      }],
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
      folderName, slug, title, price, area: 20,
      description: sellingDesc || desc || undefined,
      technicalSpecs: technicalSpecs || null,
      advantages: adv, specs, mainImage, images: uniqueImages, videoUrl, filterValues
    })
  }

  const deleted = await prisma.project.deleteMany({ where: { subsectionId: subsection.id } })
  console.log(`   Удалено старых: ${deleted.count}`)

  for (const p of projects) {
    await prisma.project.create({
      data: {
        id: `proj-${p.slug}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        slug: p.slug, subsectionId: subsection.id, subsubsectionId: null,
        title: p.title, area: p.area, priceFrom: p.price, priceTo: null,
        floors: 1, material: 'кирпич', buildTime: 14, completion: 'под ключ', region: '',
        image: p.mainImage, images: p.images, tags: [], hasTerrasse: false, hasBath: false, hasGarage: false,
        features: [], description: (p.description || null) as string | null,
        technicalSpecs: (p.technicalSpecs || null) as string | null,
        advantages: p.advantages || [], specs: p.specs as object | null,
        filterValues: Object.keys(p.filterValues).length > 0 ? p.filterValues : null,
        videoUrl: p.videoUrl, updatedAt: new Date()
      }
    })
  }

  const kazanOpts = [...new Set(projects.map(p => (p.filterValues.kazan as string)).filter(Boolean))].sort()
  const shirinaOpts = [...new Set(projects.map(p => (p.filterValues.shirina_mangala as string)).filter(Boolean))].sort()
  const gabarityOpts = [...new Set(projects.map(p => (p.filterValues.gabarity as string)).filter(Boolean))].sort()
  const kirpichiOpts = [...new Set(projects.map(p => (p.filterValues.kirpichi as string)).filter(Boolean))].sort()

  const filtersConfig: Record<string, unknown> = {
    price: { title: 'Цена', type: 'range' as const, min: 0, max: 50000, step: 500 },
    stolik: { title: 'Столик / столешница', type: 'checkboxes' as const, options: [{ label: 'Есть', value: 'Есть' }, { label: 'Нет', value: 'Нет' }] },
    moyka: { title: 'Мойка', type: 'checkboxes' as const, options: [{ label: 'Есть', value: 'Есть' }, { label: 'Нет', value: 'Нет' }] },
    koptilnya: { title: 'Коптильня', type: 'checkboxes' as const, options: [{ label: 'Есть', value: 'Есть' }, { label: 'Нет', value: 'Нет' }] },
    tandyr: { title: 'Тандыр', type: 'checkboxes' as const, options: [{ label: 'Есть', value: 'Есть' }, { label: 'Нет', value: 'Нет' }] },
    ...(kazanOpts.length > 0 && { kazan: { title: 'Казан', type: 'checkboxes' as const, options: kazanOpts.map(v => ({ label: v, value: v })) } }),
    ...(shirinaOpts.length > 0 && { shirina_mangala: { title: 'Ширина мангала', type: 'checkboxes' as const, options: shirinaOpts.map(v => ({ label: v, value: v })) } }),
    ...(gabarityOpts.length > 0 && { gabarity: { title: 'Габариты', type: 'checkboxes' as const, options: gabarityOpts.map(v => ({ label: v, value: v })) } }),
    ...(kirpichiOpts.length > 0 && { kirpichi: { title: 'Количество кирпичей', type: 'checkboxes' as const, options: kirpichiOpts.map(v => ({ label: v, value: v })) } })
  }

  const existingCfg = await prisma.catalogFiltersConfig.findFirst({ where: { subsectionId: subsection.id } })
  if (existingCfg) {
    await prisma.catalogFiltersConfig.update({ where: { id: existingCfg.id }, data: { config: filtersConfig, updatedAt: new Date() } })
  } else {
    await prisma.catalogFiltersConfig.create({
      data: { id: `cfg-${subsectionConfig.subsectionSlug}-${Date.now()}`, config: filtersConfig, sectionId: subsection.sectionId, subsectionId: subsection.id, updatedAt: new Date() }
    })
  }

  console.log(`   Создано проектов: ${projects.length}`)
}

async function main() {
  console.log('🔥 Загрузка проектов: Казан + Барбекю...\n')

  let section = await prisma.catalogSection.findFirst({
    where: { OR: [{ slug: 'kazan-barbeku' }, { title: { contains: 'КАЗАН', mode: 'insensitive' } }] }
  })
  if (!section) {
    const existingByTitle = await prisma.catalogSection.findFirst({
      where: { title: { equals: 'КАЗАН + БАРБЕКЮ', mode: 'insensitive' } }
    })
    if (existingByTitle) section = existingByTitle
    else {
      section = await prisma.catalogSection.create({
        data: {
          id: `sec-kazan-${Date.now()}`,
          title: 'КАЗАН + БАРБЕКЮ',
          slug: 'kazan-barbeku',
          order: 100,
          updatedAt: new Date()
        }
      })
      console.log('   Создан раздел:', section.title)
    }
  }

  const titles: Record<string, string> = {
    'kazan-barbeku-s-1-po-100-proekty': 'Казан + Барбекю с 1 по 100 проекты',
    'kazan-barbeku-ii-s-101-po-200-proekty': 'Казан + Барбекю II с 101 по 200 проекты'
  }

  for (const subConf of SUBSECTIONS) {
    let subsection = await prisma.catalogSubsection.findFirst({
      where: { slug: subConf.subsectionSlug, sectionId: section!.id },
      include: { section: true }
    })
    if (!subsection) {
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

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
