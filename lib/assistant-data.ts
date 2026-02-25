/**
 * AI Assistant — группировка FAQ по темам
 * Данные загружаются из /api/faq (БД)
 */

export interface FAQItemFromAPI {
  id: string
  question: string
  answer: string
  order: number
}

export interface AssistantTheme {
  id: string
  title: string
  icon: string
  description: string
  keywords: string[] // для сопоставления с вопросами
}

/** Темы для группировки FAQ. Ключевые слова ищутся в вопросе (без учёта регистра). */
export const assistantThemesConfig: AssistantTheme[] = [
  {
    id: 'sroki-izgotovlenie',
    title: 'Сроки и изготовление',
    icon: '⏱',
    description: 'Сроки изготовления, поставки, сезон',
    keywords: ['срок', 'времени', 'изготовлен', 'недель', 'дней', 'днях', 'секунд', 'поставк', 'заказывать', 'сезон', 'лучше'],
  },
  {
    id: 'materialy',
    title: 'Материалы',
    icon: '🧱',
    description: 'Кирпич, смеси, комплектующие',
    keywords: ['материал', 'кирпич', 'труб', 'типы труб', 'пвх', 'полипропилен', 'фитинг', 'глинян', 'камень'],
  },
  {
    id: 'garantiya',
    title: 'Гарантия',
    icon: '🛡',
    description: 'Гарантия на работы и материалы',
    keywords: ['гарант', 'сертификат'],
  },
  {
    id: 'kalkulyator-katalog',
    title: 'Калькулятор и каталог',
    icon: '📂',
    description: 'Калькулятор, каталог, портфолио',
    keywords: ['калькулятор', 'каталог', 'воплощён', 'архитектур', 'сравнить', 'избранн', 'готовые проект', 'объект'],
  },
  {
    id: 'konfiguraciya',
    title: 'Конфигурация комплекса',
    icon: '⚙',
    description: 'Состав: мангал, печь, тандыр, коптильня',
    keywords: ['конфигурац', 'подобрать', 'пожелания', 'тандыр', 'печь', 'казан', 'коптильн', 'мойк', 'столешниц', 'арийск', 'русск', 'вип', 'участк', 'размер', 'секци', 'нестандарт', 'только', 'входит в печной', 'добавить'],
  },
  {
    id: 'dostavka-oplata',
    title: 'Доставка и оплата',
    icon: '💰',
    description: 'Доставка, цены, способы оплаты',
    keywords: ['доставк', 'оплат', 'стоимость', 'способ', 'наличными', 'перевод', 'договор', 'цена', 'стоит', 'зависит', 'рассрочк', 'кредит', 'регион'],
  },
  {
    id: 'dokumenty',
    title: 'Документы',
    icon: '📋',
    description: 'Документы для заказа',
    keywords: ['документ', 'паспорт', 'реквизит', 'акт', 'договор', 'смет', 'доверен', '44-фз', 'счёт', 'кадастр', 'экспертиз', 'чек', 'хранятся', 'организац'],
  },
  {
    id: 'montazh-stroitelstvo',
    title: 'Строительство и монтаж',
    icon: '🔧',
    description: 'Монтаж, фундамент, дымоход, ремонт',
    keywords: ['монтаж', 'зим', 'строит', 'услуг', 'фундамент', 'подготовк', 'проект', 'дымоход', 'вод', 'электричеств', 'ремонт', 'реконструкц', 'согласован', 'навес', 'беседк', 'высот'],
  },
  {
    id: 'obsluzhivanie',
    title: 'Обслуживание',
    icon: '📞',
    description: 'Поддержка, уход, эксплуатация',
    keywords: ['вопрос', 'сдач', 'после', 'связаться', 'оптов', 'ухаживать', 'прогревать', 'готовить', 'заявк', 'находитесь', 'компания', 'перезвон', 'приехать', 'посмотреть', 'коптить', 'инструкц', 'растопк'],
  },
  {
    id: 'obshchie',
    title: 'Общие вопросы',
    icon: '❓',
    description: 'Прочее',
    keywords: [],
  },
]

/** Сопоставляет вопрос с темой по ключевым словам */
function matchTheme(question: string, themes: AssistantTheme[]): AssistantTheme {
  const q = question.toLowerCase()
  for (const theme of themes) {
    if (theme.keywords.length > 0 && theme.keywords.some((kw) => q.includes(kw.toLowerCase()))) {
      return theme
    }
  }
  return themes.find((t) => t.id === 'obshchie') ?? themes[0]
}

export interface GroupedTheme {
  id: string
  title: string
  icon: string
  description: string
  questions: FAQItemFromAPI[]
}

/** Группирует FAQ из API по темам */
export function groupFAQIntoThemes(items: FAQItemFromAPI[]): GroupedTheme[] {
  const byThemeId = new Map<string, FAQItemFromAPI[]>()
  const themeMeta = new Map<string, AssistantTheme>()

  for (const item of items) {
    const theme = matchTheme(item.question, assistantThemesConfig)
    if (!byThemeId.has(theme.id)) {
      byThemeId.set(theme.id, [])
      themeMeta.set(theme.id, theme)
    }
    byThemeId.get(theme.id)!.push(item)
  }

  const result: GroupedTheme[] = []
  for (const [themeId, questions] of byThemeId) {
    const meta = themeMeta.get(themeId)!
    result.push({
      id: meta.id,
      title: meta.title,
      icon: meta.icon,
      description: meta.description,
      questions: questions.sort((a, b) => a.order - b.order),
    })
  }

  // Сортируем темы по порядку в конфиге
  const orderMap = new Map(assistantThemesConfig.map((t, i) => [t.id, i]))
  result.sort((a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99))
  return result
}

/** Возвращает до 5 связанных наводящих вопросов */
export function getFollowUpQuestions(
  currentQuestionId: string,
  allItems: FAQItemFromAPI[],
  sameThemeItems: FAQItemFromAPI[]
): FAQItemFromAPI[] {
  const others = sameThemeItems.filter((q) => q.id !== currentQuestionId)
  if (others.length <= 5) return others
  return others.slice(0, 5)
}
