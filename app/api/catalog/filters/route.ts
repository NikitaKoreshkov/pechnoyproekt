import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Дефолтная конфигурация (на случай, если БД пустая)
const defaultFiltersConfig = {
  price: {
    title: 'Цена',
    type: 'range',
    min: 0,
    max: 50000000,
    step: 500000
  },
  diameter: {
    title: 'Диаметр',
    type: 'range',
    min: 20,
    max: 630,
    step: 10
  },
  material: {
    title: 'Тип трубы',
    type: 'checkboxes',
    options: [
      { label: 'ПНД (ПЭ)', value: 'ПНД' },
      { label: 'ПВХ', value: 'ПВХ' },
      { label: 'Металлопластик', value: 'металлопластик' }
    ]
  },
  pressure: {
    title: 'Рабочее давление',
    type: 'checkboxes',
    options: [
      { label: 'до 6 атм', value: 'до 6 атм' },
      { label: 'до 10 атм', value: 'до 10 атм' },
      { label: '10+ атм', value: '10+ атм' }
    ]
  },
  features: {
    title: 'Дополнительные опции',
    type: 'checkboxes',
    options: [
      { label: 'С доставкой', value: 'доставка' },
      { label: 'С монтажом', value: 'монтаж' },
      { label: 'Комплектующие', value: 'комплектующие' }
    ]
  }
}

export async function GET() {
  try {
    let cfg = await prisma.catalogFiltersConfig.findFirst()
    if (!cfg) {
      cfg = await prisma.catalogFiltersConfig.create({ data: { config: {} } })
    }
    const { blocks, layout, ...clean } = (cfg.config || {}) as any
    
    console.log('[PUBLIC FILTERS GET] Config keys:', Object.keys(clean))
    console.log('[PUBLIC FILTERS GET] Config:', JSON.stringify(clean, null, 2))
    
    // Всегда возвращаем данные из БД, даже если они пустые
    // Если БД пустая - вернем пустой объект, а не дефолты
    return NextResponse.json(clean || {}, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('[PUBLIC FILTERS GET] Error loading catalog filters config:', error)
    // При ошибке возвращаем пустой объект, а не дефолты
    return NextResponse.json({}, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  }
}

