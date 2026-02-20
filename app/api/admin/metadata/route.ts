import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function ensureAdmin(session: any) {
  return session?.user && ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')
}

export async function GET() {
  try {
    let config = await prisma.siteMetadataConfig.findFirst()
    
    if (!config) {
      config = await prisma.siteMetadataConfig.create({
        data: {
          faviconUrl: null,
          appleTouchIcon: null,
          siteTitle: 'Трубы ПНД и комплектующие | АкваГазТех',
          siteDescription: 'Поставка качественных труб ПНД (ПЭ) и комплектующих для водопровода, канализации и газопровода. Широкий ассортимент, быстрая доставка, гарантия качества.',
          siteKeywords: 'трубы ПНД, трубы ПЭ, комплектующие для труб, водопровод, канализация, газопровод, фитинги, Москва, Россия',
          ogImage: '/images/1.png'
        }
      })
    } else {
      // Автоисправление старых данных с Алматы или karkasdom.kz
      const needsUpdate = 
        config.siteDescription?.includes('Алмат') ||
        config.siteDescription?.includes('950 000') ||
        config.siteDescription?.includes('₸') ||
        config.siteKeywords?.includes('Алмат') ||
        config.siteKeywords?.includes('Казахстан') ||
        config.siteTitle?.includes('karkasdom.kz')
      
      if (needsUpdate) {
        config = await prisma.siteMetadataConfig.update({
          where: { id: config.id },
          data: {
            siteTitle: config.siteTitle?.includes('karkasdom.kz') 
              ? 'Трубы ПНД и комплектующие | АкваГазТех'
              : config.siteTitle,
            siteDescription: config.siteDescription?.includes('Алмат') || config.siteDescription?.includes('₸')
              ? 'Поставка качественных труб ПНД (ПЭ) и комплектующих для водопровода, канализации и газопровода. Широкий ассортимент, быстрая доставка, гарантия качества.'
              : config.siteDescription,
            siteKeywords: config.siteKeywords?.includes('Алмат') || config.siteKeywords?.includes('Казахстан')
              ? 'трубы ПНД, трубы ПЭ, комплектующие для труб, водопровод, канализация, газопровод, фитинги, Москва, Россия'
              : config.siteKeywords
          }
        })
      }
    }
    
    return NextResponse.json(config)
  } catch (error: any) {
    console.error('[ADMIN METADATA] GET Error:', error)
    return NextResponse.json({ error: 'Ошибка загрузки конфигурации' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  console.log('[ADMIN METADATA] POST - Session:', !!session, session?.user?.email, session?.user?.role)
  if (!ensureAdmin(session)) {
    console.log('[ADMIN METADATA] POST - Unauthorized')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    console.log('[ADMIN METADATA] POST - Body:', body)
    const {
      faviconUrl,
      appleTouchIcon,
      siteTitle,
      siteDescription,
      siteKeywords,
      ogImage
    } = body

    const existingConfig = await prisma.siteMetadataConfig.findFirst()
    console.log('[ADMIN METADATA] POST - Existing config:', !!existingConfig)
    
    const config = existingConfig
      ? await prisma.siteMetadataConfig.update({
          where: { id: existingConfig.id },
          data: {
            faviconUrl: faviconUrl || null,
            appleTouchIcon: appleTouchIcon || null,
            siteTitle,
            siteDescription,
            siteKeywords,
            ogImage
          }
        })
      : await prisma.siteMetadataConfig.create({
          data: {
            faviconUrl: faviconUrl || null,
            appleTouchIcon: appleTouchIcon || null,
            siteTitle,
            siteDescription,
            siteKeywords,
            ogImage
          }
        })

    console.log('[ADMIN METADATA] POST - Saved config:', config.id)
    return NextResponse.json(config)
  } catch (error: any) {
    console.error('[ADMIN METADATA] POST Error:', error)
    return NextResponse.json({ error: 'Ошибка сохранения конфигурации' }, { status: 500 })
  }
}

