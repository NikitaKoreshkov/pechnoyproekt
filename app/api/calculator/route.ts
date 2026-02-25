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
        houseTypes: [{ id: 'basic', name: 'Базовый вариант', basePrice: 250, image: '/images/house.jpg' }, { id: 'standard', name: 'Стандарт', basePrice: 150, image: '/images/house.jpg' }, { id: 'premium', name: 'Премиум', basePrice: 200, image: '/images/house.jpg' }],
        finishingOptions: [{ id: 'none', name: 'Без дополнений', multiplier: 0 }, { id: 'opt1', name: 'Опция 1', multiplier: 0.15 }, { id: 'opt2', name: 'Опция 2', multiplier: 0.1 }, { id: 'opt3', name: 'Опция 3', multiplier: 0.25 }],
        additionalOptions: [{ id: 'delivery', name: 'Доставка', price: 5000 }, { id: 'installation', name: 'Монтаж', price: 15000 }, { id: 'extra', name: 'Доп. услуги', price: 3000 }],
        stepTexts: { step1Title: 'Выберите вариант', step2Title: 'Укажите параметры', step3Title: 'Выберите дополнения', step4Title: 'Дополнительные услуги' },
        areaSettings: { minArea: 1, maxArea: 12, defaultArea: 6, minQuantity: 1, maxQuantity: 100, defaultQuantity: 1 },
        formula: 'basePrice = house.basePrice * area; basePrice += finishingSum; basePrice += optionsSum; return Math.round(basePrice);',
        whatsappTemplate: `📋 Расчёт стоимости

• Вариант: {{houseType}}
• Параметры: {{area}}

Дополнения: {{finishing}}
Услуги: {{options}}

💰 Стоимость: {{price}}

Свяжитесь со мной для уточнения!`,
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
      stepTexts: (cfg.stepTexts as any) || { step1Title: 'Выберите вариант', step2Title: 'Укажите параметры', step3Title: 'Выберите дополнения', step4Title: 'Дополнительные услуги' },
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
      houseTypes: [{ id: 'basic', name: 'Базовый вариант', basePrice: 250, image: '/images/house.jpg' }, { id: 'standard', name: 'Стандарт', basePrice: 150, image: '/images/house.jpg' }, { id: 'premium', name: 'Премиум', basePrice: 200, image: '/images/house.jpg' }],
      finishingOptions: [{ id: 'none', name: 'Без дополнений', multiplier: 0 }, { id: 'opt1', name: 'Опция 1', multiplier: 0.15 }, { id: 'opt2', name: 'Опция 2', multiplier: 0.1 }, { id: 'opt3', name: 'Опция 3', multiplier: 0.25 }],
      additionalOptions: [{ id: 'delivery', name: 'Доставка', price: 5000 }, { id: 'installation', name: 'Монтаж', price: 15000 }, { id: 'extra', name: 'Доп. услуги', price: 3000 }],
      stepTexts: { step1Title: 'Выберите вариант', step2Title: 'Укажите параметры', step3Title: 'Выберите дополнения', step4Title: 'Дополнительные услуги' },
      areaSettings: { minArea: 20, maxArea: 120, defaultArea: 50 }
    })
  }
}

