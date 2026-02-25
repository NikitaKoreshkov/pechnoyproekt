/**
 * Скрипт обновления контента «О нас» в БД
 * Запуск: npx tsx scripts/update-onas-content.ts
 *
 * Полностью заменяет старый контент на новый для ProektMangal.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const processStepsData = {
  title: 'Ваш надёжный партнёр',
  mainMission:
    'Основная миссия компании «ProektMangal» — создавать печные комплексы и зоны огня, которые становятся центром вашего дома и участка на десятилетия.',
  specialization: `Мы специализируемся на проектировании и строительстве мангалов, печей, барбекю-зон и полного спектра решений для открытого огня. Ручная кладка кирпича по чертежам — от эскиза до сдачи заказчику.

От компактного мангала на даче до многосекторного печного комплекса с разными вариантами кладки — мы гарантируем авторский подход, безупречное исполнение и надёжность на десятилетия. В разделе «Воплощённые объекты» — готовые проекты и типы печей; «Архитектура решений» — визуализация, разрезы и порядовка; калькулятор — расчёт стоимости барбекю под вашу конфигурацию.`,
  advantages: [
    { id: 1, title: 'Доступная стоимость', description: 'Честные цены без потери в качестве материалов и работ' },
    { id: 2, title: 'Гибкая конфигурация', description: 'Мангал, секторы, барбекю: соберём комплекс под ваши желания' },
    { id: 3, title: 'Варианты кладки', description: 'Классика, современные решения, разные оттенки под ваш стиль' },
    { id: 4, title: 'Огнестойкость и долговечность', description: 'Правильные материалы и технологии — комфорт и безопасность на годы' },
    { id: 5, title: 'Авторский подход', description: 'Каждый проект продуман под ваше пространство и привычки' },
    { id: 6, title: 'Надёжность на десятилетия', description: 'Проверенные решения и гарантия качества' },
  ],
  conclusion:
    'Выбирая «ProektMangal», вы выбираете не просто место для огня — а центр притяжения для семьи и друзей, сделанный с душой и на совесть.',
}

const advantagesConfigData = {
  title: 'Наши преимущества',
  subtitle: 'Почему клиенты выбирают именно нас',
  items: [
    { id: 'materials', title: 'Качественные материалы', description: 'Только проверенные материалы для печей и мангалов: огнеупорный кирпич, кладочные смеси от надёжных поставщиков' },
    { id: 'terms', title: 'Соблюдение сроков', description: 'Чёткие сроки изготовления и монтажа печного комплекса — от проекта до сдачи под ключ' },
    { id: 'warranty', title: 'Гарантия качества', description: 'Гарантия на работы и материалы: ваш мангал и печной комплекс служат десятилетиями' },
    { id: 'range', title: 'Широкий выбор решений', description: 'Мангал, барбекю, печи, многосекторные комплексы и варианты кладки под любой запрос' },
    { id: 'experience', title: 'Опыт и репутация', description: 'Многолетний опыт строительства печных комплексов и зон огня для частных и коммерческих объектов' },
    { id: 'support', title: 'Профессиональная поддержка', description: 'Консультации по подбору конфигурации, расчёт стоимости и сопровождение от идеи до реализации' },
  ],
}

async function main() {
  console.log('🔄 Обновление контента «О нас»...')

  const existingSteps = await prisma.processStepsConfig.findFirst()
  const stepsPayload = {
    title: processStepsData.title,
    subtitle: '',
    steps: {
      mainMission: processStepsData.mainMission,
      specialization: processStepsData.specialization,
      advantages: processStepsData.advantages,
      conclusion: processStepsData.conclusion,
    },
  }

  if (existingSteps) {
    await prisma.processStepsConfig.update({
      where: { id: existingSteps.id },
      data: { ...stepsPayload, updatedAt: new Date() },
    })
    console.log('✅ ProcessStepsConfig обновлён (Ваш надёжный партнёр, Почему выбирают нас)')
  } else {
    await prisma.processStepsConfig.create({
      data: {
        id: 'default',
        ...stepsPayload,
        updatedAt: new Date(),
      },
    })
    console.log('✅ ProcessStepsConfig создан')
  }

  const existingAdv = await prisma.advantagesConfig.findFirst()
  if (existingAdv) {
    await prisma.advantagesConfig.update({
      where: { id: existingAdv.id },
      data: {
        title: advantagesConfigData.title,
        subtitle: advantagesConfigData.subtitle,
        items: advantagesConfigData.items,
        updatedAt: new Date(),
      },
    })
    console.log('✅ AdvantagesConfig обновлён (Наши преимущества, Почему клиенты выбирают именно нас)')
  } else {
    await prisma.advantagesConfig.create({
      data: {
        id: 'default',
        title: advantagesConfigData.title,
        subtitle: advantagesConfigData.subtitle,
        items: advantagesConfigData.items,
        updatedAt: new Date(),
      },
    })
    console.log('✅ AdvantagesConfig создан')
  }

  console.log('\n🎉 Контент «О нас» успешно обновлён в БД.')
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
