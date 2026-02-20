import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugFromTitle } from '@/lib/slug'

function ensureAdmin(session: any) {
  return session?.user && ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!ensureAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const projects = await prisma.project.findMany({ orderBy: { createdAt: 'desc' }, select: { id: true, slug: true, title: true, area: true, material: true, priceFrom: true, image: true } })
  return NextResponse.json(projects, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!ensureAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const rawSlug = (typeof body.slug === 'string' && body.slug.trim()) ? body.slug.trim() : ''
  const slug = rawSlug || (body.title ? slugFromTitle(body.title) : '')
  if (!slug) {
    return NextResponse.json({ error: 'Укажите название или slug проекта', details: 'Slug генерируется из названия автоматически.' }, { status: 400 })
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: 'Некорректный slug', details: 'Допустимы только латиница, цифры и дефисы. Укажите slug вручную или измените название.' }, { status: 400 })
  }
  try {
    const created = await prisma.project.create({ data: {
      slug,
      title: body.title,
      area: Number(body.area) || 50,
      priceFrom: Number(body.priceFrom) || 0,
      priceTo: null,
      floors: 1,
      material: body.material || 'каркасный',
      buildTime: Number(body.buildTime) || 30,
      completion: body.completion || 'под ключ',
      region: 'Москва',
      image: body.image || '/images/1.png',
      images: Array.isArray(body.images) ? body.images : [],
      tags: Array.isArray(body.tags) ? body.tags : [],
      hasTerrasse: !!body.hasTerrasse,
      hasBath: !!body.hasBath,
      hasGarage: !!body.hasGarage,
      features: Array.isArray(body.features) ? body.features : [],
      description: body.description || null,
      advantages: Array.isArray(body.advantages) ? body.advantages : [],
      specs: body.specs || null,
      subsectionId: body.subsectionId && String(body.subsectionId).trim() ? body.subsectionId : null,
      subsubsectionId: body.subsubsectionId && String(body.subsubsectionId).trim() ? body.subsubsectionId : null
    } })
    return NextResponse.json(created, { 
      status: 201,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (e: any) {
    console.error('Error creating project:', e)
    // Проверяем ошибку уникальности slug
    if (e?.code === 'P2002' && e?.meta?.target?.includes('slug')) {
      return NextResponse.json({ 
        error: 'Проект с таким slug уже существует', 
        details: 'Slug должен быть уникальным. Выберите другой slug.' 
      }, { status: 400 })
    }
    return NextResponse.json({ 
      error: 'Ошибка создания проекта', 
      details: e?.message || 'Неизвестная ошибка' 
    }, { status: 400 })
  }
}
