import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function ensureAdmin(session: any) {
  return session?.user && ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')
}

// Дефолтная конфигурация фильтров для aquagazteh (трубы, фитинги, газовое оборудование)
const defaultFiltersConfig = {
  price: {
    title: 'Цена',
    type: 'range',
    min: 0,
    max: 50000000,
    step: 500000
  },
  area: {
    title: 'Диаметр',
    type: 'range',
    min: 20,
    max: 630,
    step: 10
  },
  material: {
    title: 'Материал',
    type: 'checkboxes',
    options: [
      { label: 'ПНД (ПЭ)', value: 'ПНД' },
      { label: 'ПЭ-100', value: 'ПЭ-100' },
      { label: 'ПЭ-80', value: 'ПЭ-80' },
      { label: 'ПВХ', value: 'ПВХ' },
      { label: 'ППР', value: 'ППР' },
      { label: 'Металлопластик', value: 'металлопластик' }
    ]
  },
  buildTime: {
    title: 'Длина',
    type: 'checkboxes',
    options: [
      { label: 'до 50 м', value: 'до 50 м' },
      { label: '50-100 м', value: '50-100 м' },
      { label: '100+ м', value: '100+ м' }
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

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!ensureAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const sectionId = searchParams.get('sectionId') || undefined
  const subsectionId = searchParams.get('subsectionId') || undefined
  const subsubsectionId = searchParams.get('subsubsectionId') || undefined

  // Приоритет: subsectionId > subsubsectionId (используем parent subsection) > sectionId > глобальные
  let targetSectionId = sectionId || null
  let targetSubsectionId = subsectionId || null

  if (subsubsectionId && !subsectionId) {
    const subsub = await prisma.catalogSubsubsection.findUnique({ where: { id: subsubsectionId } })
    if (subsub) targetSubsectionId = subsub.subsectionId
  }

  let cfg = null
  if (targetSubsectionId) {
    cfg = await prisma.catalogFiltersConfig.findFirst({ where: { subsectionId: targetSubsectionId } })
  }
  if (!cfg && targetSectionId) {
    cfg = await prisma.catalogFiltersConfig.findFirst({ where: { sectionId: targetSectionId, subsectionId: null } })
  }
  if (!cfg) {
    cfg = await prisma.catalogFiltersConfig.findFirst({ where: { sectionId: null, subsectionId: null } })
  }
  if (!cfg) {
    cfg = await prisma.catalogFiltersConfig.findFirst()
  }
  if (!cfg) {
    const newId = `cfg-global-${Date.now()}`
    cfg = await prisma.catalogFiltersConfig.create({ data: { id: newId, config: {}, sectionId: null, subsectionId: null } })
  }

  const { blocks, layout, ...clean } = (cfg.config || {}) as any
  return NextResponse.json({
    id: cfg.id,
    config: clean,
    sectionId: cfg.sectionId,
    subsectionId: cfg.subsectionId
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!ensureAdmin(session)) {
    console.log('[ADMIN FILTERS POST] Unauthorized - session:', session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const body = await req.json()
    console.log('[ADMIN FILTERS POST] Received body keys:', Object.keys(body))
    console.log('[ADMIN FILTERS POST] Received config keys:', Object.keys(body.config || {}))
    console.log('[ADMIN FILTERS POST] Received config:', JSON.stringify(body.config, null, 2))
    
    if (!body.config || typeof body.config !== 'object') {
      console.error('[ADMIN FILTERS POST] Invalid config format')
      return NextResponse.json({ error: 'Invalid config format' }, { status: 400 })
    }
    
    // Разрешаем произвольные фильтры. Чистим blocks/layout и сохраняем как есть
    const { blocks, layout, ...cleanConfig } = body.config || {}
    // На всякий случай глубоко копируем
    const configToSave: any = JSON.parse(JSON.stringify(cleanConfig || {}))
    
    console.log('[ADMIN FILTERS POST] Saving config with keys:', Object.keys(configToSave))
    console.log('[ADMIN FILTERS POST] Saving config:', JSON.stringify(configToSave, null, 2))
    
    const sectionId = body.sectionId && String(body.sectionId).trim() ? body.sectionId : null
    const subsectionId = body.subsectionId && String(body.subsectionId).trim() ? body.subsectionId : null

    let existing = null
    if (subsectionId) {
      existing = await prisma.catalogFiltersConfig.findFirst({ where: { subsectionId } })
    } else if (sectionId) {
      existing = await prisma.catalogFiltersConfig.findFirst({ where: { sectionId, subsectionId: null } })
    } else {
      existing = await prisma.catalogFiltersConfig.findFirst({ where: { sectionId: null, subsectionId: null } })
    }

    if (existing) {
      const updated = await prisma.catalogFiltersConfig.update({ 
        where: { id: existing.id }, 
        data: { config: configToSave } 
      })
      console.log('[ADMIN FILTERS POST] Updated successfully')
      
      // Проверяем, что данные действительно сохранились
      const verify = await prisma.catalogFiltersConfig.findUnique({ where: { id: existing.id } })
      console.log('[ADMIN FILTERS POST] Verified saved config keys:', Object.keys((verify?.config || {}) as any))
      console.log('[ADMIN FILTERS POST] Verified saved config:', JSON.stringify(verify?.config, null, 2))
      
      // Дополнительная проверка - сравниваем ключи
      const savedKeys = Object.keys((verify?.config || {}) as any)
      const sentKeys = Object.keys(configToSave)
      if (savedKeys.length !== sentKeys.length || !sentKeys.every(k => savedKeys.includes(k))) {
        console.error('[ADMIN FILTERS POST] MISMATCH! Sent keys:', sentKeys)
        console.error('[ADMIN FILTERS POST] MISMATCH! Saved keys:', savedKeys)
      }
      
      return NextResponse.json({ id: updated.id, config: configToSave, sectionId: existing.sectionId, subsectionId: existing.subsectionId }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } else {
      const newId = `cfg-${subsectionId || sectionId || 'global'}-${Date.now()}`
      const created = await prisma.catalogFiltersConfig.create({
        data: {
          id: newId,
          config: configToSave,
          sectionId: subsectionId ? null : (sectionId || null),
          subsectionId: subsectionId || null
        }
      })
      console.log('[ADMIN FILTERS POST] Created successfully with ID:', created.id)
      return NextResponse.json({ id: created.id, config: configToSave }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    }
  } catch (error: any) {
    console.error('[ADMIN FILTERS POST] Error:', error)
    console.error('[ADMIN FILTERS POST] Error stack:', error?.stack)
    return NextResponse.json({ 
      error: 'Failed to save filters config', 
      details: error?.message 
    }, { status: 500 })
  }
}
