import { PrismaClient } from '@prisma/client'
import { slugFromTitle } from '../lib/slug'

const prisma = new PrismaClient()

// Товары для АкваГазТех — slug генерируется из title автоматически
const aquagaztehProducts = [
  {
    title: 'Труба ПНД 32 мм SDR 11',
    area: 32, // диаметр в мм (используем поле area)
    priceFrom: 45000, // за бухту 100м в копейках (450 руб)
    priceTo: 55000,
    floors: 1.6, // толщина стенки в мм
    material: 'ПЭ-100', // материал
    buildTime: 1, // срок поставки в днях
    completion: 'бухта 100м', // комплектация
    region: 'Москва',
    image: '/images/truba-pnd-32.jpg',
    images: ['/images/truba-pnd-32.jpg', '/images/truba-pnd-32-2.jpg'],
    tags: ['водопровод', 'популярное', 'SDR11'],
    hasTerrasse: false,
    hasBath: false,
    hasGarage: false,
    features: ['морозостойкость', 'долговечность', 'гибкость'],
    description: 'Труба полиэтиленовая низкого давления (ПНД) диаметром 32 мм из материала ПЭ-100. Предназначена для строительства водопроводных сетей, систем орошения и технического водоснабжения.',
    advantages: ['Срок службы до 50 лет', 'Устойчивость к коррозии', 'Простой монтаж', 'Экономичность'],
    technicalSpecs: 'Материал: ПЭ-100\nДиаметр: 32 мм\nТолщина стенки: 1.6 мм\nSDR: 11\nДлина: 100 м\nРабочее давление: 10 атм\nТемпература: -60°C до +40°C',
    specs: {
      'Материал': 'ПЭ-100',
      'Диаметр': '32 мм',
      'Толщина стенки': '1.6 мм',
      'SDR': '11',
      'Длина бухты': '100 м',
      'Рабочее давление': '10 атм',
      'Цвет': 'Черный с синими полосами'
    },
    filterValues: {
      diameter: 32,
      sdr: 11,
      material: 'PE100',
      application: 'водопровод'
    }
  },
  {
    title: 'Труба ПНД 63 мм SDR 17',
    area: 63,
    priceFrom: 125000, // 1250 руб за бухту
    priceTo: 145000,
    floors: 3.8,
    material: 'ПЭ-100',
    buildTime: 1,
    completion: 'бухта 100м',
    region: 'Москва',
    image: '/images/truba-pnd-63.jpg',
    images: ['/images/truba-pnd-63.jpg', '/images/truba-pnd-63-2.jpg'],
    tags: ['водопровод', 'SDR17'],
    features: ['морозостойкость', 'долговечность', 'гибкость', 'большой диаметр'],
    description: 'Труба ПНД 63 мм из полиэтилена ПЭ-100 для водопроводных систем среднего давления. Подходит для частного водоснабжения и промышленных систем.',
    advantages: ['Высокая пропускная способность', 'Надежные соединения', 'Устойчивость к УФ', 'Экологичность'],
    technicalSpecs: 'Материал: ПЭ-100\nДиаметр: 63 мм\nТолщина стенки: 3.8 мм\nSDR: 17\nДлина: 100 м\nРабочее давление: 6 атм\nТемпература: -60°C до +40°C',
    specs: {
      'Материал': 'ПЭ-100',
      'Диаметр': '63 мм', 
      'Толщина стенки': '3.8 мм',
      'SDR': '17',
      'Длина бухты': '100 м',
      'Рабочее давление': '6 атм',
      'Цвет': 'Черный с синими полосами'
    },
    filterValues: {
      diameter: 63,
      sdr: 17,
      material: 'PE100',
      application: 'водопровод'
    }
  },
  {
    title: 'Труба ПНД 110 мм SDR 17',
    area: 110,
    priceFrom: 320000, // 3200 руб за бухту
    priceTo: 380000,
    floors: 6.6,
    material: 'ПЭ-100',
    buildTime: 2,
    completion: 'бухта 50м',
    region: 'Москва',
    image: '/images/truba-pnd-110.jpg',
    images: ['/images/truba-pnd-110.jpg'],
    tags: ['водопровод', 'магистральная', 'SDR17'],
    features: ['большой диаметр', 'высокое давление', 'долговечность'],
    description: 'Магистральная труба ПНД диаметром 110 мм для крупных водопроводных систем. Используется в коттеджных поселках и промышленности.',
    advantages: ['Высокое рабочее давление', 'Большая пропускная способность', 'Минимальные потери напора', 'Простота прокладки'],
    technicalSpecs: 'Материал: ПЭ-100\nДиаметр: 110 мм\nТолщина стенки: 6.6 мм\nSDR: 17\nДлина: 50 м\nРабочее давление: 6 атм',
    specs: {
      'Материал': 'ПЭ-100',
      'Диаметр': '110 мм',
      'Толщина стенки': '6.6 мм',
      'SDR': '17', 
      'Длина бухты': '50 м',
      'Рабочее давление': '6 атм'
    },
    filterValues: {
      diameter: 110,
      sdr: 17,
      material: 'PE100',
      application: 'магистраль'
    }
  },
  {
    title: 'Фитинги компрессионные 32 мм',
    area: 32,
    priceFrom: 25000, // 250 руб за комплект
    priceTo: 45000,
    floors: 1,
    material: 'полипропилен',
    buildTime: 1,
    completion: 'комплект 10 шт',
    region: 'Москва', 
    image: '/images/fitingi-32.jpg',
    images: ['/images/fitingi-32.jpg', '/images/fitingi-install.jpg'],
    tags: ['фитинги', 'соединение', 'популярное'],
    features: ['герметичность', 'простой монтаж', 'разборное соединение'],
    description: 'Набор компрессионных фитингов для труб ПНД 32 мм. Включает муфты, тройники, отводы и заглушки для создания надежных соединений.',
    advantages: ['Без использования инструмента', 'Многократное использование', 'Высокая герметичность', 'Быстрый монтаж'],
    technicalSpecs: 'В комплекте: муфты - 4 шт, тройники - 2 шт, отводы 90° - 2 шт, заглушки - 2 шт\nМатериал: полипропилен\nДиаметр: 32 мм\nРабочее давление: до 10 атм',
    specs: {
      'Муфты': '4 шт',
      'Тройники': '2 шт', 
      'Отводы 90°': '2 шт',
      'Заглушки': '2 шт',
      'Материал': 'Полипропилен',
      'Рабочее давление': 'до 10 атм'
    },
    filterValues: {
      diameter: 32,
      type: 'фитинги',
      material: 'PP',
      application: 'соединение'
    }
  },
  {
    title: 'Комплект водоснабжения дома',
    area: 150, // для дома 150 кв.м
    priceFrom: 2500000, // 25000 руб за комплект
    priceTo: 3200000,
    floors: 1,
    material: 'ПЭ-100 + фитинги',
    buildTime: 3,
    completion: 'полный комплект',
    region: 'Москва',
    image: '/images/komplekt-vodosnabzheniya.jpg',
    images: ['/images/komplekt-vodosnabzheniya.jpg', '/images/schema-vody.jpg'],
    tags: ['комплект', 'водоснабжение', 'популярное', 'дом'],
    features: ['готовое решение', 'все в комплекте', 'схема подключения', 'консультация'],
    description: 'Полный комплект материалов для организации водоснабжения частного дома. Включает трубы ПНД различных диаметров, фитинги, запорную арматуру.',
    advantages: ['Готовое решение под ключ', 'Проверенная совместимость', 'Техническая поддержка', 'Экономия до 20%'],
    technicalSpecs: 'Труба ПНД 32мм - 200м\nТруба ПНД 25мм - 100м\nФитинги компрессионные - 25 шт\nКраны шаровые - 5 шт\nСхема монтажа в комплекте',
    specs: {
      'Труба ПНД 32мм': '200 м',
      'Труба ПНД 25мм': '100 м',
      'Фитинги': '25 шт',
      'Краны шаровые': '5 шт',
      'Схема монтажа': 'В комплекте',
      'Консультация': 'Бесплатно'
    },
    filterValues: {
      type: 'комплект',
      application: 'водоснабжение',
      house_area: 150
    }
  },
  {
    title: 'Труба канализационная 110 мм',
    area: 110,
    priceFrom: 180000, // 1800 руб за 6м
    priceTo: 220000,
    floors: 3.2,
    material: 'ПВХ',
    buildTime: 1,
    completion: '6 метров',
    region: 'Москва',
    image: '/images/truba-kanalizacia-110.jpg',
    images: ['/images/truba-kanalizacia-110.jpg'],
    tags: ['канализация', 'ПВХ', 'стандарт'],
    features: ['гладкая поверхность', 'стойкость к химии', 'легкий вес'],
    description: 'Канализационная труба из ПВХ диаметром 110 мм для наружной и внутренней канализации. Соответствует ГОСТ 51613-2000.',
    advantages: ['Не засоряется', 'Химическая стойкость', 'Долгий срок службы', 'Простой монтаж'],
    technicalSpecs: 'Материал: ПВХ\nДиаметр: 110 мм\nДлина: 6 м\nТолщина стенки: 3.2 мм\nКласс жесткости: SN4',
    specs: {
      'Материал': 'ПВХ',
      'Диаметр': '110 мм',
      'Длина': '6 м',
      'Толщина стенки': '3.2 мм',
      'Класс жесткости': 'SN4',
      'Цвет': 'Оранжевый'
    },
    filterValues: {
      diameter: 110,
      material: 'PVC',
      application: 'канализация'
    }
  },
  {
    title: 'Газовая труба ПНД 63 мм',
    area: 63,
    priceFrom: 145000, // 1450 руб за бухту
    priceTo: 165000,
    floors: 5.8,
    material: 'ПЭ-100',
    buildTime: 2,
    completion: 'бухта 100м',
    region: 'Москва',
    image: '/images/truba-gas-63.jpg',
    images: ['/images/truba-gas-63.jpg'],
    tags: ['газ', 'желтая', 'безопасность'],
    features: ['газовая маркировка', 'повышенная безопасность', 'стойкость к газу'],
    description: 'Специализированная труба ПНД для газопроводов низкого давления. Имеет желтую маркировку и соответствует требованиям для газовых сетей.',
    advantages: ['Сертифицирована для газа', 'Антистатические добавки', 'Защита от повреждений', 'Долговечность'],
    technicalSpecs: 'Материал: ПЭ-100 (газовый)\nДиаметр: 63 мм\nТолщина стенки: 5.8 мм\nДлина: 100 м\nМаксимальное давление: 4 атм',
    specs: {
      'Материал': 'ПЭ-100 газовый',
      'Диаметр': '63 мм',
      'Толщина стенки': '5.8 мм',
      'Длина бухты': '100 м',
      'Макс. давление': '4 атм',
      'Цвет': 'Желтый'
    },
    filterValues: {
      diameter: 63,
      material: 'PE100_GAS',
      application: 'газопровод'
    }
  },
  {
    title: 'Соединительный элемент электромуфтовый',
    area: 50, // диаметр подключения
    priceFrom: 85000, // 850 руб за штуку
    priceTo: 120000,
    floors: 1,
    material: 'ПЭ-100',
    buildTime: 1,
    completion: '1 штука',
    region: 'Москва',
    image: '/images/elektromufta.jpg',
    images: ['/images/elektromufta.jpg', '/images/elektromufta-install.jpg'],
    tags: ['электромуфта', 'соединение', 'профессиональное'],
    features: ['электросварка', 'герметичность', 'профессиональный монтаж'],
    description: 'Электромуфтовый соединительный элемент для сварки труб ПНД. Обеспечивает максимально надежное и герметичное соединение.',
    advantages: ['100% герметичность', 'Прочность соединения', 'Быстрый монтаж', 'Долговечность'],
    technicalSpecs: 'Диаметр: 50 мм\nМатериал: ПЭ-100\nНапряжение сварки: 39V\nВремя сварки: 180 сек\nВремя остывания: 300 сек',
    specs: {
      'Диаметр': '50 мм',
      'Материал': 'ПЭ-100',
      'Напряжение': '39V',
      'Время сварки': '180 сек',
      'Время остывания': '300 сек'
    },
    filterValues: {
      diameter: 50,
      type: 'электромуфта',
      material: 'PE100',
      application: 'сварка'
    }
  }
]

