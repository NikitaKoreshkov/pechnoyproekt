/**
 * Скрипт для удаления брендинга АкваГазТех и тематики труб из базы данных.
 * Заменяет на нейтральные универсальные значения.
 * Запуск: npx ts-node scripts/remove-company-branding.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Начинаю обновление базы данных...')

  // 1. FooterConfig
  const footer = await prisma.footerConfig.findFirst()
  if (footer) {
    await prisma.footerConfig.update({
      where: { id: footer.id },
      data: {
        companyName: 'Компания',
        companyDescription: 'Качественные услуги и продукция. Надёжно, выгодно, с гарантией качества.',
        whatsappText: 'Здравствуйте! Хочу узнать больше о ваших услугах.\n\nГотов(а) ответить на ваши вопросы!',
        copyright: '© 2025. Все права защищены.',
        ip: '',
      },
    })
    console.log('✅ FooterConfig обновлён')
  }

  // 2. HeaderConfig
  const headers = await prisma.headerConfig.findMany()
  for (const h of headers) {
    await prisma.headerConfig.update({
      where: { id: h.id },
      data: { logoText: 'Сайт' },
    })
  }
  if (headers.length) console.log('✅ HeaderConfig обновлён')

  // 3. ProcessStepsConfig (AboutCompany)
  const processSteps = await prisma.processStepsConfig.findFirst()
  if (processSteps) {
    let parsed: any = {}
    try {
      parsed = typeof processSteps.steps === 'string' ? JSON.parse(processSteps.steps) : processSteps.steps
    } catch {}
    const mainMission = (parsed.mainMission || '').replace(/АкваГазТех|труб[ыа-я]*|ПНД|комплектующих/gi, '') || 'Основная миссия компании — обеспечить ваши задачи качественными решениями.'
    const specialization = (parsed.specialization || '').replace(/труб[ыа-я]*|ПНД|комплектующих|водопровод[а-я]*|канализаци[а-я]*|газопровод[а-я]*/gi, '') || 'Мы специализируемся на поставках качественной продукции и услуг.'
    const conclusion = (parsed.conclusion || '').replace(/АкваГазТех|труб[ыа-я]*/gi, '') || 'Выбирая нас, вы выбираете надёжность, проверенную временем и успешными проектами.'
    const advantages = (parsed.advantages || []).map((a: any) => ({
      ...a,
      title: (a.title || '').replace(/труб|фитингов|ПНД/gi, ''),
      description: (a.description || '').replace(/труб|фитингов|ПНД|герметичность|соединений/gi, 'продукции'),
    }))
    await prisma.processStepsConfig.update({
      where: { id: processSteps.id },
      data: {
        title: 'Ваш надёжный партнёр',
        steps: { ...parsed, mainMission, specialization, conclusion, advantages },
      },
    })
    console.log('✅ ProcessStepsConfig обновлён')
  }

  // 4. SiteMetadataConfig
  const metadata = await prisma.siteMetadataConfig.findFirst()
  if (metadata) {
    await prisma.siteMetadataConfig.update({
      where: { id: metadata.id },
      data: {
        siteTitle: 'Каталог | Сайт',
        siteDescription: 'Качественная продукция и услуги. Широкий ассортимент, быстрая доставка, гарантия качества.',
        siteKeywords: 'каталог, продукция, услуги, доставка, качество',
      },
    })
    console.log('✅ SiteMetadataConfig обновлён')
  }

  // 5. HeroConfig
  const hero = await prisma.heroConfig.findFirst()
  if (hero) {
    await prisma.heroConfig.update({
      where: { id: hero.id },
      data: {
        title: hero.title?.includes('труб') ? 'Каталог продукции и услуг' : hero.title,
        subtitle: hero.subtitle?.includes('труб') ? 'Надёжно. Выгодно. С гарантией качества.' : hero.subtitle,
      },
    })
    console.log('✅ HeroConfig обновлён')
  }

  // 6. AdvantagesConfig
  const adv = await prisma.advantagesConfig.findFirst()
  if (adv) {
    await prisma.advantagesConfig.update({
      where: { id: adv.id },
      data: { subtitle: 'Почему клиенты выбирают именно нас' },
    })
    console.log('✅ AdvantagesConfig обновлён')
  }

  // 7. CatalogSeoTextConfig
  const catalogSeo = await prisma.catalogSeoTextConfig.findFirst()
  if (catalogSeo) {
    await prisma.catalogSeoTextConfig.update({
      where: { id: catalogSeo.id },
      data: {
        title: 'Каталог продукции',
        content: (catalogSeo.content || '').replace(/АкваГазТех|труб[ыа-я]*|ПНД|комплектующих|фитингов|водопровод[а-я]*|канализаци[а-я]*|газопровод[а-я]*/gi, 'продукции').substring(0, 2000),
      },
    })
    console.log('✅ CatalogSeoTextConfig обновлён')
  }

  console.log('✅ Обновление базы данных завершено.')
}

main()
  .catch((e) => {
    console.error('Ошибка:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
