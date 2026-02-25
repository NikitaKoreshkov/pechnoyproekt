import { readFile, readdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const PARSER_ROOT = join(process.cwd(), 'парсер')

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-zа-яё0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function unslugify(slug: string): string {
  return slug.replace(/-/g, ' ')
}

function normalizeBlockText(text: string): string {
  const collapsed = text.replace(/\s+/g, ' ').trim()
  if (!collapsed) return ''
  return collapsed.replace(/(^|[.!?]\s+)([а-яёa-z])/g, (_, p1, p2) => p1 + p2.toUpperCase())
}

export interface KladkaProject {
  slug: string
  name: string
  description: string
  image: string
  index: number
}

export interface TypeProject {
  slug: string
  name: string
  description: string
  image: string
  index: number
}

export interface VidProject {
  slug: string
  name: string
  description: string
  image: string
  index: number
}

export async function getKladkaProjects(): Promise<KladkaProject[]> {
  const projectsTxt = join(PARSER_ROOT, 'кладка', 'Снаружи', 'projects.txt')
  if (!existsSync(projectsTxt)) return []

  const content = await readFile(projectsTxt, 'utf-8')
  const projects: KladkaProject[] = []
  const blocks = content.split(/\n(?=\d+\)\s)/).filter(Boolean)

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim()
    const match = block.match(/^\d+\)\s+(.+?)(?:\n\n|\n-\s|\n)([\s\S]*)$/s)
    if (!match) continue
    const name = match[1].trim()
    const description = normalizeBlockText((match[2] || '').split('\n')[0])
    const vnutriDir = join(PARSER_ROOT, 'кладка', 'Внутри', name, 'изображения')
    let image = ''
    if (existsSync(vnutriDir)) {
      const files = await readdir(vnutriDir)
      const sorted = files
        .filter((f) => /\.(jpg|jpeg|png)$/i.test(f))
        .sort((a, b) => {
          const numA = parseInt(a.match(/\d+/)?.[0] || '0', 10)
          const numB = parseInt(b.match(/\d+/)?.[0] || '0', 10)
          return numA - numB
        })
      const penultimate = sorted.length >= 2 ? sorted[sorted.length - 2] : sorted[0]
      if (penultimate) {
        image = `/parser/кладка/Внутри/${encodeURIComponent(name)}/изображения/${penultimate}`
      }
    }
    if (!image) {
      const photoNum = String(i + 1).padStart(2, '0')
      const fallback = `кладка/Снаружи/фото/${photoNum}.jpg`
      if (existsSync(join(PARSER_ROOT, fallback))) {
        image = `/parser/${fallback}`
      }
    }
    projects.push({
      slug: slugify(name),
      name,
      description,
      image,
      index: i + 1,
    })
  }
  return projects
}

export async function getTypeProjects(): Promise<TypeProject[]> {
  const projectsTxt = join(PARSER_ROOT, 'типы_печей', 'Снаружи', 'projects.txt')
  if (!existsSync(projectsTxt)) return []

  const content = await readFile(projectsTxt, 'utf-8')
  const projects: TypeProject[] = []
  const blocks = content.split(/\n(?=\d+\)\s)/).filter(Boolean)

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim()
    const match = block.match(/^\d+\)\s+(.+?)(?:\n\n|\n-\s)([\s\S]*)$/s)
    if (!match) continue
    const name = match[1].trim()
    const description = normalizeBlockText((match[2] || '').split('\n')[0].replace(/^-\s*/, ''))
    const vnutriDir = join(PARSER_ROOT, 'типы_печей', 'Внутри', name)
    let image = ''
    if (existsSync(vnutriDir)) {
      const imgDir = join(vnutriDir, 'изображения')
      if (existsSync(imgDir)) {
        const files = await readdir(imgDir)
        const jpg = files.find((f) => f.match(/^0?1\.(jpg|jpeg|png)$/i)) || files[0]
        if (jpg) {
          image = `/parser/типы_печей/Внутри/${encodeURIComponent(name)}/изображения/${jpg}`
        }
      }
    }
    projects.push({
      slug: slugify(name),
      name,
      description,
      image,
      index: i + 1,
    })
  }
  return projects
}

