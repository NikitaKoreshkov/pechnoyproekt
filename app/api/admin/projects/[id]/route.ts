import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function ensureAdmin(session: any) {
  return session?.user && ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
  const session = await getServerSession(authOptions)
  if (!ensureAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const resolvedParams = params instanceof Promise ? await params : params
    const projectId = resolvedParams?.id
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }
    
  // Пробуем найти по ID (UUID), если не найдено - по slug
    let project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) {
    project = await prisma.project.findUnique({ where: { slug: projectId } })
  }
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  
  // Убеждаемся, что JSON поля правильно сериализуются
  // Используем JSON.parse(JSON.stringify()) для корректной сериализации всех данных включая JSON поля
  const projectData = JSON.parse(JSON.stringify({
    ...project,
    specs: project.specs || null,
    filterValues: project.filterValues || null,
    technicalSpecs: project.technicalSpecs || null
  }))
  
  console.log('[ADMIN PROJECTS GET] Project specs:', projectData.specs, 'type:', typeof projectData.specs)
  
  return NextResponse.json(projectData, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
  } catch (error: any) {
    console.error('[ADMIN PROJECTS GET] Error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error?.message }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  return PATCH(req, { params })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
  const session = await getServerSession(authOptions)
  if (!ensureAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const resolvedParams = params instanceof Promise ? await params : params
    const projectId = resolvedParams?.id
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }
    
  const body = await req.json()
  
  // Пробуем найти по ID (UUID), если не найдено - по slug
    let project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) {
      project = await prisma.project.findUnique({ where: { slug: projectId } })
  }
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  
  const data: any = {}
  if (typeof body.slug !== 'undefined') data.slug = body.slug
  if (typeof body.title !== 'undefined') data.title = body.title
  if (typeof body.area !== 'undefined') data.area = Number(body.area)
  if (typeof body.priceFrom !== 'undefined') data.priceFrom = Number(body.priceFrom)
  if (typeof body.priceTo !== 'undefined') data.priceTo = body.priceTo ? Number(body.priceTo) : null
  if (typeof body.floors !== 'undefined') data.floors = Number(body.floors)
  if (typeof body.material !== 'undefined') data.material = body.material
  if (typeof body.buildTime !== 'undefined') data.buildTime = Number(body.buildTime)
  if (typeof body.completion !== 'undefined') data.completion = body.completion
  if (typeof body.region !== 'undefined') data.region = body.region
  if (typeof body.image !== 'undefined') data.image = body.image
  if (Array.isArray(body.images)) data.images = body.images
  if (Array.isArray(body.tags)) data.tags = body.tags
  if (typeof body.hasTerrasse !== 'undefined') data.hasTerrasse = !!body.hasTerrasse
  if (typeof body.hasBath !== 'undefined') data.hasBath = !!body.hasBath
  if (typeof body.hasGarage !== 'undefined') data.hasGarage = !!body.hasGarage
  if (Array.isArray(body.features)) data.features = body.features
  if (typeof body.description !== 'undefined') data.description = body.description
  if (Array.isArray(body.advantages)) data.advantages = body.advantages
  if (typeof body.technicalSpecs !== 'undefined') {
    // Если пустая строка - сохраняем как null
    data.technicalSpecs = body.technicalSpecs && body.technicalSpecs.trim() ? body.technicalSpecs.trim() : null
  }
  if (typeof body.specs !== 'undefined') {
    console.log('[ADMIN PROJECTS PATCH] Received specs:', body.specs)
    console.log('[ADMIN PROJECTS PATCH] specs type:', typeof body.specs)
    data.specs = body.specs
  }
  if (typeof body.filterValues !== 'undefined') {
    console.log('[ADMIN PROJECTS PATCH] Received filterValues:', body.filterValues)
    console.log('[ADMIN PROJECTS PATCH] filterValues type:', typeof body.filterValues)
    console.log('[ADMIN PROJECTS PATCH] filterValues keys:', Object.keys(body.filterValues || {}))
    data.filterValues = body.filterValues
  }
  if (typeof body.variationGroupId !== 'undefined') {
    data.variationGroupId = body.variationGroupId && body.variationGroupId.trim() ? body.variationGroupId.trim() : null
  }
  if (typeof body.subsectionId !== 'undefined') {
    data.subsectionId = body.subsectionId && String(body.subsectionId).trim() ? body.subsectionId : null
  }
  if (typeof body.subsubsectionId !== 'undefined') {
    data.subsubsectionId = body.subsubsectionId && String(body.subsubsectionId).trim() ? body.subsubsectionId : null
  }
  
  console.log('[ADMIN PROJECTS PATCH] Data to save:', JSON.stringify(data, null, 2))
  console.log('[ADMIN PROJECTS PATCH] technicalSpecs:', data.technicalSpecs, 'type:', typeof data.technicalSpecs)
  const updated = await prisma.project.update({ where: { id: project.id }, data })
  console.log('[ADMIN PROJECTS PATCH] Updated project filterValues:', updated.filterValues)
  console.log('[ADMIN PROJECTS PATCH] Updated project specs:', updated.specs)
  console.log('[ADMIN PROJECTS PATCH] Updated project technicalSpecs:', updated.technicalSpecs)

  // Убеждаемся, что JSON поля правильно сериализуются в ответе
  const responseData = JSON.parse(JSON.stringify({
    ...updated,
    specs: updated.specs || null,
    filterValues: updated.filterValues || null,
    technicalSpecs: updated.technicalSpecs || null
  }))
  
  return NextResponse.json(responseData, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
  } catch (error: any) {
    console.error('[ADMIN PROJECTS PATCH] Error:', error)
    console.error('[ADMIN PROJECTS PATCH] Error name:', error?.name)
    console.error('[ADMIN PROJECTS PATCH] Error code:', error?.code)
    console.error('[ADMIN PROJECTS PATCH] Error message:', error?.message)
    console.error('[ADMIN PROJECTS PATCH] Error stack:', error?.stack?.substring(0, 1000))
    if (error?.meta) {
      console.error('[ADMIN PROJECTS PATCH] Error meta:', JSON.stringify(error.meta, null, 2))
    }
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error?.message,
      code: error?.code,
      meta: error?.meta
    }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    console.log('[ADMIN DELETE] Received DELETE request')
  const session = await getServerSession(authOptions)
    if (!ensureAdmin(session)) {
      console.log('[ADMIN DELETE] Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    let resolvedParams
    try {
      resolvedParams = params instanceof Promise ? await params : params
    } catch (paramsError: any) {
      console.error('[ADMIN DELETE] Error resolving params:', paramsError)
      return NextResponse.json({
        error: 'Invalid request parameters',
        details: paramsError?.message
      }, { status: 400 })
    }
    
    const projectId = resolvedParams?.id
    console.log('[ADMIN DELETE] Project ID:', projectId)
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }
    
  // Пробуем найти по ID (UUID), если не найдено - по slug
    let project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) {
      project = await prisma.project.findUnique({ where: { slug: projectId } })
    }
  if (!project) {
      console.log('[ADMIN DELETE] Project not found:', projectId)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
    
    console.log('[ADMIN DELETE] Found project:', project.id, project.title)
  
  // Убираем связь из популярных проектов
    try {
      await prisma.popularItem.updateMany({
        where: { projectSlug: project.slug },
        data: { projectSlug: null }
      })
      console.log('[ADMIN DELETE] Updated popular items')
    } catch (popularError: any) {
      console.error('[ADMIN DELETE] Error updating popular items:', popularError)
    }

    // Отключаем проект от избранного и сравнения (FK constraint)
    try {
      await prisma.project.update({
        where: { id: project.id },
        data: {
          favoritedBy: { set: [] },
          comparedBy: { set: [] }
        }
      })
      console.log('[ADMIN DELETE] Disconnected from favorites/compare')
    } catch (relError: any) {
      console.error('[ADMIN DELETE] Error disconnecting relations:', relError)
      // Продолжаем удаление
    }

    await prisma.project.delete({ where: { id: project.id } })
    console.log('[ADMIN DELETE] Project deleted successfully:', project.id)
  
    return NextResponse.json({ ok: true, deletedId: project.id }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
  } catch (error: any) {
    console.error('[ADMIN DELETE] Error:', error)
    console.error('[ADMIN DELETE] Error name:', error?.name)
    console.error('[ADMIN DELETE] Error code:', error?.code)
    console.error('[ADMIN DELETE] Error message:', error?.message)
    console.error('[ADMIN DELETE] Error stack:', error?.stack?.substring(0, 500))
    return NextResponse.json({
      error: 'Failed to delete project',
      details: error instanceof Error ? error.message : String(error),
      type: error?.name || 'Unknown'
    }, { status: 500 })
  }
}
