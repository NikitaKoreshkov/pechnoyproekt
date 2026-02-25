import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugFromTitle } from '@/lib/slug'

function ensureAdmin(session: any) {
  return session?.user && ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!ensureAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const sectionId = searchParams.get('sectionId')
  const subsectionId = searchParams.get('subsectionId')
  const subsubsectionId = searchParams.get('subsubsectionId')

  const where: { subsectionId?: string | { in: string[] }; subsubsectionId?: string | { in: string[] }; OR?: any[] } = {}
  if (subsubsectionId) {
    where.subsubsectionId = subsubsectionId
  } else if (subsectionId) {
    const subsubIds = (await prisma.catalogSubsubsection.findMany({ where: { subsectionId }, select: { id: true } })).map(s => s.id)
    if (subsubIds.length > 0) {
      where.OR = [{ subsectionId }, { subsubsectionId: { in: subsubIds } }]
    } else {
      where.subsectionId = subsectionId
    }
  } else if (sectionId) {
    const subsecIds = (await prisma.catalogSubsection.findMany({ where: { sectionId }, select: { id: true } })).map(s => s.id)
    const subsubIds = subsecIds.length > 0
      ? (await prisma.catalogSubsubsection.findMany({ where: { subsectionId: { in: subsecIds } }, select: { id: true } })).map(s => s.id)
      : []
    const or: any[] = []
    if (subsecIds.length > 0) or.push({ subsectionId: { in: subsecIds } })
    if (subsubIds.length > 0) or.push({ subsubsectionId: { in: subsubIds } })
    if (or.length > 0) where.OR = or
  }

  const projects = await prisma.project.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    orderBy: { createdAt: 'desc' },
    select: { id: true, slug: true, title: true, area: true, material: true, priceFrom: true, image: true }
  })
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
  let baseSlug = rawSlug || (body.title ? slugFromTitle(body.title) : '')
  if (!baseSlug) {
    return NextResponse.json({ error: 'Укажите название или slug проекта', details: 'Slug генерируется из названия автоматически.' }, { status: 400 })
  }
  if (!/^[a-z0-9-]+$/.test(baseSlug)) {
    return NextResponse.json({ error: 'Некорректный slug', details: 'Допустимы только латиница, цифры и дефисы. Укажите slug вручную или измените название.' }, { status: 400 })
  }
  let slug = baseSlug
  let n = 2
  while (await prisma.project.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${baseSlug}-${n}`
    n++
  }
  const id = `proj-${slug}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const now = new Date()
  try {
    const created = await prisma.project.create({ data: {
      id,
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
      technicalSpecs: body.technicalSpecs && String(body.technicalSpecs).trim() ? body.technicalSpecs.trim() : null,
      specs: body.specs || null,
      videoUrl: body.videoUrl && String(body.videoUrl).trim() ? body.videoUrl.trim() : null,
      subsectionId: body.subsectionId && String(body.subsectionId).trim() ? body.subsectionId : null,
      subsubsectionId: body.subsubsectionId && String(body.subsubsectionId).trim() ? body.subsubsectionId : null,
      updatedAt: now
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