// Популярные товары - 2 панели
const popularPanels = [
  {
    title: 'Трубы ПНД для водопровода',
    order: 1,
    items: [
      {
        title: 'ПНД 32мм SDR11 (100м)',
        area: 32,
        priceFrom: 45000,
        priceTo: 55000,
        floors: 1.6,
        material: 'ПЭ-100',
        buildTime: 1,
        completion: 'бухта 100м',
        region: 'Москва',
        image: '/images/truba-pnd-32.jpg',
        images: ['/images/truba-pnd-32.jpg'],
        tags: ['водопровод', 'хит'],
        features: ['морозостойкость', 'гибкость'],
        description: 'Самая популярная труба для частного водоснабжения',
        advantages: ['50 лет службы', 'Простой монтаж'],
        specs: { 'Диаметр': '32 мм', 'SDR': '11', 'Давление': '10 атм' },
        order: 1,
        projectTitle: 'Труба ПНД 32 мм SDR 11'
      },
      {
        title: 'ПНД 63мм SDR17 (100м)',
        area: 63,
        priceFrom: 125000,
        priceTo: 145000,
        floors: 3.8,
        material: 'ПЭ-100',
        buildTime: 1,
        completion: 'бухта 100м',
        region: 'Москва',
        image: '/images/truba-pnd-63.jpg',
        images: ['/images/truba-pnd-63.jpg'],
        tags: ['водопровод'],
        features: ['большой диаметр'],
        description: 'Для магистрального водопровода',
        advantages: ['Высокая пропускная способность'],
        specs: { 'Диаметр': '63 мм', 'SDR': '17', 'Давление': '6 атм' },
        order: 2,
        projectTitle: 'Труба ПНД 63 мм SDR 17'
      },
      {
        title: 'Фитинги компрессионные 32мм',
        area: 32,
        priceFrom: 25000,
        priceTo: 45000,
        floors: 1,
        material: 'полипропилен',
        buildTime: 1,
        completion: 'набор 10шт',
        region: 'Москва',
        image: '/images/fitingi-32.jpg',
        images: ['/images/fitingi-32.jpg'],
        tags: ['фитинги', 'хит'],
        features: ['без инструмента'],
        description: 'Быстрое соединение труб ПНД',
        advantages: ['Простой монтаж', 'Герметичность'],
        specs: { 'В наборе': '10 шт', 'Диаметр': '32 мм' },
        order: 3,
        projectTitle: 'Фитинги компрессионные 32 мм'
      }
    ]
  },
  {
    title: 'Готовые решения',
    order: 2,
    items: [
      {
        title: 'Комплект водоснабжения дома',
        area: 150,
        priceFrom: 2500000,
        priceTo: 3200000,
        floors: 1,
        material: 'ПЭ-100 + фитинги',
        buildTime: 3,
        completion: 'под ключ',
        region: 'Москва',
        image: '/images/komplekt-vodosnabzheniya.jpg',
        images: ['/images/komplekt-vodosnabzheniya.jpg'],
        tags: ['комплект', 'хит продаж'],
        features: ['готовое решение', 'схема в комплекте'],
        description: 'Все для водопровода в частном доме',
        advantages: ['Экономия 20%', 'Консультация'],
        specs: { 'На дом': '150 м²', 'В комплекте': 'трубы + фитинги' },
        order: 1,
        projectTitle: 'Комплект водоснабжения дома'
      },
      {
        title: 'Канализационная труба 110мм',
        area: 110,
        priceFrom: 180000,
        priceTo: 220000,
        floors: 3.2,
        material: 'ПВХ',
        buildTime: 1,
        completion: '6 метров',
        region: 'Москва',
        image: '/images/truba-kanalizacia-110.jpg',
        images: ['/images/truba-kanalizacia-110.jpg'],
        tags: ['канализация'],
        features: ['гладкая поверхность'],
        description: 'Для наружной канализации',
        advantages: ['Не засоряется', 'Долговечность'],
        specs: { 'Диаметр': '110 мм', 'Длина': '6 м' },
        order: 2,
        projectTitle: 'Труба канализационная 110 мм'
      },
      {
        title: 'Газовая труба ПНД 63мм',
        area: 63,
        priceFrom: 145000,
        priceTo: 165000,
        floors: 5.8,
        material: 'ПЭ-100',
        buildTime: 2,
        completion: 'бухта 100м',
        region: 'Москва',
        image: '/images/truba-gas-63.jpg',
        images: ['/images/truba-gas-63.jpg'],
        tags: ['газ', 'безопасность'],
        features: ['сертификат для газа'],
        description: 'Для газопроводов низкого давления',
        advantages: ['Безопасность', 'Сертификация'],
        specs: { 'Диаметр': '63 мм', 'Для газа': 'да' },
        order: 3,
        projectTitle: 'Газовая труба ПНД 63 мм'
      }
    ]
  }
]

