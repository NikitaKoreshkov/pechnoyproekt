import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Проверяем, что модель Project существует
    if (!prisma.project) {
      console.error('Prisma project model is not available')
      return NextResponse.json({ 
        error: 'Database model not initialized',
        details: 'Project model not found in Prisma Client'
      }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const subsectionId = searchParams.get('subsectionId')
    const subsubsectionId = searchParams.get('subsubsectionId')
    const sectionId = searchParams.get('sectionId')
    const variationGroupId = searchParams.get('variationGroup')

    // Фильтр по подразделу подраздела, подразделу или разделу каталога
    const where: { subsectionId?: string | { in: string[] }; subsubsectionId?: string | { in: string[] }; variationGroupId?: string; OR?: any[] } = {}
    if (subsubsectionId) {
      where.subsubsectionId = subsubsectionId
    } else if (subsectionId) {
      // Подраздел: проекты в подразделе или в подразделах подраздела
      const subsubIds = (await prisma.catalogSubsubsection.findMany({ where: { subsectionId }, select: { id: true } })).map(s => s.id)
      if (subsubIds.length > 0) {
        where.OR = [
          { subsectionId },
          { subsubsectionId: { in: subsubIds } }
        ]
      } else {
        where.subsectionId = subsectionId
      }
    } else if (sectionId) {
      const subsections = await prisma.catalogSubsection.findMany({
        where: { sectionId },
        select: { id: true }
      })
      const subsecIds = subsections.map(s => s.id)
      const subsubIds = (await prisma.catalogSubsubsection.findMany({
        where: { subsectionId: { in: subsecIds } },
        select: { id: true }
      })).map(s => s.id)
      if (subsecIds.length > 0 || subsubIds.length > 0) {
        const or: any[] = []
        if (subsecIds.length > 0) or.push({ subsectionId: { in: subsecIds } })
        if (subsubIds.length > 0) or.push({ subsubsectionId: { in: subsubIds } })
        where.OR = or
      } else {
        return NextResponse.json([], { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate', 'Pragma': 'no-cache', 'Expires': '0' } })
      }
    }
    if (variationGroupId) {
      where.variationGroupId = variationGroupId
    }

    // Загружаем проекты из базы данных
    const projectsData = await prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    // При фильтре по разделу/подразделу/подразделу подраздела — загружаем PopularItems
    let popularItems: any[] = []
    if (subsubsectionId) {
      popularItems = await prisma.popularItem.findMany({
        where: { subsubsectionId },
        orderBy: { order: 'asc' },
        include: { panel: true }
      })
    } else if (subsectionId) {
      const subsubIds = (await prisma.catalogSubsubsection.findMany({ where: { subsectionId }, select: { id: true } })).map(s => s.id)
      popularItems = await prisma.popularItem.findMany({
        where: subsubIds.length > 0
          ? { OR: [{ subsectionId }, { subsubsectionId: { in: subsubIds } }] }
          : { subsectionId },
        orderBy: { order: 'asc' },
        include: { panel: true }
      })
    } else if (sectionId) {
      const subsectionIds = (await prisma.catalogSubsection.findMany({ where: { sectionId }, select: { id: true } })).map(s => s.id)
      const subsubIds = (await prisma.catalogSubsubsection.findMany({
        where: { subsectionId: { in: subsectionIds } },
        select: { id: true }
      })).map(s => s.id)
      const or: any[] = []
      if (subsectionIds.length > 0) or.push({ subsectionId: { in: subsectionIds } })
      if (subsubIds.length > 0) or.push({ subsubsectionId: { in: subsubIds } })
      if (or.length > 0) {
        popularItems = await prisma.popularItem.findMany({
          where: { OR: or },
          orderBy: { order: 'asc' },
          include: { panel: true }
        })
      }
    }

    console.log('Projects loaded from DB:', projectsData.length)
    console.log('Popular items (filtered):', popularItems.length)

    // Преобразуем проекты из Project
    const projectsFromDb = projectsData.map(({ 
      slug,
      title, 
      area, 
      priceFrom, 
      priceTo, 
      floors, 
      material, 
      buildTime, 
      completion, 
      region, 
      image,
      images,
      tags,
      hasTerrasse,
      hasBath,
      hasGarage,
      features,
      filterValues,
      specs,
      subsectionId,
      subsubsectionId,
      description,
      technicalSpecs,
      advantages,
    }) => {
      // Используем напрямую поле image - это главное изображение, установленное в админке
      // Не ищем в массиве images, так как image - это именно то главное фото, которое выбрал пользователь
      
      return {
        id: slug,
        slug,
        title,
        area,
        priceFrom,
        priceTo,
        floors,
        material,
        buildTime,
        completion,
        region,
        image,
        images: images || [],
        tags,
        hasTerrasse,
        hasBath,
        hasGarage,
        features,
        filterValues: filterValues || null,
        specs: specs || null,
        subsectionId: subsectionId || null,
        subsubsectionId: subsubsectionId || null,
        description: description || null,
        technicalSpecs: technicalSpecs || null,
        advantages: advantages || [],
      }
    })
    
    console.log('[API PROJECTS] Projects with filterValues:', projectsFromDb.filter(p => p.filterValues && Object.keys(p.filterValues).length > 0).length)

    // Преобразуем популярные в формат проекта (id для ссылки: projectSlug > slug > popular-uuid)
    const popularProjects = popularItems.map((item) => {
      const linkId = item.projectSlug || item.slug || `popular-${item.id}`
      return {
        id: linkId,
        slug: linkId,
        title: item.title,
        area: item.area,
        priceFrom: item.priceFrom,
        priceTo: item.priceTo || null,
        floors: item.floors ?? 1,
        material: item.material,
        buildTime: item.buildTime ?? 30,
        completion: item.completion || 'под ключ',
        region: item.region || '',
        image: item.image,
        images: item.images || [],
        tags: item.tags || [],
        hasTerrasse: item.hasTerrasse ?? false,
        hasBath: item.hasBath ?? false,
        hasGarage: item.hasGarage ?? false,
        features: item.features || [],
        filterValues: item.filterValues || null,
        specs: item.specs || null
      }
    })

    // Объединяем проекты: сначала обычные, потом популярные
    const allProjects = [...projectsFromDb, ...popularProjects]

    return NextResponse.json(allProjects, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Error loading projects:', error)
    return NextResponse.json({ 
      error: 'Failed to load projects',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
