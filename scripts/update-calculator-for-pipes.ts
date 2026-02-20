/**
 * Скрипт для обновления калькулятора под тематику продажи труб
 * Запуск: npx tsx scripts/update-calculator-for-pipes.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateCalculatorForPipes() {
  try {
    console.log('🔄 Начинаю обновление калькулятора под продажу труб...')

    const pipeTypes = [
      { id: 'steel', name: 'Стальные трубы', basePrice: 250, image: '/images/pipe-steel.jpg' },
      { id: 'plastic', name: 'Пластиковые трубы (ПВХ)', basePrice: 150, image: '/images/pipe-plastic.jpg' },
      { id: 'metalplastic', name: 'Металлопластиковые трубы', basePrice: 200, image: '/images/pipe-metalplastic.jpg' }
    ]

    const finishingOptions = [
      { id: 'none', name: 'Без обработки', multiplier: 0 },
      { id: 'galvanized', name: 'Оцинковка', multiplier: 0.15 },
      { id: 'painted', name: 'Покраска', multiplier: 0.1 },
      { id: 'insulated', name: 'Теплоизоляция', multiplier: 0.25 }
    ]

    const additionalOptions = [
      { id: 'delivery', name: 'Доставка', price: 5000 },
      { id: 'installation', name: 'Монтаж', price: 15000 },
      { id: 'cutting', name: 'Резка по размерам', price: 3000 },
      { id: 'welding', name: 'Сварочные работы', price: 20000 }
    ]

    const stepTexts = {
      step1Title: 'Выберите тип труб',
      step2Title: 'Укажите метраж и количество',
      step3Title: 'Выберите обработку/покрытие',
      step4Title: 'Дополнительные услуги'
    }

    const areaSettings = {
      minArea: 1,
      maxArea: 12,
      defaultArea: 6,
      minQuantity: 1,
      maxQuantity: 100,
      defaultQuantity: 1
    }

    const whatsappTemplate = `🔧 РАСЧЁТ СТОИМОСТИ ТРУБ

📋 Параметры:
• Тип труб: {{houseType}}
• Метраж одной трубы: {{pipeLength}} м
• Количество: {{quantity}} шт.
• Общий метраж: {{area}} м

🎨 Обработка/покрытие:
{{finishing}}

✨ Дополнительные услуги:
{{options}}

💰 Предварительная стоимость:
{{price}}

📞 Свяжитесь со мной для получения точного расчёта и консультации!`

    const estimateTemplate = 'Шаблон сметы для труб'

    const existing = await prisma.calculatorConfig.findFirst()
    
    if (existing) {
      const updated = await prisma.calculatorConfig.update({
        where: { id: existing.id },
        data: {
          houseTypes: pipeTypes,
          finishingOptions: finishingOptions,
          additionalOptions: additionalOptions,
          stepTexts: stepTexts,
          areaSettings: areaSettings,
          whatsappTemplate: whatsappTemplate,
          estimateTemplate: estimateTemplate
        }
      })
      console.log('✅ Калькулятор обновлен:', updated.id)
    } else {
      const created = await prisma.calculatorConfig.create({
        data: {
          houseTypes: pipeTypes,
          finishingOptions: finishingOptions,
          additionalOptions: additionalOptions,
          stepTexts: stepTexts,
          areaSettings: areaSettings,
          formula: 'basePrice = house.basePrice * area; basePrice += finishingSum; basePrice += optionsSum; return Math.round(basePrice);',
          whatsappTemplate: whatsappTemplate,
          estimateTemplate: estimateTemplate
        }
      })
      console.log('✅ Калькулятор создан:', created.id)
    }

    console.log('✅ Обновление завершено успешно!')
  } catch (error) {
    console.error('❌ Ошибка при обновлении:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateCalculatorForPipes()
  .then(() => {
    console.log('🎉 Скрипт выполнен успешно')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Критическая ошибка:', error)
    process.exit(1)
  })