async function updateProductsForAquaGazTeh() {
  try {
    console.log('🗑️ Очищаю старые товары...')
    
    // Удаляем старые товары
    await prisma.project.deleteMany({})
    console.log('✅ Старые товары удалены')

    console.log('🗑️ Очищаю старые популярные товары...')
    
    // Удаляем старые популярные товары
    await prisma.popularItem.deleteMany({})
    await prisma.popularPanel.deleteMany({})
    console.log('✅ Старые популярные товары удалены')

    console.log('📦 Создаю новые товары АкваГазТех...')
    const titleToSlug: Record<string, string> = {}

    for (const product of aquagaztehProducts) {
      const slug = slugFromTitle(product.title) || `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const { ...rest } = product as any
      const created = await prisma.project.create({
        data: { ...rest, slug }
      })
      titleToSlug[product.title] = created.slug
      console.log(`✅ Товар "${product.title}" → slug: ${created.slug}`)
    }

    console.log('⭐ Создаю популярные товары...')
    for (const panel of popularPanels) {
      const createdPanel = await prisma.popularPanel.create({
        data: { title: panel.title, order: panel.order }
      })
      console.log(`✅ Панель "${panel.title}" создана`)
      for (const item of panel.items) {
        const projectTitle = (item as any).projectTitle
        const projectSlug = projectTitle ? titleToSlug[projectTitle] ?? null : null
        const { projectTitle: _pt, slug: _s, projectSlug: _ps, ...rest } = item as any
        await prisma.popularItem.create({
          data: { ...rest, panelId: createdPanel.id, projectSlug }
        })
        console.log(`✅ Популярный "${item.title}" → projectSlug: ${projectSlug ?? '—'}`)
      }
    }

    console.log('🎉 Все товары АкваГазТех успешно созданы!')
    console.log(`📊 Создано товаров: ${aquagaztehProducts.length}`)
    console.log(`📊 Создано панелей: ${popularPanels.length}`)
    console.log(`📊 Создано популярных товаров: ${popularPanels.reduce((sum, panel) => sum + panel.items.length, 0)}`)
    
  } catch (error) {
    console.error('❌ Ошибка при создании товаров:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateProductsForAquaGazTeh().catch(console.error)