import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Создаём супер-админа, если указан в env
  const superEmail = process.env.SUPER_ADMIN_EMAIL
  const superPass = process.env.SUPER_ADMIN_PASSWORD
  if (superEmail && superPass) {
    const argon2 = await import('argon2')
    const passwordHash = await argon2.default.hash(superPass)
    await prisma.user.upsert({
      where: { email: superEmail.toLowerCase() },
      update: { role: 'SUPER_ADMIN', isActive: true, passwordHash },
      create: { email: superEmail.toLowerCase(), passwordHash, isActive: true, role: 'SUPER_ADMIN' }
    })
    console.log('✅ SUPER_ADMIN ensured')
  } else {
    console.log('ℹ️ Skip SUPER_ADMIN seed (no env provided)')
  }

  // Главный SUPER_ADMIN: email admin@example.com, пароль REDACTED-IN-HISTORY
  try {
    const argon2 = await import('argon2')
    const adminHash = await argon2.default.hash('REDACTED-IN-HISTORY')
    await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: { role: 'SUPER_ADMIN', isActive: true, passwordHash: adminHash },
      create: { email: 'admin@example.com', passwordHash: adminHash, isActive: true, role: 'SUPER_ADMIN', name: 'admin' }
    })
    // Удалим старых тестовых админов, если были
    await prisma.user.deleteMany({ where: { email: 'a@gmail.com' } })
    await prisma.user.deleteMany({ where: { email: 'admin@local' } })
    console.log('✅ SUPER_ADMIN admin@example.com / REDACTED-IN-HISTORY ensured')
  } catch (e) {
    console.log('⚠️ Could not ensure SUPER_ADMIN:', e)
  }

  // ——— Каталог: разделы и подразделы для труб ПНД ———
  await prisma.popularItem.deleteMany()
  await prisma.popularPanel.deleteMany()
  await prisma.project.deleteMany()
  await prisma.catalogSubsection.deleteMany()
  await prisma.catalogSection.deleteMany()
  console.log('✅ Старые проекты и каталог удалены')

  const sectionByNom = await (async () => {
    const sections: { title: string; slug: string; subs: { title: string; slug: string }[] }[] = [
      {
        title: 'Полиэтиленовые трубы',
        slug: 'polietilenovye-truby',
        subs: [
          { title: 'Труба полиэтиленовая водопроводная', slug: 'truba-polyetilen-vodoprovod' },
          { title: 'Технические трубы ПНД', slug: 'tehnicheskie-truby-pnd' },
          { title: 'Трубы ПНД газопроводные', slug: 'truby-pnd-gazoprovod' },
          { title: 'Труба ПНД Мультиклин', slug: 'truba-pnd-multiklin' },
          { title: 'Защитные трубы Р МЭК', slug: 'zashchitnye-truby-r-mek' },
          { title: 'Защитные трубы Р МЭК ПРО', slug: 'zashchitnye-truby-r-mek-pro' },
          { title: 'Защитные трубы Р МЭК Мультипро', slug: 'zashchitnye-truby-r-mek-multipro' },
          { title: 'Защитные трубы Р МЭК Мультипро НГ', slug: 'zashchitnye-truby-r-mek-multipro-ng' },
          { title: 'Обсадные трубы ПНД для скважин', slug: 'obsadnye-truby-pnd-skvazhin' },
          { title: 'Трубы AteRnoPlast в защитной оболочке', slug: 'truby-ateroplast' },
          { title: 'Листы ПНД и сварочный пруток', slug: 'listy-pnd-svarochnyy-prutok' },
          { title: 'Труба полиэтиленовая водопроводная ПЭ100+', slug: 'truba-polyetilen-pe100-plus' }
        ]
      },
      {
        title: 'Электросварные фитинги',
        slug: 'elektrosvarnye-fitingi',
        subs: [
          { title: 'Муфты электросварные', slug: 'mufty-elektrosvarnye' },
          { title: 'Отводы электросварные', slug: 'otvody-elektrosvarnye' },
          { title: 'Тройники электросварные', slug: 'troechniki-elektrosvarnye' },
          { title: 'Переходы электросварные', slug: 'perehody-elektrosvarnye' },
          { title: 'Заглушки электросварные', slug: 'zaglushki-elektrosvarnye' }
        ]
      },
      {
        title: 'Фитинги для ПНД труб',
        slug: 'fitingi-dlya-pnd-trub',
        subs: [
          { title: 'Компрессионные фитинги', slug: 'kompressionnye-fitingi' },
          { title: 'Фитинги под пайку', slug: 'fitingi-pod-payku' },
          { title: 'Фитинги разъёмные', slug: 'fitingi-razemnynye' },
          { title: 'Краны шаровые', slug: 'krany-sharovye' }
        ]
      },
      {
        title: 'Сварочное оборудование',
        slug: 'svarochnoe-oborudovanie',
        subs: [
          { title: 'Аппараты стыковой сварки', slug: 'apparaty-stykovoy-svarki' },
          { title: 'Электромуфтовые сварочные аппараты', slug: 'elektromuftovye-apparaty' },
          { title: 'Сварочные экструдеры', slug: 'svarochnye-ekstrudery' },
          { title: 'Инструмент для сварки ПНД', slug: 'instrument-dlya-svarki-pnd' }
        ]
      },
      {
        title: 'Гофрированные трубы',
        slug: 'gorfirovannye-truby',
        subs: [
          { title: 'Трубы ПНД гофрированные', slug: 'truby-pnd-gorfirovannye' },
          { title: 'Трубы ПВХ гофрированные', slug: 'truby-pvh-gorfirovannye' },
          { title: 'Трубы двухслойные гофрированные', slug: 'truby-dvuhsloynye-gorfirovannye' }
        ]
      },
      {
        title: 'Дренажные трубы',
        slug: 'drenazhnye-truby',
        subs: [
          { title: 'Дренажные трубы ПНД', slug: 'drenazhnye-truby-pnd' },
          { title: 'Дренажные трубы с геотекстилем', slug: 'drenazhnye-truby-geotekstil' },
          { title: 'Дренажные трубы перфорированные', slug: 'drenazhnye-truby-perforirovannye' }
        ]
      },
      {
        title: 'Трубы ПВХ',
        slug: 'truby-pvh',
        subs: [
          { title: 'Трубы ПВХ напорные', slug: 'truby-pvh-napornye' },
          { title: 'Трубы ПВХ безнапорные', slug: 'truby-pvh-beznapornye' },
          { title: 'Трубы ПВХ для канализации', slug: 'truby-pvh-kanalizaciya' }
        ]
      },
      {
        title: 'Полипропиленовые трубы',
        slug: 'polipropilenovye-truby',
        subs: [
          { title: 'Трубы ППР армированные', slug: 'truby-ppr-armirovannye' },
          { title: 'Трубы ППР неармированные', slug: 'truby-ppr-nearmirovannye' },
          { title: 'Трубы ППР для отопления', slug: 'truby-ppr-otoplenie' }
        ]
      },
      {
        title: 'Соединительная арматура',
        slug: 'soedinitelnaya-armatura',
        subs: [
          { title: 'Муфты соединительные', slug: 'mufty-soedinitelnye' },
          { title: 'Переходы', slug: 'perehody' },
          { title: 'Тройники и крестовины', slug: 'troechniki-krestoviny' }
        ]
      },
      {
        title: 'Запорная арматура',
        slug: 'zapornaya-armatura',
        subs: [
          { title: 'Краны шаровые', slug: 'krany-sharovye-zapornye' },
          { title: 'Задвижки', slug: 'zadvizhki' },
          { title: 'Вентили', slug: 'ventili' }
        ]
      },
      {
        title: 'Фланцы и детали',
        slug: 'flancy-i-detali',
        subs: [
          { title: 'Фланцы плоские', slug: 'flancy-ploskie' },
          { title: 'Фланцы воротниковые', slug: 'flancy-vorotnikovye' },
          { title: 'Фланцевые адаптеры', slug: 'flancevye-adaptery' }
        ]
      },
      {
        title: 'Пластиковые колодцы',
        slug: 'plastikovye-kolodcy',
        subs: [
          { title: 'Колодцы инспекционные', slug: 'kolodcy-inspektsionnye' },
          { title: 'Колодцы накопительные', slug: 'kolodcy-nakopitelnye' },
          { title: 'Колодцы дренажные', slug: 'kolodcy-drenazhnye' }
        ]
      },
      {
        title: 'Чугунные детали и трубы',
        slug: 'chugunnye-detali-i-truby',
        subs: [
          { title: 'Трубы чугунные', slug: 'truby-chugunnye' },
          { title: 'Фитинги чугунные', slug: 'fitingi-chugunnye' },
          { title: 'Люки чугунные', slug: 'lyuki-chugunnye' }
        ]
      },
      {
        title: 'Стальные трубы и фитинги',
        slug: 'stalnye-truby-i-fitingi',
        subs: [
          { title: 'Трубы стальные ВГП', slug: 'truby-stalnye-vgp' },
          { title: 'Трубы стальные электросварные', slug: 'truby-stalnye-elektrosvarnye' },
          { title: 'Фитинги стальные', slug: 'fitingi-stalnye' }
        ]
      },
      {
        title: 'Латунные фитинги',
        slug: 'latunnye-fitingi',
        subs: [
          { title: 'Фитинги латунные компрессионные', slug: 'fitingi-latunnye-kompressionnye' },
          { title: 'Фитинги латунные резьбовые', slug: 'fitingi-latunnye-rezbovye' }
        ]
      },
      {
        title: 'Насосное оборудование',
        slug: 'nasosnoe-oborudovanie',
        subs: [
          { title: 'Погружные насосы', slug: 'pogruzhnye-nasosy' },
          { title: 'Поверхностные насосы', slug: 'poverhnostnye-nasosy' },
          { title: 'Дренажные насосы', slug: 'drenazhnye-nasosy' },
          { title: 'Станции повышения давления', slug: 'stancii-povysheniya-davleniya' }
        ]
      }
    ]
    const created: Record<string, { sectionId: string; subsectionIds: Record<string, string> }> = {}
    for (let i = 0; i < sections.length; i++) {
      const s = sections[i]
      const sec = await prisma.catalogSection.create({
        data: { title: s.title, slug: s.slug, order: i }
      })
      created[s.slug] = { sectionId: sec.id, subsectionIds: {} }
      for (let j = 0; j < s.subs.length; j++) {
        const sub = await prisma.catalogSubsection.create({
          data: { sectionId: sec.id, title: s.subs[j].title, slug: s.subs[j].slug, order: j }
        })
        created[s.slug].subsectionIds[s.subs[j].slug] = sub.id
      }
      console.log(`✅ Section "${s.title}" + ${s.subs.length} subsections`)
    }
    return created
  })()

  // Примеры проектов (товаров) по подразделам
  const defaultProject = {
    area: 0,
    floors: 1,
    material: 'каркасный',
    buildTime: 0,
    completion: 'под ключ',
    region: 'Москва',
    image: '/images/1.png',
    images: [] as string[],
    tags: [] as string[],
    hasTerrasse: false,
    hasBath: false,
    hasGarage: false,
    features: [] as string[],
    description: null as string | null,
    advantages: [] as string[],
    technicalSpecs: null as string | null,
    specs: null as object | null,
    filterValues: null as object | null
  }
  const projectsToCreate: { slug: string; title: string; priceFrom: number; priceTo?: number; subsectionSlug: string; sectionSlug: string; area?: number; buildTime?: number; material?: string; variationGroupId?: string }[] = [
    { slug: 'truba-pnd-32-sdr11-voda', title: 'Труба ПНД 32 мм SDR 11 (водопровод) 100 м', priceFrom: 28500, priceTo: 32000, subsectionSlug: 'truba-polyetilen-vodoprovod', sectionSlug: 'polietilenovye-truby', area: 32, buildTime: 100, material: 'ПЭ-100', variationGroupId: 'truba-pnd-sdr11-voda' },
    { slug: 'truba-pnd-40-sdr11-voda', title: 'Труба ПНД 40 мм SDR 11 (водопровод) 100 м', priceFrom: 38500, subsectionSlug: 'truba-polyetilen-vodoprovod', sectionSlug: 'polietilenovye-truby', area: 40, buildTime: 100, material: 'ПЭ-100', variationGroupId: 'truba-pnd-sdr11-voda' },
    { slug: 'truba-pnd-32-pe100', title: 'Труба полиэтиленовая водопроводная ПЭ100+ 32 мм', priceFrom: 19500, subsectionSlug: 'truba-polyetilen-pe100-plus', sectionSlug: 'polietilenovye-truby' },
    { slug: 'truba-pnd-32-gaz', title: 'Труба ПНД 32 мм газопроводная 100 м', priceFrom: 32000, subsectionSlug: 'truby-pnd-gazoprovod', sectionSlug: 'polietilenovye-truby' },
    { slug: 'truba-pnd-tehnicheskaya', title: 'Труба ПНД техническая 32 мм 100 м', priceFrom: 8500, subsectionSlug: 'tehnicheskie-truby-pnd', sectionSlug: 'polietilenovye-truby' },
    { slug: 'truba-pnd-obсадnaya', title: 'Обсадная труба ПНД для скважин 125 мм', priceFrom: 45000, subsectionSlug: 'obsadnye-truby-pnd-skvazhin', sectionSlug: 'polietilenovye-truby' },
    { slug: 'mufta-elektrosvarnaya-32', title: 'Муфта электросварная 32 мм', priceFrom: 180, subsectionSlug: 'mufty-elektrosvarnye', sectionSlug: 'elektrosvarnye-fitingi' },
    { slug: 'otvod-elektrosvarnoy-40', title: 'Отвод электросварной 40 мм', priceFrom: 220, subsectionSlug: 'otvody-elektrosvarnye', sectionSlug: 'elektrosvarnye-fitingi' },
    { slug: 'fiting-kompression-32', title: 'Фитинг компрессионный 32 мм', priceFrom: 180, subsectionSlug: 'kompressionnye-fitingi', sectionSlug: 'fitingi-dlya-pnd-trub' },
    { slug: 'kran-sharovyy-32', title: 'Кран шаровый 32 мм', priceFrom: 450, subsectionSlug: 'krany-sharovye', sectionSlug: 'fitingi-dlya-pnd-trub' },
    { slug: 'apparat-stykovoy-svarki', title: 'Аппарат стыковой сварки ПНД', priceFrom: 85000, subsectionSlug: 'apparaty-stykovoy-svarki', sectionSlug: 'svarochnoe-oborudovanie' },
    { slug: 'truba-gorfirovannaya-pnd', title: 'Труба ПНД гофрированная 110 мм', priceFrom: 12000, subsectionSlug: 'truby-pnd-gorfirovannye', sectionSlug: 'gorfirovannye-truby' },
    { slug: 'drenazhnaya-truba-pnd', title: 'Дренажная труба ПНД с геотекстилем 110 мм', priceFrom: 9500, subsectionSlug: 'drenazhnye-truby-geotekstil', sectionSlug: 'drenazhnye-truby' },
    { slug: 'truba-pvh-110', title: 'Труба ПВХ для канализации 110 мм', priceFrom: 8500, subsectionSlug: 'truby-pvh-kanalizaciya', sectionSlug: 'truby-pvh' },
    { slug: 'mufta-soedinitelnaya-32', title: 'Муфта соединительная 32 мм', priceFrom: 120, subsectionSlug: 'mufty-soedinitelnye', sectionSlug: 'soedinitelnaya-armatura' },
    { slug: 'kran-sharovyy-zapornyy', title: 'Кран шаровый запорный 40 мм', priceFrom: 520, subsectionSlug: 'krany-sharovye-zapornye', sectionSlug: 'zapornaya-armatura' },
    { slug: 'flanec-ploskiy-50', title: 'Фланец плоский ДУ 50', priceFrom: 380, subsectionSlug: 'flancy-ploskie', sectionSlug: 'flancy-i-detali' },
    { slug: 'kolodets-inspektsionnyy', title: 'Колодец инспекционный 315 мм', priceFrom: 3500, subsectionSlug: 'kolodcy-inspektsionnye', sectionSlug: 'plastikovye-kolodcy' },
    { slug: 'nasos-pogruzhnoy', title: 'Насос погружной скважинный', priceFrom: 15000, subsectionSlug: 'pogruzhnye-nasosy', sectionSlug: 'nasosnoe-oborudovanie' }
  ]
  for (const p of projectsToCreate) {
    const subId = sectionByNom[p.sectionSlug]?.subsectionIds[p.subsectionSlug]
    if (!subId) continue
    await prisma.project.create({
      data: {
        ...defaultProject,
        slug: p.slug,
        title: p.title,
        priceFrom: p.priceFrom,
        priceTo: p.priceTo ?? null,
        subsectionId: subId,
        ...(p.area != null && { area: p.area }),
        ...(p.buildTime != null && { buildTime: p.buildTime }),
        ...(p.material && { material: p.material }),
        ...(p.variationGroupId && { variationGroupId: p.variationGroupId }),
      }
    })
    console.log(`✅ Project "${p.title}" → ${p.subsectionSlug}`)
  }

  // Добавляем отзывы
  const reviewsData = [
    {
      name: 'Александр Петров',
      city: 'Москва',
      text: 'Очень доволен результатом! Заказал трубы ПНД для водопровода. Качество отличное, все материалы качественные, доставка быстрая. Рекомендую!',
      image: '/images/house.jpg',
      date: new Date('2024-03-15')
    },
    {
      name: 'Мария Козлова',
      city: 'Санкт-Петербург',
      text: 'Спасибо за профессиональную работу! Менеджер помог подобрать все необходимые трубы и фитинги, все сделали быстро и качественно. Заказ получился именно таким, как мы хотели.',
      image: '/images/house.jpg',
      date: new Date('2024-02-28')
    },
    {
      name: 'Дмитрий Смирнов',
      city: 'Екатеринбург',
      text: 'Заказывал трубы ПНД для канализации. Остался очень доволен! Цена соответствует качеству, сроки соблюдены. Буду рекомендовать друзьям.',
      image: '/images/house.jpg',
      date: new Date('2024-02-10')
    },
    {
      name: 'Елена Волкова',
      city: 'Новосибирск',
      text: 'Отличная команда! Все вопросы решались быстро, менеджер всегда на связи. Материалы качественные, все комплектующие подобраны правильно.',
      image: '/images/house.jpg',
      date: new Date('2024-02-05')
    },
    {
      name: 'Игорь Лебедев',
      city: 'Казань',
      text: 'Заказали трубы ПНД и комплектующие для водопровода. Все материалы качественные, доставка быстрая, менеджер помог подобрать все необходимое. Очень рекомендую компанию!',
      image: '/images/house.jpg',
      date: new Date('2024-01-22')
    },
    {
      name: 'Анна Соколова',
      city: 'Нижний Новгород',
      text: 'Поставка прошла без задержек, качество материалов превосходное. Особенно понравилось, что учли все наши пожелания. Трубы уже год в эксплуатации, никаких нареканий нет!',
      image: '/images/house.jpg',
      date: new Date('2024-01-18')
    },
    {
      name: 'Сергей Кузнецов',
      city: 'Краснодар',
      text: 'Выбрали трубы ПНД для газопровода. Поставка быстро, качественно. Все комплектующие тоже на высоте. Соседи уже спрашивают, где покупали. Спасибо за отличную работу!',
      image: '/images/house.jpg',
      date: new Date('2024-01-12')
    },
    {
      name: 'Ольга Морозова',
      city: 'Челябинск',
      text: 'Очень довольна результатом! Трубы подобраны с учетом всех современных требований. Качество отличное, все сертификаты предоставили. Менеджер сопровождал на всех этапах. Рекомендую!',
      image: '/images/house.jpg',
      date: new Date('2024-01-08')
    },
    {
      name: 'Владимир Новиков',
      city: 'Самара',
      text: 'Заказывали трубы ПНД для водопровода на участке. Поставка точно в срок, даже быстрее. Качество материалов отличное, цена справедливая. Всем довольны!',
      image: '/images/house.jpg',
      date: new Date('2024-01-03')
    }
  ]

  for (const [idx, review] of reviewsData.entries()) {
    const reviewId = `review-seed-${idx + 1}`
    await prisma.review.upsert({
      where: { id: reviewId },
      update: review,
      create: { ...review, id: reviewId }
    })
    console.log(`✅ Review "${review.name}" upserted`)
  }

  // Добавляем FAQ
  const faqData = [
    {
      question: 'Сколько времени занимает поставка труб?',
      answer: 'Время поставки зависит от наличия товара на складе и составляет от 1 до 5 рабочих дней. Трубы стандартных диаметров обычно есть в наличии и отправляются в день заказа. Нестандартные размеры могут потребовать дополнительного времени на заказ.',
      order: 1
    },
    {
      question: 'Какие материалы вы поставляете?',
      answer: 'Мы поставляем только сертифицированные трубы ПНД (ПЭ) и комплектующие от проверенных производителей. Все материалы соответствуют ГОСТам и имеют соответствующие сертификаты качества.',
      order: 2
    },
    {
      question: 'Предоставляете ли вы гарантию на трубы?',
      answer: 'Да, мы предоставляем гарантию на все поставляемые трубы и комплектующие в соответствии с гарантийными обязательствами производителя. Все материалы имеют сертификаты качества и соответствуют ГОСТам.',
      order: 3
    },
    {
      question: 'Можно ли подобрать трубы под конкретные требования?',
      answer: 'Конечно! Наши специалисты помогут подобрать трубы нужного диаметра, типа и характеристик под ваши конкретные требования. Мы работаем с широким ассортиментом от 20 до 630 мм.',
      order: 4
    },
    {
      question: 'Входит ли в стоимость доставка?',
      answer: 'Доставка рассчитывается отдельно в зависимости от объема заказа, расстояния и региона. Для крупных заказов возможна бесплатная доставка. Уточняйте условия доставки у наших менеджеров.',
      order: 5
    },
    {
      question: 'Как происходит оплата за материалы?',
      answer: 'Оплата происходит по договоренности: возможна предоплата или оплата при получении. Для постоянных клиентов возможны индивидуальные условия оплаты и отсрочка платежа.',
      order: 6
    },
    {
      question: 'Нужны ли какие-то документы для покупки труб?',
      answer: 'Для покупки труб ПНД для водопровода и канализации документы не требуются. Для газопровода могут потребоваться дополнительные документы в соответствии с требованиями газовых служб. Мы предоставляем все необходимые сертификаты на материалы.',
      order: 7
    },
    {
      question: 'Можно ли прокладывать трубы зимой?',
      answer: 'Да, трубы ПНД можно прокладывать круглый год. Они устойчивы к низким температурам и не теряют своих свойств при монтаже в зимний период. Однако монтажные работы рекомендуется проводить при температуре не ниже -20°C.',
      order: 8
    },
    {
      question: 'Предоставляете ли вы услуги по монтажу?',
      answer: 'Да, мы оказываем услуги по монтажу труб и подключению систем водоснабжения, канализации и газопровода. Все работы выполняются квалифицированными специалистами с опытом работы.',
      order: 9
    },
    {
      question: 'Что делать, если возникли проблемы с материалами?',
      answer: 'Наша служба поддержки работает в рабочее время. При возникновении любых проблем с материалами мы оперативно их решаем в рамках гарантийных обязательств. Звоните нам, и мы обязательно поможем!',
      order: 10
    }
  ]

  for (const faq of faqData) {
    const faqId = `faq-seed-${faq.order}`
    await prisma.fAQItem.upsert({
      where: { id: faqId },
      update: faq,
      create: { ...faq, id: faqId }
    })
    console.log(`✅ FAQ "${faq.question.substring(0, 30)}..." upserted`)
  }

  console.log('✅ Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

