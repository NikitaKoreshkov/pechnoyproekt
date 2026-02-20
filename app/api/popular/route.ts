import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    let panels = await prisma.popularPanel.findMany({
      orderBy: { order: 'asc' },
      include: { items: { orderBy: { order: 'asc' } } }
    })
    
    // Фильтруем популярные проекты: возвращаем те, которые имеют достаточно данных для отображения
    const filteredPanels = await Promise.all(
      panels.map(async (panel) => {
        try {
          const validItems = await Promise.all(
            panel.items.map(async (item) => {
              try {
                // Если есть связь с реальным проектом - проверяем его существование
                if (item.projectSlug) {
                  const projectExists = await prisma.project.findUnique({
                    where: { slug: item.projectSlug },
                    select: { id: true }
                  })
                  // Если связанный проект удален - проверяем, достаточно ли данных в самом PopularItem
                  if (!projectExists) {
                    // Если у PopularItem достаточно данных для отображения - возвращаем его
                    if (item.title && item.area && item.priceFrom) {
                      console.log(`[API Popular] Returning item ${item.id} with custom data (linked project ${item.projectSlug} deleted)`)
                      return item
                    }
                    console.log(`[API Popular] Skipping item ${item.id}: linked project ${item.projectSlug} does not exist and insufficient data`)
                    return null
                  }
                  // Проект существует - возвращаем элемент
                  return item
                }
                // Если нет связи (projectSlug === null) - проверяем, достаточно ли данных для отображения
                // Если есть минимальные данные - возвращаем элемент для каталога
                if (item.title && item.area && item.priceFrom) {
                  console.log(`[API Popular] Returning item ${item.id} without projectSlug (has sufficient data)`)
                  return item
                }
                console.log(`[API Popular] Skipping item ${item.id}: no projectSlug and insufficient data`)
                return null
              } catch (itemError) {
                console.error(`Error checking item ${item.id}:`, itemError)
                // В случае ошибки - возвращаем null, чтобы не показывать битый элемент
                return null
              }
            })
          )
          
          return {
            ...panel,
            items: validItems.filter((item): item is NonNullable<typeof item> => item !== null)
          }
        } catch (panelError) {
          console.error(`Error processing panel ${panel.id}:`, panelError)
          // В случае ошибки панели - возвращаем пустую панель
          return {
            ...panel,
            items: []
          }
        }
      })
    )
    
    // Логируем количество элементов для отладки
    const totalItems = filteredPanels.reduce((sum, panel) => sum + panel.items.length, 0)
    console.log(`[API Popular] Total items returned: ${totalItems}, panels: ${filteredPanels.length}`)
    
    // Если панелей нет, возвращаем пустой массив (инициализация только в админке)
    return NextResponse.json(filteredPanels, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error: any) {
    console.error('Error in GET /api/popular:', error)
    return NextResponse.json([])
  }
}

