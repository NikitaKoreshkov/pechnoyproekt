/**
 * Скрипт для удаления всех проектов и создания новых под тематику продажи труб
 * Запуск: npx tsx scripts/replace-projects-for-pipes.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function replaceProjectsForPipes() {
  try {
    console.log('🔄 Начинаю замену проектов под тематику продажи труб...')

    // Удаляем все существующие проекты
    const deleteResult = await prisma.project.deleteMany({})
    console.log(`🗑️  Удалено проектов: ${deleteResult.count}`)

    // Создаем новые проекты под тематику труб ПНД
    const pipeProjects = [
      {
        slug: 'pnd-32-standard',
        title: 'Труба ПНД 32 (стандарт)',
        area: 100, // метраж в метрах
        priceFrom: 45000, // цена за 100 метров
        priceTo: null,
        floors: 1,
        material: 'ПНД 32',
        buildTime: 3, // срок поставки в днях
        completion: 'под ключ',
        region: 'Москва',
        image: '/images/house.jpg',
        images: [],
        tags: ['ПНД 32', 'стандарт', 'водопровод'],
        hasTerrasse: false,
        hasBath: false,
        hasGarage: false,
        features: ['Сертификат качества', 'ГОСТ 18599-2001', 'Доставка'],
        description: 'Труба ПНД 32 мм стандартного класса прочности. Идеально подходит для водопроводных систем частных домов и участков. Высокая прочность, долговечность и устойчивость к коррозии.',
        advantages: [
          'Высокая прочность и долговечность',
          'Устойчивость к коррозии',
          'Легкий монтаж',
          'Сертификат качества'
        ],
        technicalSpecs: 'Диаметр: 32 мм\nКласс прочности: ПЭ 80\nРабочее давление: до 1.0 МПа\nТемпература эксплуатации: от -20°C до +40°C',
        specs: {
          completionOptions: [
            { label: 'Только труба', price: 0 },
            { label: 'С фитингами', price: 15000 },
            { label: 'Полный комплект с монтажом', price: 35000 }
          ],
          additionalOptions: [
            { label: 'Дополнительная изоляция', price: 5000 },
            { label: 'Маркировка', price: 2000 }
          ]
        }
      },
      {
        slug: 'pnd-40-premium',
        title: 'Труба ПНД 40 (премиум)',
        area: 150,
        priceFrom: 75000,
        priceTo: null,
        floors: 1,
        material: 'ПНД 40',
        buildTime: 5,
        completion: 'под ключ',
        region: 'Москва',
        image: '/images/house.jpg',
        images: [],
        tags: ['ПНД 40', 'премиум', 'газопровод'],
        hasTerrasse: false,
        hasBath: false,
        hasGarage: false,
        features: ['Повышенная прочность', 'ГОСТ 18599-2001', 'Для газопроводов'],
        description: 'Труба ПНД 40 мм премиум класса. Предназначена для газопроводных систем и водопроводов с повышенными требованиями к прочности. Отличное соотношение цена/качество.',
        advantages: [
          'Повышенная прочность',
          'Подходит для газопроводов',
          'Длительный срок службы',
          'Сертификат соответствия'
        ],
        technicalSpecs: 'Диаметр: 40 мм\nКласс прочности: ПЭ 100\nРабочее давление: до 1.6 МПа\nТемпература эксплуатации: от -20°C до +40°C',
        specs: {
          completionOptions: [
            { label: 'Только труба', price: 0 },
            { label: 'С фитингами', price: 25000 },
            { label: 'Полный комплект с монтажом', price: 55000 }
          ],
          additionalOptions: [
            { label: 'Дополнительная изоляция', price: 8000 },
            { label: 'Маркировка', price: 3000 },
            { label: 'Техническая документация', price: 5000 }
          ]
        }
      },
      {
        slug: 'pnd-63-industrial',
        title: 'Труба ПНД 63 (промышленная)',
        area: 200,
        priceFrom: 120000,
        priceTo: null,
        floors: 1,
        material: 'ПНД 63',
        buildTime: 7,
        completion: 'под ключ',
        region: 'Москва',
        image: '/images/house.jpg',
        images: [],
        tags: ['ПНД 63', 'промышленная', 'большой диаметр'],
        hasTerrasse: false,
        hasBath: false,
        hasGarage: false,
        features: ['Промышленное применение', 'Высокая пропускная способность', 'ГОСТ 18599-2001'],
        description: 'Труба ПНД 63 мм для промышленного применения. Используется в системах водоснабжения, канализации и газоснабжения крупных объектов. Высокая пропускная способность и надежность.',
        advantages: [
          'Большой диаметр',
          'Промышленное применение',
          'Высокая пропускная способность',
          'Надежность и долговечность'
        ],
        technicalSpecs: 'Диаметр: 63 мм\nКласс прочности: ПЭ 100\nРабочее давление: до 1.6 МПа\nТемпература эксплуатации: от -20°C до +40°C',
        specs: {
          completionOptions: [
            { label: 'Только труба', price: 0 },
            { label: 'С фитингами', price: 40000 },
            { label: 'Полный комплект с монтажом', price: 80000 }
          ],
          additionalOptions: [
            { label: 'Дополнительная изоляция', price: 12000 },
            { label: 'Маркировка', price: 5000 },
            { label: 'Техническая документация', price: 8000 },
            { label: 'Проектирование системы', price: 25000 }
          ]
        }
      },
      {
        slug: 'pnd-fittings-kit',
        title: 'Комплект фитингов ПНД',
        area: 50,
        priceFrom: 25000,
        priceTo: null,
        floors: 1,
        material: 'Фитинги',
        buildTime: 2,
        completion: 'под ключ',
        region: 'Москва',
        image: '/images/house.jpg',
        images: [],
        tags: ['фитинги', 'комплектующие', 'ПНД'],
        hasTerrasse: false,
        hasBath: false,
        hasGarage: false,
        features: ['Полный комплект', 'Различные диаметры', 'Высокое качество'],
        description: 'Комплект фитингов ПНД для соединения труб различных диаметров. Включает муфты, отводы, тройники и другие необходимые элементы. Качественные материалы и точная геометрия.',
        advantages: [
          'Полный комплект',
          'Различные диаметры',
          'Высокое качество',
          'Легкий монтаж'
        ],
        technicalSpecs: 'Диаметры: 32, 40, 63 мм\nТипы: муфты, отводы, тройники, переходники\nМатериал: ПНД\nСпособ соединения: сварка, компрессионные',
        specs: {
          completionOptions: [
            { label: 'Базовый комплект', price: 0 },
            { label: 'Расширенный комплект', price: 10000 },
            { label: 'Профессиональный комплект', price: 20000 }
          ],
          additionalOptions: [
            { label: 'Инструмент для монтажа', price: 15000 },
            { label: 'Инструкция по монтажу', price: 1000 }
          ]
        }
      },
      {
        slug: 'pnd-water-system',
        title: 'Система водоснабжения ПНД',
        area: 300,
        priceFrom: 180000,
        priceTo: null,
        floors: 1,
        material: 'ПНД система',
        buildTime: 10,
        completion: 'под ключ',
        region: 'Москва',
        image: '/images/house.jpg',
        images: [],
        tags: ['система', 'водоснабжение', 'под ключ'],
        hasTerrasse: false,
        hasBath: false,
        hasGarage: false,
        features: ['Полная система', 'Монтаж включен', 'Гарантия 5 лет'],
        description: 'Полная система водоснабжения из труб ПНД под ключ. Включает трубы, фитинги, запорную арматуру, монтаж и пусконаладку. Идеальное решение для частных домов и участков.',
        advantages: [
          'Полная система под ключ',
          'Профессиональный монтаж',
          'Гарантия на работы',
          'Техническая поддержка'
        ],
        technicalSpecs: 'Диаметр труб: 32-63 мм\nДлина системы: до 300 м\nРабочее давление: до 1.6 МПа\nВключает: трубы, фитинги, арматуру, монтаж',
        specs: {
          completionOptions: [
            { label: 'Только материалы', price: 0 },
            { label: 'Материалы + монтаж', price: 50000 },
            { label: 'Полный комплект с гарантией', price: 80000 }
          ],
          additionalOptions: [
            { label: 'Проектирование', price: 20000 },
            { label: 'Пусконаладка', price: 15000 },
            { label: 'Обучение эксплуатации', price: 5000 }
          ]
        }
      },
      {
        slug: 'pnd-sewer-system',
        title: 'Система канализации ПНД',
        area: 250,
        priceFrom: 150000,
        priceTo: null,
        floors: 1,
        material: 'ПНД канализация',
        buildTime: 8,
        completion: 'под ключ',
        region: 'Москва',
        image: '/images/house.jpg',
        images: [],
        tags: ['канализация', 'система', 'ПНД'],
        hasTerrasse: false,
        hasBath: false,
        hasGarage: false,
        features: ['Для канализации', 'Большой диаметр', 'Долговечность'],
        description: 'Система канализации из труб ПНД большого диаметра. Предназначена для отвода сточных вод в частных домах и на участках. Высокая прочность и устойчивость к агрессивным средам.',
        advantages: [
          'Большой диаметр',
          'Устойчивость к агрессивным средам',
          'Долговечность',
          'Легкий монтаж'
        ],
        technicalSpecs: 'Диаметр: 110-160 мм\nДлина системы: до 250 м\nКласс прочности: ПЭ 100\nВключает: трубы, фитинги, колодцы',
        specs: {
          completionOptions: [
            { label: 'Только материалы', price: 0 },
            { label: 'Материалы + монтаж', price: 45000 },
            { label: 'Полный комплект с гарантией', price: 70000 }
          ],
          additionalOptions: [
            { label: 'Проектирование', price: 18000 },
            { label: 'Установка колодцев', price: 25000 },
            { label: 'Гидроизоляция', price: 12000 }
          ]
        }
      }
    ]

    // Создаем проекты
    for (const project of pipeProjects) {
      await prisma.project.create({
        data: project
      })
      console.log(`✅ Создан проект: "${project.title}"`)
    }

    console.log(`✅ Всего создано проектов: ${pipeProjects.length}`)
    console.log('✅ Замена проектов завершена успешно!')
  } catch (error) {
    console.error('❌ Ошибка при замене проектов:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

replaceProjectsForPipes()
  .then(() => {
    console.log('🎉 Скрипт выполнен успешно')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Критическая ошибка:', error)
    process.exit(1)
  })
