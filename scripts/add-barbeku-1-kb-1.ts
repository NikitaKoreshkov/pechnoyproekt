/**
 * Добавляет только Барбекю 1 и КБ 1 в БД без удаления остальных.
 * Запуск: npx tsx scripts/add-barbeku-1-kb-1.ts
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()
const BASE = path.join(process.cwd(), 'парсер')
const PUBLIC_BASE = path.join(process.cwd(), 'public', 'images')
const PLACEHOLDER_IMAGE = '/images/1.png'

const ADDITIONS = [
  {
    folderName: 'Барбекю_1',
    projectsDir: path.join(BASE, 'Мангалы (со столиками или мойками)', 'проект'),
    filtersPath: path.join(BASE, 'Мангалы (со столиками или мойками)', 'фильтры', 'filters.txt'),
    publicDir: path.join(PUBLIC_BASE, 'mangaly'),
    subsectionSlug: 'mangaly-so-stolikami-ili-moikami',
    slugPrefix: 'mangaly-',
    imgDir: 'mangaly'
  },
  {
    folderName: 'КБ_1',
    projectsDir: path.join(BASE, 'Казан + Барбекю', 'Казан_+_Барбекю_с_1_по_100_проекты', 'проект'),
    filtersPath: path.join(BASE, 'Казан + Барбекю', 'Казан_+_Барбекю_с_1_по_100_проекты', 'фильтры', 'filters.txt'),
    publicDir: path.join(PUBLIC_BASE, 'kazan-1'),
    subsectionSlug: 'kazan-barbeku-s-1-po-100-proekty',
    slugPrefix: 'kb-',
    imgDir: 'kazan-1'
  }
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
  for (const line of content.split('\n')) {
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
    const trimmed = (v as string).trim()
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
    let currentLabel = ''
    for (const line of body.split('\n')) {
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

function resolveFilterKey(fkey: string, map: Record<string, string>): string | undefined {
  if (map[fkey]) return map[fkey]
  for (const [k, v] of Object.entries(map)) {
    if (k === fkey || k.toLowerCase() === fkey.toLowerCase() || k.startsWith(fkey + ' ') || k.startsWith(fkey + ',')) return v
  }
  return undefined
}

function parseVkluchaetMangaly(vnutri: Record<string, string>): { stolik: string; moyka: string } {
  const txt = (vnutri['Включает'] || '').toLowerCase()
  return {
    stolik: /столешниц|столик/.test(txt) ? 'Есть' : 'Нет',
    moyka: /мойк/.test(txt) ? 'Есть' : 'Нет'
  }
}

function parseVkluchaetKazan(vnutri: Record<string, string>) {
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

async function addOne(cfg: typeof ADDITIONS[0], isMangaly: boolean) {
  const { folderName, projectsDir, filtersPath, publicDir, subsectionSlug, slugPrefix, imgDir } = cfg

  const projPath = path.join(projectsDir, folderName)
  if (!fs.existsSync(projPath)) {
    console.log(`   ⚠️ Папка не найдена: ${projPath}`)
    return
  }

  const subsection = await prisma.catalogSubsection.findFirst({
    where: { slug: subsectionSlug }
  })
  if (!subsection) {
    console.log(`   ⚠️ Подраздел не найден: ${subsectionSlug}`)
    return
  }

  const base = folderName.replace(/[^a-zA-Z0-9\u0400-\u04FF]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase()
  const slug = `${slugPrefix}${base || '1'}`

  const existing = await prisma.project.findFirst({ where: { slug } })
  if (existing) {
    console.log(`   ⏭️ Уже есть в БД: ${slug}`)
    return
  }

  const snaružiPath = path.join(projPath, 'снаружи', 'info.txt')
  const vnutriPath = path.join(projPath, 'внутри', 'info.txt')
  const snaruži = parseInfoTxt(snaružiPath)
  const vnutri = parseInfoTxt(vnutriPath)
  const title = snaruži['Название'] || folderName.replace(/_/g, ' ')
  const priceRaw = snaruži['Цена'] || vnutri['Цена'] || '0'
  const price = parsePrice(priceRaw)
  const desc = vnutri['Описание'] || ''
  const videoUrl = extractVideoUrl(vnutri)

  const filterMap = parseFiltersTxt(filtersPath)
  const fkey = folderName.replace(/_/g, ' ')
  const filterValues: Record<string, unknown> = {}

  if (filterMap.shirina_mangala) filterValues.shirina_mangala = resolveFilterKey(fkey, filterMap.shirina_mangala)
  if (!filterValues.shirina_mangala) {
    const mangalVal = vnutri['Размер мангала'] || vnutri['Размеры мангала(камина)'] || vnutri['Размер мангала(камина)']
    const wMatch = mangalVal?.match(/(\d+)\s*мм/)
    if (wMatch) {
      const w = parseInt(wMatch[1], 10)
      if (isMangaly) {
        filterValues.shirina_mangala = `${wMatch[1]}мм`
      } else {
        if (w <= 630) filterValues.shirina_mangala = 'до 630мм'
        else if (w <= 770) filterValues.shirina_mangala = 'до 770мм'
        else if (w <= 890) filterValues.shirina_mangala = 'до 890мм'
        else if (w <= 1020) filterValues.shirina_mangala = 'до 1020мм'
        else if (w <= 1140) filterValues.shirina_mangala = 'до 1140мм'
        else if (w <= 1270) filterValues.shirina_mangala = 'до 1270мм'
        else filterValues.shirina_mangala = 'до 1400мм'
      }
    }
  }

  if (isMangaly) {
    const vkl = parseVkluchaetMangaly(vnutri)
    filterValues.stolik = vkl.stolik
    filterValues.moyka = vkl.moyka
  } else {
    if (filterMap.kazan) filterValues.kazan = resolveFilterKey(fkey, filterMap.kazan)
    if (!filterValues.kazan) filterValues.kazan = extractKazanFromVkluchaet(vnutri)
    const vkl = parseVkluchaetKazan(vnutri)
    filterValues.stolik = vkl.stolik
    filterValues.moyka = vkl.moyka
    filterValues.koptilnya = vkl.koptilnya
    filterValues.tandyr = vkl.tandyr
  }

  const brickVal = vnutri['Количество кирпичей'] || vnutri['Количество кирпича']
  const brickNum = brickVal ? parseBrickCount(brickVal) : null
  if (brickNum != null) filterValues.kirpichi = brickCountToRange(brickNum)

  const gabVal = vnutri['Габариты']
  const footprint = gabVal ? parseFootprint(gabVal) : null
  if (footprint != null) filterValues.gabarity = footprintToRange(footprint)

  const technicalSpecs = buildTechnicalSpecs(vnutri) || desc.trim() || ''
  const adv: string[] = []
  if (filterValues.shirina_mangala) adv.push(`Ширина мангала ${filterValues.shirina_mangala}`)
  if (filterValues.kirpichi) adv.push(`Количество кирпичей ${filterValues.kirpichi}`)
  if (isMangaly) {
    adv.push('Мангал со столиком или мойкой')
  } else {
    if (filterValues.kazan) adv.push(`Казан ${filterValues.kazan}`)
    adv.push('Казан + Барбекю — зона готовки')
  }
  adv.push('Проект ProektMangal — проверенные решения')

  const sellingDesc = isMangaly
    ? `${title} — мангал со столиком или мойкой для загородного дома. Удобная зона готовки и отдыха.\n\nКирпичная кладка обеспечивает долговечность. Проект разработан ProektMangal.`
    : `${title} — комплекс с казаном и барбекю для загородного дома.\n\nКирпичная кладка обеспечивает долговечность. Проект разработан ProektMangal.`

  const specs = {
    pricePanels: [{ title: 'Характеристики', isMainPrice: true, options: [{ label: 'Основные', price: price, description: sellingDesc, technicalSpecs: technicalSpecs || undefined }] }],
    technicalSpecsPanelIdx: 0,
    descriptionPanelIdx: 0,
    fieldPanelMap: {}
  }

  const snaruziDir = path.join(projPath, 'снаружи')
  const vnutriDir = path.join(projPath, 'внутри')
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

  let mainImage = PLACEHOLDER_IMAGE
  const images: string[] = []
  const srcMain = findFirstImage(snaruziDir) || findFirstImage(imgsDir) || findFirstImage(vnutriDir)

  if (srcMain) {
    const destDir = path.join(publicDir, folderName)
    fs.mkdirSync(destDir, { recursive: true })
    const ext = path.extname(srcMain)
    const destPath = path.join(destDir, `main${ext}`)
    try {
      fs.copyFileSync(srcMain, destPath)
      mainImage = `/images/${imgDir}/${folderName}/main${ext}`
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
          images.push(`/images/${imgDir}/${folderName}/${f}`)
        } catch (_) {}
      })
  }
  addImagesFromDir(snaruziDir)
  addImagesFromDir(imgsDir)
  addImagesFromDir(vnutriDir)
  if (mainImage === PLACEHOLDER_IMAGE && images[0]) mainImage = images[0]
  const uniqueImages = [...new Set(images)].filter(u => u !== mainImage)

  await prisma.project.create({
    data: {
      id: `proj-${slug}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      slug,
      subsectionId: subsection.id,
      subsubsectionId: null,
      title,
      area: 20,
      priceFrom: price,
      priceTo: null,
      floors: 1,
      material: 'кирпич',
      buildTime: 14,
      completion: 'под ключ',
      region: '',
      image: mainImage,
      images: uniqueImages,
      tags: [],
      hasTerrasse: false,
      hasBath: false,
      hasGarage: false,
      features: [],
      description: sellingDesc || desc || null,
      technicalSpecs: technicalSpecs || null,
      advantages: adv,
      specs,
      filterValues: Object.keys(filterValues).length > 0 ? filterValues : null,
      videoUrl: videoUrl,
      updatedAt: new Date()
    }
  })
  console.log(`   ✅ Добавлен: ${title} (${slug})`)
}

async function main() {
  console.log('➕ Добавляю только Барбекю 1 и КБ 1 (без удаления)...\n')

  await addOne(ADDITIONS[0], true)
  await addOne(ADDITIONS[1], false)

  console.log('\n✅ Готово')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
