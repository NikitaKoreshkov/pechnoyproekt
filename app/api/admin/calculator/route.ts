import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function ensureAdmin(session: any) {
  return session?.user && ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')
}

export async function GET() {
  let cfg = await prisma.calculatorConfig.findFirst()
  if (!cfg) {
    cfg = await prisma.calculatorConfig.create({ data: {
      houseTypes: [{ id: 'steel', name: 'Стальные трубы', basePrice: 250, image: '/images/pipe-steel.jpg' }, { id: 'plastic', name: 'Пластиковые трубы (ПВХ)', basePrice: 150, image: '/images/pipe-plastic.jpg' }, { id: 'metalplastic', name: 'Металлопластиковые трубы', basePrice: 200, image: '/images/pipe-metalplastic.jpg' }],
      finishingOptions: [{ id: 'none', name: 'Без обработки', multiplier: 0 }, { id: 'galvanized', name: 'Оцинковка', multiplier: 0.15 }, { id: 'painted', name: 'Покраска', multiplier: 0.1 }, { id: 'insulated', name: 'Теплоизоляция', multiplier: 0.25 }],
      additionalOptions: [{ id: 'delivery', name: 'Доставка', price: 5000 }, { id: 'installation', name: 'Монтаж', price: 15000 }, { id: 'cutting', name: 'Резка по размерам', price: 3000 }, { id: 'welding', name: 'Сварочные работы', price: 20000 }],
      stepTexts: { step1Title: 'Выберите тип труб', step2Title: 'Укажите метраж и количество', step3Title: 'Выберите обработку/покрытие', step4Title: 'Дополнительные услуги' },
      areaSettings: { minArea: 1, maxArea: 12, defaultArea: 6, minQuantity: 1, maxQuantity: 100, defaultQuantity: 1 },
      formula: 'basePrice = house.basePrice * area; basePrice += finishingSum; basePrice += optionsSum; return Math.round(basePrice);',
      whatsappTemplate: 'Шаблон MAX',
      estimateTemplate: 'Шаблон сметы'
    } })
  }
  return NextResponse.json(cfg, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!ensureAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  console.log('[CALCULATOR POST] Body received:', JSON.stringify(body))
  const existing = await prisma.calculatorConfig.findFirst()
  if (existing) {
    console.log('[CALCULATOR POST] Updating config:', existing.id)
    console.log('[CALCULATOR POST] finishingOptions before:', JSON.stringify(existing.finishingOptions))
    console.log('[CALCULATOR POST] finishingOptions after:', JSON.stringify(body.finishingOptions))
    const updated = await prisma.calculatorConfig.update({ where: { id: existing.id }, data: {
      houseTypes: body.houseTypes,
      finishingOptions: body.finishingOptions,
      additionalOptions: body.additionalOptions,
      stepTexts: body.stepTexts,
      areaSettings: body.areaSettings,
      formula: body.formula || body.calculationLogic,
      whatsappTemplate: body.whatsappTemplate,
      estimateTemplate: body.estimateTemplate
    } })
    console.log('[CALCULATOR POST] Updated config:', JSON.stringify(updated.finishingOptions))
    return NextResponse.json(updated, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } else {
    const created = await prisma.calculatorConfig.create({ data: body })
    return NextResponse.json(created, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  }
}
