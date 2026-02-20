/**
 * Удаляет из БД весь контент, связанный с мангалом. Остальной контент оставляет.
 * Запуск: npx tsx scripts/remove-mangal-content.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const MANGAL_KEYWORDS = [
  'мангал',
  'mangal',
  'барбекю',
  'barbecue',
  'барбекю',
  'гриль',
  'grill',
  'шашлык',
  'шашлычн',
  'коптил',
  'коптильн',
  'печь уличн',
  'очаг',
  'барбекюшниц',
]

function containsMangal(text: string | null | undefined): boolean {
  if (!text || typeof text !== 'string') return false
  const lower = text.toLowerCase()
  return MANGAL_KEYWORDS.some((k) => lower.includes(k.toLowerCase()))
}

function containsMangalInArray(arr: string[] | null | undefined): boolean {
  if (!arr || !Array.isArray(arr)) return false
  return arr.some((s) => containsMangal(String(s)))
}

function containsMangalInJson(obj: unknown): boolean {
  if (obj == null) return false
  const str = typeof obj === 'string' ? obj : JSON.stringify(obj)
  return containsMangal(str)
}

async function main() {
  console.log('🔍 Ищу контент, связанный с мангалом...\n')

  let deletedProjects = 0
  let deletedPopularItems = 0
  let deletedReviews = 0
  let deletedFaq = 0
  let updatedConfigs = 0

  // 1. Project — удалить проекты про мангал
  const projects = await prisma.project.findMany({
    select: { id: true, slug: true, title: true, description: true },
  })
  for (const p of projects) {
    if (
      containsMangal(p.title) ||
      containsMangal(p.description) ||
      containsMangal(p.slug)
    ) {
      await prisma.project.delete({ where: { id: p.id } })
      deletedProjects++
      console.log('  ❌ Удалён проект:', p.slug, '-', p.title)
    }
  }

  // 2. PopularItem — удалить элементы про мангал
  const popularItems = await prisma.popularItem.findMany({
    select: { id: true, title: true, description: true, slug: true },
  })
  for (const item of popularItems) {
    if (
      containsMangal(item.title) ||
      containsMangal(item.description) ||
      containsMangal(item.slug)
    ) {
      await prisma.popularItem.delete({ where: { id: item.id } })
      deletedPopularItems++
      console.log('  ❌ Удалён популярный элемент:', item.title)
    }
  }

  // 3. Review — удалить отзывы про мангал
  const reviews = await prisma.review.findMany({
    select: { id: true, name: true, text: true },
  })
  for (const r of reviews) {
    if (containsMangal(r.text) || containsMangal(r.name)) {
      await prisma.review.delete({ where: { id: r.id } })
      deletedReviews++
      console.log('  ❌ Удалён отзыв:', r.name)
    }
  }

  // 4. FAQItem — удалить вопросы/ответы про мангал
  const faqItems = await prisma.fAQItem.findMany({
    select: { id: true, question: true, answer: true },
  })
  for (const faq of faqItems) {
    if (containsMangal(faq.question) || containsMangal(faq.answer)) {
      await prisma.fAQItem.delete({ where: { id: faq.id } })
      deletedFaq++
      console.log('  ❌ Удалён FAQ:', faq.question.substring(0, 50) + '...')
    }
  }

  // 5. HeroConfig — если заголовок/подзаголовок про мангал, сбросить на трубы
  const hero = await prisma.heroConfig.findFirst()
  if (hero && (containsMangal(hero.title) || containsMangal(hero.subtitle))) {
    await prisma.heroConfig.update({
      where: { id: hero.id },
      data: {
        title: 'Трубы ПНД и комплектующие',
        subtitle: 'Качественно. Быстро. Надёжно. С гарантией.',
        heroImage: hero.heroImage?.includes('mangal') ? '/images/1.png' : hero.heroImage,
      },
    })
    updatedConfigs++
    console.log('  ✅ HeroConfig обновлён на контент про трубы')
  }

  // 6. HeaderConfig
  const header = await prisma.headerConfig.findFirst()
  if (header && containsMangal(header.logoText)) {
    await prisma.headerConfig.update({
      where: { id: header.id },
      data: { logoText: 'АкваГазТех' },
    })
    updatedConfigs++
    console.log('  ✅ HeaderConfig обновлён')
  }

  // 7. ProcessStepsConfig (steps JSON может содержать мангал)
  const processSteps = await prisma.processStepsConfig.findFirst()
  if (processSteps && containsMangalInJson(processSteps.steps)) {
    await prisma.processStepsConfig.update({
      where: { id: processSteps.id },
      data: {
        title: '«АкваГазТех» ваш надежный партнер',
        subtitle: '',
        steps: {
          mainMission: 'Поставка труб ПНД и комплектующих для инженерных систем.',
          specialization: 'Трубы ПНД (ПЭ), фитинги, комплектующие.',
          advantages: [
            { id: '1', title: 'Качество', description: 'Сертифицированные материалы.' },
            { id: '2', title: 'Сроки', description: 'Быстрая доставка.' },
            { id: '3', title: 'Поддержка', description: 'Консультации и подбор.' },
          ],
          conclusion: 'Работаем с юридическими и частными лицами.',
        },
      },
    })
    updatedConfigs++
    console.log('  ✅ ProcessStepsConfig обновлён на трубы')
  }

  // 8. AdvantagesConfig
  const advantages = await prisma.advantagesConfig.findFirst()
  if (advantages && containsMangalInJson(advantages.items)) {
    await prisma.advantagesConfig.update({
      where: { id: advantages.id },
      data: {
        title: 'Наши преимущества',
        subtitle: 'Почему клиенты выбирают именно нас',
        items: [
          { id: '1', title: 'Качество', description: 'Только сертифицированные трубы ПНД и комплектующие.' },
          { id: '2', title: 'Ассортимент', description: 'Широкий выбор диаметров и типов труб.' },
          { id: '3', title: 'Доставка', description: 'Быстрая доставка по региону и России.' },
        ],
      },
    })
    updatedConfigs++
    console.log('  ✅ AdvantagesConfig обновлён')
  }

  // 9. CatalogSeoTextConfig
  const catalogSeo = await prisma.catalogSeoTextConfig.findFirst()
  if (catalogSeo && (containsMangal(catalogSeo.title) || containsMangal(catalogSeo.content))) {
    await prisma.catalogSeoTextConfig.update({
      where: { id: catalogSeo.id },
      data: {
        title: 'Трубы ПНД и комплектующие',
        content: 'Поставка качественных труб ПНД (ПЭ) и комплектующих для водопровода, канализации и газопровода. Широкий ассортимент, быстрая доставка.',
      },
    })
    updatedConfigs++
    console.log('  ✅ CatalogSeoTextConfig обновлён')
  }

  // 10. FooterConfig — если есть мангал в текстах, сбросить на трубы
  const footer = await prisma.footerConfig.findFirst()
  if (footer) {
    const needsUpdate =
      containsMangal(footer.companyName) ||
      containsMangal(footer.companyDescription) ||
      containsMangal(footer.whatsappText) ||
      containsMangal(footer.newsletterDescription)
    if (needsUpdate) {
      await prisma.footerConfig.update({
        where: { id: footer.id },
        data: {
          companyName: 'АкваГазТех',
          companyDescription:
            'Поставка труб ПНД и комплектующих для инженерных систем. Качественно, надежно, с гарантией.',
          whatsappText:
            'АкваГазТех\n\nЗдравствуйте! Хочу узнать больше о трубах ПНД и комплектующих.\n\nГотов(а) ответить на ваши вопросы!',
          newsletterDescription:
            'Подпишитесь на рассылку и получайте информацию о новых поступлениях и специальных предложениях.',
        },
      })
      updatedConfigs++
      console.log('  ✅ FooterConfig обновлён')
    }
  }

  // 11. ReviewsConfig
  const reviewsConfig = await prisma.reviewsConfig.findFirst()
  if (
    reviewsConfig &&
    (containsMangal(reviewsConfig.title) || containsMangal(reviewsConfig.description))
  ) {
    await prisma.reviewsConfig.update({
      where: { id: reviewsConfig.id },
      data: {
        title: 'Реальные фото и отзывы наших клиентов',
        description:
          'Мы собрали часть отзывов от наших клиентов.\n\nОстальные отзывы можно посмотреть по запросу или в наших соцсетях.',
      },
    })
    updatedConfigs++
    console.log('  ✅ ReviewsConfig обновлён')
  }

  // 12. SiteMetadataConfig
  const metadata = await prisma.siteMetadataConfig.findFirst()
  if (
    metadata &&
    (containsMangal(metadata.siteTitle) ||
      containsMangal(metadata.siteDescription) ||
      containsMangal(metadata.siteKeywords))
  ) {
    await prisma.siteMetadataConfig.update({
      where: { id: metadata.id },
      data: {
        siteTitle: 'Трубы ПНД и комплектующие | АкваГазТех',
        siteDescription:
          'Поставка качественных труб ПНД (ПЭ) и комплектующих для водопровода, канализации и газопровода.',
        siteKeywords:
          'трубы ПНД, трубы ПЭ, комплектующие для труб, водопровод, канализация, газопровод, фитинги',
      },
    })
    updatedConfigs++
    console.log('  ✅ SiteMetadataConfig обновлён')
  }

  // 13. CalculatorConfig — если шаблоны про мангал, сбросить на нейтральные
  const calc = await prisma.calculatorConfig.findFirst()
  if (calc && (containsMangalInJson(calc.houseTypes) || containsMangalInJson(calc.stepTexts))) {
    // Минимально трогаем: только если явно мангал
    const houseTypes = Array.isArray(calc.houseTypes) ? calc.houseTypes : []
    const filtered = houseTypes.filter(
      (h: { name?: string }) => !containsMangal((h as { name?: string }).name)
    )
    if (filtered.length !== houseTypes.length) {
      await prisma.calculatorConfig.update({
        where: { id: calc.id },
        data: { houseTypes: filtered.length ? filtered : [{ id: '1', name: 'Трубы ПНД', basePrice: 0, image: '' }] },
      })
      updatedConfigs++
      console.log('  ✅ CalculatorConfig: убраны типы про мангал')
    }
  }

  console.log('\n📊 Итого:')
  console.log('  Удалено проектов:', deletedProjects)
  console.log('  Удалено популярных элементов:', deletedPopularItems)
  console.log('  Удалено отзывов:', deletedReviews)
  console.log('  Удалено FAQ:', deletedFaq)
  console.log('  Обновлено конфигов:', updatedConfigs)
  console.log('\n✅ Контент, связанный с мангалом, удалён. Остальной контент сохранён.')
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
