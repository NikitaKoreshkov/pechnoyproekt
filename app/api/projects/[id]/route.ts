import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Общая функция для поиска проекта (используется и в GET, и в HEAD)
async function findProjectById(projectId: string) {
  console.log('[findProjectById] Searching for:', projectId)
  
  // Сначала ищем проект по slug (ID в URL)
  let project = await prisma.project.findUnique({
    where: { slug: projectId }
  })
  console.log('[findProjectById] Found project by slug:', !!project)

  // Проверяем, является ли этот slug популярным проектом (с кастомными данными)
  let popularItem = null
  if (project) {
    // Если проект найден, проверяем есть ли для него кастомные данные в PopularItem
    popularItem = await prisma.popularItem.findFirst({
      where: { projectSlug: projectId }
    })
    console.log('[findProjectById] Found popularItem for project:', !!popularItem)
  }

  // Если не найден, проверяем популярные проекты по slug (для популярных без связи с реальным проектом)
  if (!project) {
    // Проверяем, есть ли префикс popular- для старых ссылок
    if (projectId.startsWith('popular-')) {
      console.log('[findProjectById] Detected popular- prefix')
      const actualId = projectId.replace('popular-', '')
      console.log('[findProjectById] Actual ID:', actualId)
      
      try {
        // Пробуем найти по UUID напрямую
        popularItem = await prisma.popularItem.findUnique({
          where: { id: actualId },
          include: { panel: true }
        })
        console.log('[findProjectById] Found popularItem by UUID:', !!popularItem, popularItem ? `projectSlug: ${popularItem.projectSlug}` : '')
      } catch (dbError: any) {
        console.error('[findProjectById] Database error:', dbError?.message)
        popularItem = null
      }
      
      if (popularItem) {
        console.log('[findProjectById] ✅ Found popularItem by UUID!', popularItem.id, 'title:', popularItem.title)
        // Если есть связь с реальным проектом - проверяем его существование
        if (popularItem.projectSlug) {
          const linkedProject = await prisma.project.findUnique({
            where: { slug: popularItem.projectSlug }
          })
          console.log('[findProjectById] Found linked project:', !!linkedProject)
          if (linkedProject) {
            // Связанный проект найден - возвращаем его
            return { project: linkedProject, popularItem }
          } else {
            // Связь есть, но проект удален - возвращаем PopularItem как standalone
            console.log('[findProjectById] Linked project not found, treating PopularItem as standalone')
            return { project: null, popularItem }
          }
        } else {
          // Нет связи - возвращаем PopularItem как standalone
          console.log('[findProjectById] PopularItem has no projectSlug - standalone popular project')
          return { project: null, popularItem }
        }
      } else {
        console.log('[findProjectById] ❌ PopularItem not found by UUID:', actualId)
      }
    }
    
    // Сначала пробуем найти по slug из БД напрямую
    if (!popularItem) {
      popularItem = await prisma.popularItem.findFirst({
        where: { slug: projectId },
        include: { panel: true }
      })
    }
    // По raw UUID (формат xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    if (!popularItem && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId)) {
      popularItem = await prisma.popularItem.findUnique({
        where: { id: projectId },
        include: { panel: true }
      })
    }
    
    // Если не нашли по slug из БД, пробуем среди ВСЕХ популярных проектов (включая с удаленными связями)
    if (!popularItem) {
      const allPopularItems = await prisma.popularItem.findMany({
        include: { panel: true }
      })
      
      // Генерируем slug для каждого популярного проекта и ищем совпадение
      for (const item of allPopularItems) {
        const generateSlug = (title: string, itemId: string) => {
          const slug = title
            .toLowerCase()
            .replace(/[^a-zа-яё0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 50)
          return `${slug}-${itemId.substring(0, 8)}`
        }
        
        const itemSlug = item.slug || generateSlug(item.title, item.id)
        if (itemSlug === projectId) {
          popularItem = item
          break
        }
      }
    }
    
    // Если популярный проект имеет связь с реальным проектом, проверяем существование
    if (popularItem?.projectSlug) {
      project = await prisma.project.findUnique({
        where: { slug: popularItem.projectSlug }
      })
      // Если связанный проект не найден - возвращаем PopularItem как standalone
      if (!project) {
        console.log('[findProjectById] Linked project not found, treating PopularItem as standalone')
        return { project: null, popularItem }
      }
    }
  }

  return { project, popularItem }
}

