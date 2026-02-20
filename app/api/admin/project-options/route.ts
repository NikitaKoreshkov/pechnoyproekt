import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Отключаем кэширование для получения актуальных данных
export const dynamic = 'force-dynamic'
export const revalidate = 0

function ensureAdmin(session: any) {
  return session?.user && ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')
}

export async function GET() {
  let cfg = await prisma.projectOptionsConfig.findFirst()
  if (!cfg) {
    // Создаём дефолтную конфигурацию
    cfg = await prisma.projectOptionsConfig.create({ 
      data: {
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
      } 
    })
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
  try {
    const session = await getServerSession(authOptions)
    console.log('[API ADMIN] POST /api/admin/project-options - Session:', session?.user?.email, 'Role:', session?.user?.role)
    
    if (!ensureAdmin(session)) {
      console.error('[API ADMIN] Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await req.json()
    console.log('[API ADMIN] Received project options:', JSON.stringify(body, null, 2))
    
    // Валидация данных
    if (!body || typeof body !== 'object') {
      console.error('[API ADMIN] Invalid request body')
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Нормализация данных
    const dataToSave = {
      finishing: Array.isArray(body.finishing) ? body.finishing : [],
      insulation: Array.isArray(body.insulation) ? body.insulation : [],
      floor: Array.isArray(body.floor) ? body.floor : [],
      foundation: Array.isArray(body.foundation) ? body.foundation : []
    }

    // Проверка, что все категории не пусты
    const categories = ['finishing', 'insulation', 'floor', 'foundation'] as const
    for (const category of categories) {
      if (dataToSave[category].length === 0) {
        console.error(`[API ADMIN] Category ${category} is empty`)
        return NextResponse.json({ error: `Категория ${category} не может быть пустой` }, { status: 400 })
      }
    }

    const existing = await prisma.projectOptionsConfig.findFirst()
    
    if (existing) {
      console.log('[API ADMIN] Updating existing config:', existing.id)
      const updated = await prisma.projectOptionsConfig.update({ 
        where: { id: existing.id }, 
        data: dataToSave
      })
      console.log('[API ADMIN] Successfully updated project options:', updated.id)
      console.log('[API ADMIN] Updated data:', {
        finishing: updated.finishing,
        insulation: updated.insulation,
        floor: updated.floor,
        foundation: updated.foundation
      })
      return NextResponse.json(updated, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    } else {
      console.log('[API ADMIN] Creating new config')
      const created = await prisma.projectOptionsConfig.create({ 
        data: dataToSave
      })
      console.log('[API ADMIN] Successfully created project options:', created.id)
      return NextResponse.json(created, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    }
  } catch (error: any) {
    console.error('[API ADMIN] Error saving project options:', error)
    console.error('[API ADMIN] Error stack:', error.stack)
    return NextResponse.json({ 
      error: error.message || 'Ошибка сохранения',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

