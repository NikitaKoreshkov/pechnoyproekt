import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Отключаем кеширование Next.js для этого роута
export const dynamic = 'force-dynamic'
export const revalidate = 0

function ensureAdmin(session: any) {
  return session?.user && ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')
}

export async function GET() {
  try {
    // Используем транзакцию для гарантии консистентности
    const config = await prisma.$transaction(async (tx) => {
      // Берем ВСЕ записи и находим самую свежую
      const allConfigs = await tx.headerConfig.findMany({
        orderBy: { updatedAt: 'desc' }
      })
      
      console.log('[ADMIN HEADER] GET - Found configs:', allConfigs.length, allConfigs.map(c => ({ id: c.id, logoText: c.logoText, updatedAt: c.updatedAt })))
      
      let latestConfig = allConfigs[0]
      
      // Если записей несколько, удаляем ВСЕ кроме самой свежей
      if (allConfigs.length > 1) {
        const idsToDelete = allConfigs.slice(1).map(c => c.id)
        const deleteResult = await tx.headerConfig.deleteMany({
          where: { id: { in: idsToDelete } }
        })
        console.log('[ADMIN HEADER] GET - Removed duplicate configs:', deleteResult.count, 'IDs:', idsToDelete)
      }
      
      // Если нет записей, создаем дефолтную
      if (!latestConfig) {
        latestConfig = await tx.headerConfig.create({
          data: {
            logoText: 'Печнойпроект',
            logoImage: null,
            showLogoText: true
          }
        })
        console.log('[ADMIN HEADER] GET - Created default config:', latestConfig.id)
      }
      
      return latestConfig
    })
    
    console.log('[ADMIN HEADER] GET - Returning config:', config.id, config.logoText, 'updatedAt:', config.updatedAt)
    
    // Отключаем кеширование
    return NextResponse.json(config, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error: any) {
    console.error('[ADMIN HEADER] GET Error:', error)
    return NextResponse.json({ error: 'Ошибка загрузки конфигурации' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  console.log('[ADMIN HEADER] POST - Session:', !!session, session?.user?.email, session?.user?.role)
  if (!ensureAdmin(session)) {
    console.log('[ADMIN HEADER] POST - Unauthorized')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    console.log('[ADMIN HEADER] POST - Body:', body)
    const { logoText, logoImage, showLogoText } = body

    // Валидация
    if (typeof showLogoText !== 'boolean') {
      console.log('[ADMIN HEADER] POST - Invalid showLogoText')
      return NextResponse.json({ error: 'Invalid showLogoText' }, { status: 400 })
    }

    // Используем ?? вместо || чтобы не заменять пустую строку на дефолт
    const configData = {
      logoText: logoText ?? 'Печнойпроект',
      logoImage: logoImage || null,
      showLogoText
    }
    
    console.log('[ADMIN HEADER] POST - Config data to save:', configData)

    // Используем транзакцию: удаляем все старые записи и создаем новую
    const config = await prisma.$transaction(async (tx) => {
      // Сначала получаем количество записей для логирования
      const countBefore = await tx.headerConfig.count()
      console.log('[ADMIN HEADER] POST - Records before delete:', countBefore)
      
      // ВАЖНО: Удаляем ВСЕ существующие записи перед созданием новой
      // Это гарантирует, что всегда будет только одна запись
      const deleteResult = await tx.headerConfig.deleteMany({})
      console.log('[ADMIN HEADER] POST - Deleted records:', deleteResult.count)
      
      // Создаем новую запись с актуальными данными
      const newConfig = await tx.headerConfig.create({
        data: configData
      })
      console.log('[ADMIN HEADER] POST - Created new config:', newConfig.id, newConfig.logoText)
      return newConfig
    })

    // Перечитываем из БД после транзакции для гарантии
    const savedConfig = await prisma.headerConfig.findFirst({
      orderBy: { updatedAt: 'desc' }
    })

    if (!savedConfig) {
      console.error('[ADMIN HEADER] POST - ERROR: Config not found after save!')
      return NextResponse.json({ error: 'Failed to save config' }, { status: 500 })
    }

    console.log('[ADMIN HEADER] POST - Final saved config:', savedConfig.id, savedConfig.logoText, 'updatedAt:', savedConfig.updatedAt)
    
    // Отключаем кеширование в ответе
    return NextResponse.json(savedConfig, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error: any) {
    console.error('[ADMIN HEADER] POST Error:', error)
    return NextResponse.json({ error: 'Ошибка сохранения конфигурации' }, { status: 500 })
  }
}

