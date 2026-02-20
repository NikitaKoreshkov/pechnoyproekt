import { NextResponse } from 'next/server'

// Отключаем кэширование для получения актуальных данных
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    // Возвращаем дефолтные значения глобальных опций
    // Опции теперь хранятся в проектах (specs.optionCategories), глобальные опции используются только как fallback
    return NextResponse.json({
      finishing: [
        { id: 'vagonka', label: 'Вагонка', price: 0, isDefault: true },
        { id: 'imitation', label: 'Имитация бруса', price: 25000, isDefault: false }
      ],
      insulation: [
        { id: '100mm', label: '100мм', price: 0, isDefault: true },
        { id: '150mm', label: '150мм', price: 80000, isDefault: false }
      ],
      floor: [
        { id: 'osb', label: 'ОСБ', price: 0, isDefault: true },
        { id: 'shpunt', label: 'Шпунтованный 28мм', price: 19000, isDefault: false }
      ],
      foundation: [
        { id: 'blocks', label: 'Фундаментные блоки (40x20x20)', price: 0, isDefault: true },
        { id: 'piles', label: 'Сваи металлические', price: 43200, isDefault: false }
      ]
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (e: any) {
    console.error('[PROJECT OPTIONS] Error:', e)
    // Возвращаем дефолтные значения даже при ошибке
    return NextResponse.json({
      finishing: [],
      insulation: [],
      floor: [],
      foundation: []
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  }
}

