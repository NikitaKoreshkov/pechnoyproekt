import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function ensureAdmin(session: unknown) {
  return (session as { user?: { role?: string } })?.user && ['ADMIN', 'SUPER_ADMIN'].includes((session as { user: { role?: string } }).user.role || '')
}

const MAX_POPULAR = 6

/** Добавить проект в популярные */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!ensureAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const projectSlug = typeof body.projectSlug === 'string' ? body.projectSlug.trim() : ''
    if (!projectSlug) {
      return NextResponse.json({ error: 'Укажите projectSlug' }, { status: 400 })
    }

    const project = await prisma.project.findUnique({
      where: { slug: projectSlug }
    })
    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 })
    }

    const existing = await prisma.popularItem.findFirst({
      where: { projectSlug }
    })
    if (existing) {
      return NextResponse.json({ error: 'Проект уже в популярных' }, { status: 400 })
    }

    const totalPopular = await prisma.popularItem.count()
    if (totalPopular >= MAX_POPULAR) {
      return NextResponse.json({ error: `Максимум ${MAX_POPULAR} популярных товаров. Сейчас: ${totalPopular}.` }, { status: 400 })
    }

    const panels = await prisma.popularPanel.findMany({ orderBy: { order: 'asc' }, include: { items: { orderBy: { order: 'asc' } } } })
    const panel = panels[0]
    if (!panel) {
      const newPanel = await prisma.popularPanel.create({
        data: {
          id: `panel-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          title: 'Популярные проекты',
          order: 0,
          updatedAt: new Date()
        }
      })
      const maxOrder = 0
      const itemId = `popular-${projectSlug}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      const now = new Date()
      await prisma.popularItem.create({
        data: {
          id: itemId,
          panelId: newPanel.id,
          title: project.title,
          area: project.area,
          priceFrom: project.priceFrom,
          priceTo: project.priceTo,
          floors: project.floors ?? 1,
          material: project.material || 'кирпич',
          buildTime: project.buildTime ?? 14,
          completion: project.completion || 'под ключ',
          region: project.region || 'Москва',
          image: project.image || '/images/1.png',
          images: project.images || [],
          tags: project.tags || [],
          hasTerrasse: project.hasTerrasse ?? false,
          hasBath: project.hasBath ?? false,
          hasGarage: project.hasGarage ?? false,
          features: project.features || [],
          description: project.description,
          advantages: project.advantages || [],
          technicalSpecs: project.technicalSpecs,
          specs: project.specs,
          filterValues: project.filterValues,
          order: maxOrder,
          slug: projectSlug,
          projectSlug,
          subsectionId: project.subsectionId,
          subsubsectionId: project.subsubsectionId,
          updatedAt: now
        }
      })
      return NextResponse.json({ ok: true, message: 'Добавлено в популярные' })
    }

    const maxOrder = panel.items.length > 0
      ? Math.max(...panel.items.map((i) => i.order)) + 1
      : 0
    const itemId = `popular-${projectSlug}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const now = new Date()
    await prisma.popularItem.create({
      data: {
        id: itemId,
        panelId: panel.id,
        title: project.title,
        area: project.area,
        priceFrom: project.priceFrom,
        priceTo: project.priceTo,
        floors: project.floors ?? 1,
        material: project.material || 'кирпич',
        buildTime: project.buildTime ?? 14,
        completion: project.completion || 'под ключ',
        region: project.region || 'Москва',
        image: project.image || '/images/1.png',
        images: project.images || [],
        tags: project.tags || [],
        hasTerrasse: project.hasTerrasse ?? false,
        hasBath: project.hasBath ?? false,
        hasGarage: project.hasGarage ?? false,
        features: project.features || [],
        description: project.description,
        advantages: project.advantages || [],
        technicalSpecs: project.technicalSpecs,
        specs: project.specs,
        filterValues: project.filterValues,
        order: maxOrder,
        slug: projectSlug,
        projectSlug,
        subsectionId: project.subsectionId,
        subsubsectionId: project.subsubsectionId,
        updatedAt: now
      }
    })
    return NextResponse.json({ ok: true, message: 'Добавлено в популярные' })
  } catch (e: unknown) {
    console.error('[ADMIN POPULAR ADD] Error:', e)
    return NextResponse.json({ error: 'Ошибка добавления' }, { status: 500 })
  }
}
