import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugFromTitle } from '@/lib/slug'

function ensureAdmin(session: unknown) {
  return (session as { user?: { role?: string } })?.user && ['ADMIN', 'SUPER_ADMIN'].includes((session as { user: { role?: string } }).user.role || '')
}

/** Список разделов с подразделами */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!ensureAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const sections = await prisma.catalogSection.findMany({
      orderBy: { order: 'asc' },
      include: { subsections: { orderBy: { order: 'asc' }, include: { subsubsections: { orderBy: { order: 'asc' } } } } }
    })
    return NextResponse.json(sections)
  } catch (error) {
    console.error('[ADMIN CATALOG SECTIONS] GET error:', error)
    return NextResponse.json({ error: 'Ошибка загрузки' }, { status: 500 })
  }
}

/** Создать раздел */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!ensureAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const title = String(body.title || '').trim()
    if (!title) return NextResponse.json({ error: 'Укажите название раздела' }, { status: 400 })

    const slug = (body.slug && String(body.slug).trim()) || slugFromTitle(title)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ error: 'Slug: только латиница, цифры и дефисы' }, { status: 400 })
    }

    const maxOrder = await prisma.catalogSection.aggregate({ _max: { order: true } })
    const order = (maxOrder._max.order ?? -1) + 1

    const section = await prisma.catalogSection.create({
      data: { title, slug, order }
    })
    return NextResponse.json(section, { status: 201 })
  } catch (error: unknown) {
    const e = error as { code?: string; meta?: { target?: string[] } }
    if (e?.code === 'P2002' && e?.meta?.target?.includes('slug')) {
      return NextResponse.json({ error: 'Раздел с таким slug уже существует' }, { status: 400 })
    }
    console.error('[ADMIN CATALOG SECTIONS] POST error:', error)
    return NextResponse.json({ error: 'Ошибка создания' }, { status: 500 })
  }
}