// HEAD запрос - только проверка существования проекта
export async function HEAD(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    let resolvedParams
    try {
      resolvedParams = params instanceof Promise ? await params : params
    } catch (paramsError: any) {
      return new NextResponse(null, { status: 400 })
    }
    
    let projectId = resolvedParams?.id
    
    if (!projectId) {
      return new NextResponse(null, { status: 400 })
    }
    
    const { project, popularItem } = await findProjectById(projectId)
    
    // Если проект или популярный проект найден - возвращаем 200
    if (project || popularItem) {
      return new NextResponse(null, { status: 200 })
    }
    
    // Если не найден - возвращаем 404
    return new NextResponse(null, { status: 404 })
  } catch (error: any) {
    console.error('[PROJECT API HEAD] Error:', error)
    return new NextResponse(null, { status: 500 })
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Обработка async params в Next.js 15+
    let resolvedParams
    try {
      resolvedParams = params instanceof Promise ? await params : params
    } catch (paramsError: any) {
      console.error('[PROJECT API] Error resolving params:', paramsError)
      return NextResponse.json({ 
        error: 'Invalid request parameters',
        details: paramsError?.message 
      }, { status: 400 })
    }
    
    let projectId = resolvedParams?.id
    
    if (!projectId) {
      console.error('[PROJECT API GET] No projectId in params!', resolvedParams)
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }
    
    console.log('[PROJECT API GET] Looking for project ID:', projectId)
    console.log('[PROJECT API GET] projectId type:', typeof projectId)
    console.log('[PROJECT API GET] projectId startsWith("popular-"):', projectId.startsWith('popular-'))
    
    // Используем общую функцию поиска
    let project, popularItem
    try {
      const result = await findProjectById(projectId)
      project = result.project
      popularItem = result.popularItem
      console.log('[PROJECT API GET] findProjectById returned:', { hasProject: !!project, hasPopularItem: !!popularItem })
    } catch (findError: any) {
      console.error('[PROJECT API GET] Error in findProjectById:', findError?.message, findError)
      project = null
      popularItem = null
    }
    
    console.log('[PROJECT API GET] Found project:', !!project, 'popularItem:', !!popularItem)
    
    // Если ничего не найдено - возвращаем 404
    if (!project && !popularItem) {
      console.log('[PROJECT API GET] ❌ Project not found, returning 404')
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    console.log('[PROJECT API GET] ✅ Project found, processing...')
    
    // Если найден популярный проект без связи с реальным проектом - возвращаем его данные
    if (popularItem && !project) {
      const generateSlug = (title: string, itemId: string) => {
        const baseSlug = title
          .toLowerCase()
          .replace(/[^a-zа-яё0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .substring(0, 50)
        return `${baseSlug}-${itemId.substring(0, 8)}`
      }
      
      let projectSlug = popularItem.slug || generateSlug(popularItem.title, popularItem.id)
      
      // Сохраняем slug в БД, если его еще нет
      if (!popularItem.slug) {
        try {
          await prisma.popularItem.update({
            where: { id: popularItem.id },
            data: { slug: projectSlug }
          })
          console.log('[PROJECT API GET] Saved slug to DB:', projectSlug)
        } catch (error: any) {
          console.error('[PROJECT API GET] Error saving slug:', error?.message)
        }
      }
      
      // Нормализуем specs
      let specs = {}
      if (popularItem.specs && typeof popularItem.specs === 'object') {
        specs = popularItem.specs
        // Убеждаемся, что completionOptions и additionalOptions - это массивы
        if (specs.completionOptions && !Array.isArray(specs.completionOptions)) {
          console.warn('[PROJECT API GET] Invalid completionOptions, setting to []')
          specs.completionOptions = []
        }
        if (specs.additionalOptions && !Array.isArray(specs.additionalOptions)) {
          console.warn('[PROJECT API GET] Invalid additionalOptions, setting to []')
          specs.additionalOptions = []
        }
      }
      
      return NextResponse.json({
        id: projectSlug,
        title: popularItem.title,
        area: popularItem.area,
        priceFrom: popularItem.priceFrom,
        priceTo: popularItem.priceTo,
        floors: popularItem.floors ?? 1,
        material: popularItem.material,
        buildTime: popularItem.buildTime ?? 30,
        completion: popularItem.completion || 'под ключ',
        region: popularItem.region || '',
        image: popularItem.image,
        images: popularItem.images && popularItem.images.length > 0 ? popularItem.images : [popularItem.image],
        tags: popularItem.tags || [],
        hasTerrasse: popularItem.hasTerrasse ?? false,
        hasBath: popularItem.hasBath ?? false,
        hasGarage: popularItem.hasGarage ?? false,
        features: popularItem.features || [],
        description: popularItem.description || `Популярный проект: ${popularItem.title}`,
        advantages: popularItem.advantages || [],
        technicalSpecs: popularItem.technicalSpecs || null,
        specs,
        videoUrl: popularItem.videoUrl || null
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    }
    
    // Если проект найден (обычный или связанный с популярным) - возвращаем его данные
    if (!project) {
      console.log('[PROJECT API GET] Project is null but popularItem exists, this should not happen')
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Используем напрямую поле image - это главное изображение, установленное в админке
    // Не ищем в массиве images, так как image - это именно то главное фото, которое выбрал пользователь
    
    // Нормализуем specs из популярного или основного проекта
    let specs = {}
    const rawSpecs = popularItem?.specs || project.specs
    if (rawSpecs && typeof rawSpecs === 'object') {
      specs = rawSpecs
      // Убеждаемся, что completionOptions и additionalOptions - это массивы
      if (specs.completionOptions && !Array.isArray(specs.completionOptions)) {
        console.warn('[PROJECT API GET] Invalid completionOptions, setting to []')
        specs.completionOptions = []
      }
      if (specs.additionalOptions && !Array.isArray(specs.additionalOptions)) {
        console.warn('[PROJECT API GET] Invalid additionalOptions, setting to []')
        specs.additionalOptions = []
      }
    }
    
    // Если есть кастомные данные из PopularItem - используем их (если заполнены), недостающие - из основного проекта
    const projectData = {
      id: project.slug,
      title: popularItem?.title || project.title,
      area: popularItem?.area || project.area,
      priceFrom: popularItem?.priceFrom || project.priceFrom,
      priceTo: popularItem?.priceTo ?? project.priceTo,
      floors: popularItem?.floors ?? project.floors,
      material: popularItem?.material || project.material,
      buildTime: popularItem?.buildTime ?? project.buildTime,
      completion: popularItem?.completion || project.completion,
      region: popularItem?.region || project.region,
      // Используем главное изображение: если есть кастомное в PopularItem - берем его, иначе берем главное из Project
      image: popularItem?.image || project.image || '/images/1.png',
      images: (popularItem?.images && popularItem.images.length > 0) ? popularItem.images : project.images,
      tags: popularItem?.tags || project.tags,
      hasTerrasse: popularItem?.hasTerrasse ?? project.hasTerrasse,
      hasBath: popularItem?.hasBath ?? project.hasBath,
      hasGarage: popularItem?.hasGarage ?? project.hasGarage,
      features: popularItem?.features || project.features,
      description: popularItem?.description || project.description,
      advantages: popularItem?.advantages || project.advantages,
      technicalSpecs: popularItem?.technicalSpecs || project.technicalSpecs || null,
      specs,
      variationGroupId: project.variationGroupId || null,
      videoUrl: popularItem?.videoUrl ?? project.videoUrl ?? null
    }

    console.log('[PROJECT API GET] Returning project data:', {
      id: projectData.id,
      title: projectData.title,
      hasCustomData: !!popularItem
    })

    // Проверяем наличие обязательных полей
    if (!projectData.id || !projectData.title) {
      console.error('[PROJECT API GET] Invalid project data:', projectData)
      return NextResponse.json({ 
        error: 'Invalid project data',
        details: 'Project data is incomplete'
      }, { status: 500 })
    }

    return NextResponse.json(projectData, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error: any) {
    console.error('[PROJECT API GET] Error loading project:', error)
    console.error('[PROJECT API GET] Error stack:', error?.stack?.substring(0, 500))
    
    return NextResponse.json({ 
      error: 'Failed to load project',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
