/**
 * Загрузка проектов Мангалы (со столиками или мойками)
 * Один раздел, проекты в парсер/Мангалы (со столиками или мойками)/проект/
 * Запуск: npx tsx scripts/seed-mangaly-projects.ts
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

const BASE = path.join(process.cwd(), 'парсер', 'Мангалы (со столиками или мойками)')
const PROJECTS_DIR = path.join(BASE, 'проект')
const FILTERS_PATH = path.join(BASE, 'фильтры', 'filters.txt')
const PUBLIC_DIR = path.join(process.cwd(), 'public', 'images', 'mangaly')
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
      if (m) {
        currentLabel = m[1].trim()
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
    if (title === 'Ширина мангала') {
      out.shirina_mangala = parseLabeledList(body)
    }
  }
  return out
}

function toFilterKey(folderName: string): string {
  return folderName.replace(/_/g, ' ')
}

function resolveFilterKey(fkey: string, map: Record<string, string>): string | undefined {
  if (map[fkey]) return map[fkey]
  for (const [k, v] of Object.entries(map)) {
    if (k === fkey || k.startsWith(fkey + ' ') || k.startsWith(fkey + ',')) return v
  }
  return undefined
}

function parseVkluchaet(vnutri: Record<string, string>): { stolik: string; moyka: string } {
  const txt = (vnutri['Включает'] || '').toLowerCase()
  return {
    stolik: /столешниц|столик/.test(txt) ? 'Есть' : 'Нет',
    moyka: /мойк/.test(txt) ? 'Есть' : 'Нет'
  }
}

async function main() {
  console.log('🔥 Загрузка проектов: Мангалы (со столиками или мойками)...\n')

  let section = await prisma.catalogSection.findFirst({
    where: {
      OR: [
        { slug: 'mangaly' },
        { slug: 'mangaly-so-stolikami-ili-moikami' },
        { title: { contains: 'МАНГАЛ', mode: 'insensitive' } }
      ]
    }
  })
  if (!section) {
    const existingByTitle = await prisma.catalogSection.findFirst({
      where: { title: { equals: 'МАНГАЛЫ', mode: 'insensitive' } }
    })
    if (existingByTitle) section = existingByTitle
    else {
      section = await prisma.catalogSection.create({
        data: {
          id: `sec-mangaly-${Date.now()}`,
          title: 'МАНГАЛЫ (СО СТОЛИКАМИ ИЛИ МОЙКАМИ)',
          slug: 'mangaly-so-stolikami-ili-moikami',
          order: 100,
          updatedAt: new Date()
        }
      })
      console.log('   Создан раздел:', section.title)
    }
  }

  let subsection = await prisma.catalogSubsection.findFirst({
    where: {
      OR: [
        { slug: 'mangaly', sectionId: section!.id },
        { slug: 'mangaly-so-stolikami-ili-moikami', sectionId: section!.id }
      ]
    },
    include: { section: true }
  })
  if (!subsection) {
    subsection = await prisma.catalogSubsection.create({
      data: {
        id: `sub-mangaly-${Date.now()}`,
        sectionId: section!.id,
        title: 'Мангалы (со столиками или мойками)',
        slug: 'mangaly-so-stolikami-ili-moikami',
        order: 0,
        updatedAt: new Date()
      },
      include: { section: true }
    })
    console.log('   Создан подраздел:', subsection.title)
  }

  const filterMap = parseFiltersTxt(FILTERS_PATH)
  if (Object.keys(filterMap).length > 0) {
    console.log(`   Фильтры: ${Object.keys(filterMap).join(', ')}`)
  }

  if (!fs.existsSync(PROJECTS_DIR)) {
    console.log(`   Папка не найдена: ${PROJECTS_DIR}`)
    return
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
    const fkey = filterKey(folderName)
    if (filterMap.shirina_mangala) {
      filterValues.shirina_mangala = resolveFilterKey(fkey, filterMap.shirina_mangala)
    }

    const brickVal = vnutri['Количество кирпичей'] || vnutri['Количество кирпича']
    const brickNum = brickVal ? parseBrickCount(brickVal) : null
    if (brickNum != null) filterValues.kirpichi = brickCountToRange(brickNum)

    const gabVal = vnutri['Габариты']
    const footprint = gabVal ? parseFootprint(gabVal) : null
    if (footprint != null) filterValues.gabarity = footprintToRange(footprint)

    const mangalVal = vnutri['Размер мангала'] || vnutri['Размер мангала(камина)'] || vnutri['Размеры мангала(камина)']
    if (!filterValues.shirina_mangala && mangalVal) {
      const wMatch = mangalVal.match(/(\d+)\s*мм/)
      if (wMatch) filterValues.shirina_mangala = `${wMatch[1]}мм`
    }

    const vkl = parseVkluchaet(vnutri)
    filterValues.stolik = vkl.stolik
    filterValues.moyka = vkl.moyka

    const technicalSpecs = buildTechnicalSpecs(vnutri) || desc.trim() || ''

    const adv: string[] = []
    if (filterValues.shirina_mangala) adv.push(`Ширина мангала ${filterValues.shirina_mangala}`)
    if (filterValues.kirpichi) adv.push(`Количество кирпичей ${filterValues.kirpichi}`)
    adv.push('Мангал со столиком или мойкой')
    adv.push('Проект ProektMangal — проверенные решения')

    const sellingDesc = [
      `${title} — мангал со столиком или мойкой для загородного дома. Удобная зона готовки и отдыха.`,
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
    const slug = `mangaly-${base || '1'}`

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
      const destDir = path.join(PUBLIC_DIR, folderName)
      fs.mkdirSync(destDir, { recursive: true })
      const ext = path.extname(srcMain)
      const destPath = path.join(destDir, `main${ext}`)
      try {
        fs.copyFileSync(srcMain, destPath)
        mainImage = `/images/mangaly/${folderName}/main${ext}`
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
          const destDir = path.join(PUBLIC_DIR, folderName)
          fs.mkdirSync(destDir, { recursive: true })
          const destPath = path.join(destDir, f)
          try {
            fs.copyFileSync(fullPath, destPath)
            images.push(`/images/mangaly/${folderName}/${f}`)
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

  const shirinaOpts = [...new Set(projects.map(p => (p.filterValues.shirina_mangala as string)).filter(Boolean))].sort()
  const gabarityOpts = [...new Set(projects.map(p => (p.filterValues.gabarity as string)).filter(Boolean))].sort()
  const kirpichiOpts = [...new Set(projects.map(p => (p.filterValues.kirpichi as string)).filter(Boolean))].sort()

  const filtersConfig: Record<string, unknown> = {
    price: { title: 'Цена', type: 'range' as const, min: 0, max: 50000, step: 500 },
    stolik: { title: 'Столик / столешница', type: 'checkboxes' as const, options: [{ label: 'Есть', value: 'Есть' }, { label: 'Нет', value: 'Нет' }] },
    moyka: { title: 'Мойка', type: 'checkboxes' as const, options: [{ label: 'Есть', value: 'Есть' }, { label: 'Нет', value: 'Нет' }] },
    ...(shirinaOpts.length > 0 && {
      shirina_mangala: { title: 'Ширина мангала', type: 'checkboxes' as const, options: shirinaOpts.map(v => ({ label: v, value: v })) }
    }),
    ...(gabarityOpts.length > 0 && {
      gabarity: { title: 'Габариты', type: 'checkboxes' as const, options: gabarityOpts.map(v => ({ label: v, value: v })) }
    }),
    ...(kirpichiOpts.length > 0 && {
      kirpichi: { title: 'Количество кирпичей', type: 'checkboxes' as const, options: kirpichiOpts.map(v => ({ label: v, value: v })) }
    })
  }

  const existingCfg = await prisma.catalogFiltersConfig.findFirst({ where: { subsectionId: subsection.id } })
  if (existingCfg) {
    await prisma.catalogFiltersConfig.update({ where: { id: existingCfg.id }, data: { config: filtersConfig, updatedAt: new Date() } })
  } else {
    await prisma.catalogFiltersConfig.create({
      data: {
        id: `cfg-mangaly-${Date.now()}`,
        config: filtersConfig,
        sectionId: subsection.sectionId,
        subsectionId: subsection.id,
        updatedAt: new Date()
      }
    })
  }

  console.log(`   Создано проектов: ${projects.length}`)
  console.log('\n✅ Готово')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