export async function getVidProjects(): Promise<VidProject[]> {
  const projectsTxt = join(PARSER_ROOT, 'вид', 'Снаружи', 'projects.txt')
  if (!existsSync(projectsTxt)) return []

  const content = await readFile(projectsTxt, 'utf-8')
  const projects: VidProject[] = []
  const blocks = content.split(/\n(?=\d+\)\s)/).filter(Boolean)

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim()
    const match = block.match(/^\d+\)\s+(.+?)(?:\n\n|\n)([\s\S]*)$/s)
    if (!match) continue
    const name = match[1].trim()
    if (!name.includes('Часть №')) continue
    const description = normalizeBlockText((match[2] || '').split('\n')[0])
    const photoNum = String(projects.length + 1).padStart(2, '0')
    const imagePath = `вид/Снаружи/фото/${photoNum}.jpg`
    const image = existsSync(join(PARSER_ROOT, imagePath)) ? `/parser/${imagePath}` : ''
    projects.push({
      slug: slugify(name),
      name,
      description,
      image,
      index: projects.length + 1,
    })
  }
  return projects
}

export interface ContentBlock {
  type: 'text' | 'photos'
  text?: string
  photoStart?: number
  photoEnd?: number
}

export async function getProjectDetail(
  category: 'kladka' | 'types' | 'vid',
  slug: string
): Promise<{ name: string; blocks: ContentBlock[]; imagePaths: string[] } | null> {
  const baseDir =
    category === 'kladka'
      ? join(PARSER_ROOT, 'кладка', 'Внутри')
      : category === 'vid'
        ? join(PARSER_ROOT, 'вид', 'Внутри')
        : join(PARSER_ROOT, 'типы_печей', 'Внутри')

  const dirs = await readdir(baseDir)
  const dirName = dirs.find((d) => slugify(d) === slug)
  if (!dirName) return null

  const textPath = join(baseDir, dirName, 'text.txt')
  const imgDir = join(baseDir, dirName, 'изображения')
  if (!existsSync(textPath)) return null

  let content = await readFile(textPath, 'utf-8')
  let name = dirName
  const headerMatch = content.match(
    /^(?:Проект|Тип|Часть):\s*(.+?)(?:\n|$)/m
  )
  if (headerMatch) name = headerMatch[1].trim()
  const dashIdx = content.indexOf('\n---\n')
  if (dashIdx >= 0) content = content.slice(dashIdx + 5)

  const blocks: ContentBlock[] = []

  const processText = (t: string) => {
    const normalized = normalizeBlockText(t)
    if (normalized) {
      blocks.push({ type: 'text', text: normalized })
    }
  }

  const photoRegex = /\[Фото\s+(\d+)(?:\s*[-–]\s*(\d+))?\]/gi
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = photoRegex.exec(content)) !== null) {
    const beforePhoto = content.slice(lastIndex, match.index).trim()
    if (beforePhoto) {
      const parts = beforePhoto.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
      if (parts.length) processText(parts.join('\n\n'))
    }
    const start = parseInt(match[1], 10)
    const end = match[2] ? parseInt(match[2], 10) : start
    blocks.push({
      type: 'photos',
      photoStart: start,
      photoEnd: end,
    })
    lastIndex = match.index + match[0].length
  }

  const afterLast = content.slice(lastIndex).trim()
  if (afterLast) {
    const parts = afterLast.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
    if (parts.length) processText(parts.join('\n\n'))
  }

  const imagePaths: string[] = []
  const basePrefix =
    category === 'kladka'
      ? `кладка/Внутри/${encodeURIComponent(dirName)}`
      : category === 'vid'
        ? `вид/Внутри/${encodeURIComponent(dirName)}`
        : `типы_печей/Внутри/${encodeURIComponent(dirName)}`
  if (existsSync(imgDir)) {
    const files = await readdir(imgDir)
    const sorted = files
      .filter((f) => /\.(jpg|jpeg|png)$/i.test(f))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || '0', 10)
        const numB = parseInt(b.match(/\d+/)?.[0] || '0', 10)
        return numA - numB
      })
    for (const f of sorted) {
      imagePaths.push(`/parser/${basePrefix}/изображения/${f}`)
    }
  }

  return { name, blocks, imagePaths }
}
