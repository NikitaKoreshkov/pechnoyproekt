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
      id: 'default',
      houseTypes: [{ id: 'basic', name: 'Базовый вариант', basePrice: 250, image: '/images/house.jpg' }, { id: 'standard', name: 'Стандарт', basePrice: 150, image: '/images/house.jpg' }, { id: 'premium', name: 'Премиум', basePrice: 200, image: '/images/house.jpg' }],
      finishingOptions: [{ id: 'none', name: 'Без дополнений', multiplier: 0 }, { id: 'opt1', name: 'Опция 1', multiplier: 0.15 }, { id: 'opt2', name: 'Опция 2', multiplier: 0.1 }, { id: 'opt3', name: 'Опция 3', multiplier: 0.25 }],
      additionalOptions: [{ id: 'delivery', name: 'Доставка', price: 5000 }, { id: 'installation', name: 'Монтаж', price: 15000 }, { id: 'extra', name: 'Доп. услуги', price: 3000 }],
      stepTexts: { step1Title: 'Выберите вариант', step2Title: 'Укажите параметры', step3Title: 'Выберите дополнения', step4Title: 'Дополнительные услуги' },
      areaSettings: { minArea: 1, maxArea: 12, defaultArea: 6, minQuantity: 1, maxQuantity: 100, defaultQuantity: 1 },
      formula: 'basePrice = house.basePrice * area; basePrice += finishingSum; basePrice += optionsSum; return Math.round(basePrice);',
      whatsappTemplate: 'Шаблон расчёта',
      estimateTemplate: 'Шаблон сметы',
      updatedAt: new Date()
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
