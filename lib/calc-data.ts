import { readFile, readdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const PARSER_ROOT = join(process.cwd(), 'парсер')
const CALC_ROOT = join(PARSER_ROOT, 'калькулятор')

export interface CalcOption {
  id: string
  name: string
  price: number
  image: string
  sortOrder: number
}

function nameToImageFilename(name: string): string {
  return name
    .replace(/\s+/g, '_')
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\./g, '') + '.png'
}

export async function parseProjectsTxt(
  variant: 'стандарт' | 'вип',
  optionType: 'основное' | 'дополнительное'
): Promise<CalcOption[]> {
  const baseDir = join(CALC_ROOT, variant, optionType)
  const txtPath = join(baseDir, 'projects.txt')
  const fotoDir = join(baseDir, 'фото')

  if (!existsSync(txtPath)) return []

  const content = await readFile(txtPath, 'utf-8')
  const blocks = content.split(/\n\n+/).filter(Boolean)
  const options: CalcOption[] = []
  let sortOrder = 0

  for (const block of blocks) {
    const lines = block.trim().split('\n')
    if (lines.length < 2) continue

    const nameMatch = lines[0].match(/^\d+\)\s+(.+)$/)
    const priceMatch = lines[1].match(/(\d+)\s*руб\.?/i)
    if (!nameMatch || !priceMatch) continue

    const name = nameMatch[1].trim()
    const price = parseInt(priceMatch[1], 10)
    const imgName = nameToImageFilename(name)
    const imgPath = existsSync(join(fotoDir, imgName))
      ? `/parser/калькулятор/${variant}/${optionType}/фото/${imgName}`
      : ''

    const id = `${variant}-${optionType}-${sortOrder + 1}`

    options.push({
      id,
      name,
      price,
      image: imgPath,
      sortOrder: sortOrder++,
    })
  }

  return options
}

export async function getCalcMainOptions(variant: 'стандарт' | 'вип'): Promise<CalcOption[]> {
  return parseProjectsTxt(variant, 'основное')
}

export async function getCalcExtraOptions(variant: 'стандарт' | 'вип'): Promise<CalcOption[]> {
  return parseProjectsTxt(variant, 'дополнительное')
}

export async function getAllCalcOptions(): Promise<{
  standard: { main: CalcOption[]; extra: CalcOption[] }
  vip: { main: CalcOption[]; extra: CalcOption[] }
}> {
  const [standardMain, standardExtra, vipMain, vipExtra] = await Promise.all([
    getCalcMainOptions('стандарт'),
    getCalcExtraOptions('стандарт'),
    getCalcMainOptions('вип'),
    getCalcExtraOptions('вип'),
  ])
  return {
    standard: { main: standardMain, extra: standardExtra },
    vip: { main: vipMain, extra: vipExtra },
  }
}
