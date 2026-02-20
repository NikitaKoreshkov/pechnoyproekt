import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    let cfg = await prisma.calculatorConfig.findFirst()
    console.log('[API CALCULATOR GET] Config from DB:', cfg ? { id: cfg.id, finishingCount: (cfg.finishingOptions as any)?.length, additionalCount: (cfg.additionalOptions as any)?.length } : 'NOT FOUND')
    if (!cfg) {
      // Возвращаем дефолтные значения, если конфига нет
      return NextResponse.json({
        id: 'default',
        houseTypes: [{ id: 'steel', name: 'Стальные трубы', basePrice: 250, image: '/images/pipe-steel.jpg' }, { id: 'plastic', name: 'Пластиковые трубы (ПВХ)', basePrice: 150, image: '/images/pipe-plastic.jpg' }, { id: 'metalplastic', name: 'Металлопластиковые трубы', basePrice: 200, image: '/images/pipe-metalplastic.jpg' }],
        finishingOptions: [{ id: 'none', name: 'Без обработки', multiplier: 0 }, { id: 'galvanized', name: 'Оцинковка', multiplier: 0.15 }, { id: 'painted', name: 'Покраска', multiplier: 0.1 }, { id: 'insulated', name: 'Теплоизоляция', multiplier: 0.25 }],
        additionalOptions: [{ id: 'delivery', name: 'Доставка', price: 5000 }, { id: 'installation', name: 'Монтаж', price: 15000 }, { id: 'cutting', name: 'Резка по размерам', price: 3000 }, { id: 'welding', name: 'Сварочные работы', price: 20000 }],
        stepTexts: { step1Title: 'Выберите тип труб', step2Title: 'Укажите метраж и количество', step3Title: 'Выберите обработку/покрытие', step4Title: 'Дополнительные услуги' },
        areaSettings: { minArea: 1, maxArea: 12, defaultArea: 6, minQuantity: 1, maxQuantity: 100, defaultQuantity: 1 },
        formula: 'basePrice = house.basePrice * area; basePrice += finishingSum; basePrice += optionsSum; return Math.round(basePrice);',
        whatsappTemplate: `🔧 РАСЧЁТ СТОИМОСТИ ТРУБ

📋 Параметры:
• Тип труб: {{houseType}}
• Метраж: {{area}} м

🎨 Обработка/покрытие:
{{finishing}}

✨ Дополнительные услуги:
{{options}}

💰 Предварительная стоимость:
{{price}}

📞 Свяжитесь со мной для получения точного расчёта и консультации!`,
        estimateTemplate: ''
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    }
    // Prisma автоматически десериализует JSON поля
    return NextResponse.json({
      id: cfg.id,
      houseTypes: cfg.houseTypes as any,
      finishingOptions: cfg.finishingOptions as any,
      additionalOptions: cfg.additionalOptions as any,
      stepTexts: (cfg.stepTexts as any) || { step1Title: 'Выберите тип труб', step2Title: 'Укажите метраж и количество', step3Title: 'Выберите обработку/покрытие', step4Title: 'Дополнительные услуги' },
      areaSettings: (cfg.areaSettings as any) || { minArea: 20, maxArea: 120, defaultArea: 50 },
      formula: cfg.formula,
      whatsappTemplate: cfg.whatsappTemplate || '',
      estimateTemplate: cfg.estimateTemplate || ''
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error: any) {
    console.error('Error in GET /api/calculator:', error)
    return NextResponse.json({
      houseTypes: [{ id: 'steel', name: 'Стальные трубы', basePrice: 250, image: '/images/pipe-steel.jpg' }, { id: 'plastic', name: 'Пластиковые трубы (ПВХ)', basePrice: 150, image: '/images/pipe-plastic.jpg' }, { id: 'metalplastic', name: 'Металлопластиковые трубы', basePrice: 200, image: '/images/pipe-metalplastic.jpg' }],
      finishingOptions: [{ id: 'none', name: 'Без обработки', multiplier: 0 }, { id: 'galvanized', name: 'Оцинковка', multiplier: 0.15 }, { id: 'painted', name: 'Покраска', multiplier: 0.1 }, { id: 'insulated', name: 'Теплоизоляция', multiplier: 0.25 }],
      additionalOptions: [{ id: 'delivery', name: 'Доставка', price: 5000 }, { id: 'installation', name: 'Монтаж', price: 15000 }, { id: 'cutting', name: 'Резка по размерам', price: 3000 }, { id: 'welding', name: 'Сварочные работы', price: 20000 }],
      stepTexts: { step1Title: 'Выберите тип труб', step2Title: 'Укажите метраж и количество', step3Title: 'Выберите обработку/покрытие', step4Title: 'Дополнительные услуги' },
      areaSettings: { minArea: 20, maxArea: 120, defaultArea: 50 }
    })
  }
}

