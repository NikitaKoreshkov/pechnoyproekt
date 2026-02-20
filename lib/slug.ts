/**
 * Генерация slug из названия (например, для проектов).
 * Транслитерация русских букв, нормализация, без ручного ввода.
 */

const RU_TO_LAT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya'
}

function transliterate(char: string): string {
  const lower = char.toLowerCase()
  if (RU_TO_LAT[lower] !== undefined) return RU_TO_LAT[lower]
  if (/[a-z0-9]/.test(char)) return lower
  if (char === ' ' || char === '-' || char === '_') return '-'
  return ''
}

/**
 * Генерирует URL‑slug из названия (рус/лат, цифры).
 * Пример: "Труба ПНД 32 мм" → "truba-pnd-32-mm"
 */
export function slugFromTitle(title: string): string {
  if (!title || typeof title !== 'string') return ''
  const out: string[] = []
  let prevDash = false
  for (let i = 0; i < title.length; i++) {
    const c = title[i]
    const s = transliterate(c)
    if (s === '-') {
      if (!prevDash) { out.push('-'); prevDash = true }
    } else if (s) {
      out.push(s)
      prevDash = false
    }
  }
  return out
    .join('')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120) || ''
}
