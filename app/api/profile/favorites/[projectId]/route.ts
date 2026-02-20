import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req, { params }: { params: Promise<{ projectId: string }> | { projectId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }
  const resolvedParams = params instanceof Promise ? await params : params
  let projectId = resolvedParams.projectId;
  
  if (!projectId) {
    console.error('[FAVORITES POST] No projectId in params:', resolvedParams)
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
  }
  
  // Декодируем URL-encoded параметр (Next.js обычно декодирует автоматически, но на всякий случай)
  // Пробуем декодировать дважды, если есть двойное кодирование
  try {
    let decoded = decodeURIComponent(projectId)
    // Если после первого декодирования все еще есть закодированные символы, декодируем еще раз
    if (decoded.includes('%')) {
      decoded = decodeURIComponent(decoded)
    }
    projectId = decoded
  } catch (e) {
    // Если декодирование не удалось, используем исходное значение
    console.warn('[FAVORITES POST] Failed to decode projectId, using as-is:', projectId)
  }
  
  console.log('[FAVORITES POST] Adding favorite for projectId:', projectId)
  
  try {
    // Ищем проект по slug (как в API projects/[id])
    let project = await prisma.project.findUnique({
      where: { slug: projectId }
    })
    
    let finalProjectSlug = projectId
    
    // Если проект не найден, проверяем PopularItem
    if (!project) {
      // Функция для генерации slug (как в ProjectsCatalog)
      const generateSlug = (title: string, itemId: string) => {
        const baseSlug = title
          .toLowerCase()
          .replace(/[^a-zа-яё0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .substring(0, 50)
        return `${baseSlug}-${itemId.substring(0, 8)}`
      }
      
      // Ищем PopularItem по slug или projectSlug
      let popularItem = await prisma.popularItem.findFirst({
        where: { 
          OR: [
            { slug: projectId },
            { projectSlug: projectId }
          ]
        }
      })
      
      // Если не нашли по slug, проверяем все PopularItem и сравниваем сгенерированные slug
      if (!popularItem) {
        const allPopularItems = await prisma.popularItem.findMany()
        for (const item of allPopularItems) {
          const itemSlug = item.slug || generateSlug(item.title, item.id)
          if (itemSlug === projectId) {
            popularItem = item
            break
          }
        }
      }
      
      // Если найден PopularItem с projectSlug, используем его для связи
      if (popularItem?.projectSlug) {
        console.log('[FAVORITES POST] Found PopularItem with projectSlug:', popularItem.projectSlug)
        project = await prisma.project.findUnique({
          where: { slug: popularItem.projectSlug }
        })
        
        if (project) {
          // Используем slug реального проекта для связи
          finalProjectSlug = project.slug
          console.log('[FAVORITES POST] Using linked project slug:', finalProjectSlug)
        } else {
          console.error('[FAVORITES POST] Project not found with slug:', projectId, 'or via PopularItem projectSlug:', popularItem.projectSlug)
          return NextResponse.json({ error: 'Товар не найден' }, { status: 404 })
        }
      } else if (popularItem) {
        // PopularItem найден, но без projectSlug - это standalone популярный товар
        // Создаем временный проект для такого товара, используя его slug
        console.log('[FAVORITES POST] PopularItem found without projectSlug, creating temporary project:', projectId)
        
        // Используем slug популярного товара как slug проекта
        finalProjectSlug = projectId
        
        // Проверяем, существует ли уже проект с таким slug
        project = await prisma.project.findUnique({
          where: { slug: finalProjectSlug }
        })
        
        // Если проекта нет - создаем его на основе данных PopularItem
        if (!project) {
          try {
            project = await prisma.project.create({
              data: {
                slug: finalProjectSlug,
                title: popularItem.title,
                area: popularItem.area,
                priceFrom: popularItem.priceFrom,
                priceTo: popularItem.priceTo,
                floors: popularItem.floors ?? 1,
                material: popularItem.material || 'ПНД',
                buildTime: popularItem.buildTime ?? 100,
                completion: popularItem.completion || 'под ключ',
                region: popularItem.region || 'Москва',
                image: popularItem.image || '/images/1.png',
                images: popularItem.images || [],
                tags: popularItem.tags || [],
                hasTerrasse: popularItem.hasTerrasse ?? false,
                hasBath: popularItem.hasBath ?? false,
                hasGarage: popularItem.hasGarage ?? false,
                features: popularItem.features || [],
                description: popularItem.description,
                advantages: popularItem.advantages || [],
                technicalSpecs: popularItem.technicalSpecs,
                specs: popularItem.specs || {}
              }
            })
            console.log('[FAVORITES POST] Created temporary project for PopularItem:', finalProjectSlug)
          } catch (createError: any) {
            console.error('[FAVORITES POST] Error creating project for PopularItem:', createError.message)
            // Если не удалось создать (например, slug уже занят), возвращаем ошибку
            return NextResponse.json({ error: 'Не удалось добавить товар в избранное' }, { status: 500 })
          }
        }
      } else {
        console.error('[FAVORITES POST] Project not found with slug:', projectId)
        console.error('[FAVORITES POST] Searched in Project and PopularItem, no matches found')
        return NextResponse.json({ error: 'Товар не найден' }, { status: 404 })
      }
    }
    
    if (!project) {
      console.error('[FAVORITES POST] Project not found with slug:', finalProjectSlug)
      return NextResponse.json({ error: 'Товар не найден' }, { status: 404 })
    }
    
    await prisma.user.update({
      where: { email: session.user.email },
      data: { favorites: { connect: { slug: finalProjectSlug } } }
    })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[FAVORITES POST] Error:', e.message)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}

export async function DELETE(req, { params }: { params: Promise<{ projectId: string }> | { projectId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }
  const resolvedParams = params instanceof Promise ? await params : params
  let projectId = resolvedParams.projectId;
  
  if (!projectId) {
    console.error('[FAVORITES DELETE] No projectId in params:', resolvedParams)
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
  }
  
  // Декодируем URL-encoded параметр (Next.js обычно декодирует автоматически, но на всякий случай)
  // Пробуем декодировать дважды, если есть двойное кодирование
  try {
    let decoded = decodeURIComponent(projectId)
    // Если после первого декодирования все еще есть закодированные символы, декодируем еще раз
    if (decoded.includes('%')) {
      decoded = decodeURIComponent(decoded)
    }
    projectId = decoded
  } catch (e) {
    // Если декодирование не удалось, используем исходное значение
    console.warn('[FAVORITES DELETE] Failed to decode projectId, using as-is:', projectId)
  }
  
  console.log('[FAVORITES DELETE] Removing favorite for projectId:', projectId)
  
  try {
    // Ищем проект по slug (как в API projects/[id])
    let project = await prisma.project.findUnique({
      where: { slug: projectId }
    })
    
    let finalProjectSlug = projectId
    
    // Если проект не найден, проверяем PopularItem
    if (!project) {
      // Функция для генерации slug (как в ProjectsCatalog)
      const generateSlug = (title: string, itemId: string) => {
        const baseSlug = title
          .toLowerCase()
          .replace(/[^a-zа-яё0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .substring(0, 50)
        return `${baseSlug}-${itemId.substring(0, 8)}`
      }
      
      // Ищем PopularItem по slug или projectSlug
      let popularItem = await prisma.popularItem.findFirst({
        where: { 
          OR: [
            { slug: projectId },
            { projectSlug: projectId }
          ]
        }
      })
      
      // Если не нашли по slug, проверяем все PopularItem и сравниваем сгенерированные slug
      if (!popularItem) {
        const allPopularItems = await prisma.popularItem.findMany()
        for (const item of allPopularItems) {
          const itemSlug = item.slug || generateSlug(item.title, item.id)
          if (itemSlug === projectId) {
            popularItem = item
            break
          }
        }
      }
      
      // Если найден PopularItem с projectSlug, используем его для связи
      if (popularItem?.projectSlug) {
        project = await prisma.project.findUnique({
          where: { slug: popularItem.projectSlug }
        })
        
        if (project) {
          // Используем slug реального проекта для связи
          finalProjectSlug = project.slug
        } else {
          console.error('[FAVORITES DELETE] Project not found with slug:', projectId, 'or via PopularItem projectSlug:', popularItem.projectSlug)
          return NextResponse.json({ error: 'Товар не найден' }, { status: 404 })
        }
      } else if (popularItem) {
        // PopularItem найден, но без projectSlug - это standalone популярный товар
        // Используем slug популярного товара как slug проекта
        console.log('[FAVORITES DELETE] PopularItem found without projectSlug, using slug:', projectId)
        finalProjectSlug = projectId
        
        // Проверяем, существует ли проект с таким slug (возможно, был создан при добавлении в избранное)
        project = await prisma.project.findUnique({
          where: { slug: finalProjectSlug }
        })
        
        if (!project) {
          console.error('[FAVORITES DELETE] Project not found for PopularItem without projectSlug:', projectId)
          return NextResponse.json({ error: 'Товар не найден в избранном' }, { status: 404 })
        }
      } else {
        console.error('[FAVORITES DELETE] Project not found with slug:', projectId)
        return NextResponse.json({ error: 'Товар не найден' }, { status: 404 })
      }
    }
    
    if (!project) {
      console.error('[FAVORITES DELETE] Project not found with slug:', finalProjectSlug)
      return NextResponse.json({ error: 'Товар не найден' }, { status: 404 })
    }
    
    await prisma.user.update({
      where: { email: session.user.email },
      data: { favorites: { disconnect: { slug: finalProjectSlug } } }
    })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[FAVORITES DELETE] Error:', e.message)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}

export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }
  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { 
        favorites: { 
          select: { 
            id: true, 
            slug: true, 
            title: true, 
            image: true, 
            images: true,
            priceFrom: true,
            priceTo: true,
            area: true,
            material: true
          } 
        } 
      }
    })
    
    // Обновляем данные в избранных проектах: используем кастомные из PopularItem если есть
    // Также фильтруем удаленные проекты
    const favoritesWithUpdatedData = await Promise.all(
      (user?.favorites || []).map(async (project: any) => {
        // Проверяем, существует ли проект в базе (может быть удален)
        const existingProject = await prisma.project.findUnique({
          where: { slug: project.slug },
          select: { id: true, slug: true }
        })
        
        // Если проект удален - не возвращаем его
        if (!existingProject) {
          console.log(`[FAVORITES] Project ${project.slug} was deleted, skipping`)
          return null
        }
        
        // Проверяем, есть ли для этого проекта кастомные данные в PopularItem
        const popularItem = await prisma.popularItem.findFirst({
          where: { projectSlug: project.slug }
        })
        
        // Используем напрямую поле image - это главное изображение, установленное в админке
        // Не ищем в массиве images, так как image - это именно то главное фото, которое выбрал пользователь
        
        // Если есть кастомные данные из PopularItem - используем их
        if (popularItem) {
          return {
            ...project,
            id: project.slug,
            title: popularItem.title || project.title, // Кастомное название
            image: popularItem.image || project.image, // Кастомное изображение или главное из проекта
            priceFrom: popularItem.priceFrom || project.priceFrom, // Кастомная цена
            priceTo: popularItem.priceTo ?? project.priceTo, // Кастомная цена
            material: popularItem.material || project.material // Кастомный материал
          }
        }
        
        // Если нет кастомных данных - используем главное изображение из проекта
        return {
          ...project,
          id: project.slug,
          image: project.image // Используем главное изображение напрямую
        }
      })
    )
    
    // Удаляем null (удаленные проекты) из массива
    const validFavorites = favoritesWithUpdatedData.filter((p): p is NonNullable<typeof p> => p !== null)
    
    return NextResponse.json({ favorites: validFavorites }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (e) {
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}
