import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Отключаем кеширование для этого API
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'
export const fetchCache = 'force-no-store'

export async function GET() {
  try {
    const config = await prisma.catalogSeoTextConfig.findFirst()
    
    // Если конфига нет, возвращаем дефолтные значения
    if (!config) {
      return NextResponse.json({
        title: 'Каталог продукции и услуг',
        content: `В каталоге представлены печные комплексы, мангалы, барбекю, камины и банные печи — готовые проекты и индивидуальные решения. Выбирайте из сотен реализованных конструкций или закажите расчёт под ваш участок и бюджет.

Мы проектируем и изготавливаем конструкции любой сложности: от компактного уличного мангала до полноценного печного комплекса с зоной отдыха. Русские печи, каминопечи, барбекю-зоны — каждый проект выполняется с учётом ваших пожеланий и особенностей дома или участка.

Качественные материалы, соблюдение сроков, гарантия на все конструкции. Консультация специалиста и подбор проекта — бесплатно.`,
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    }
    
    return NextResponse.json({
      title: config.title,
      content: config.content
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('[Catalog SEO Text API] Error fetching config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch catalog SEO text config' },
      { status: 500 }
    )
  }
}

