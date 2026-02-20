import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugFromTitle } from '@/lib/slug'

function ensureAdmin(session: unknown) {
  return (session as { user?: { role?: string } })?.user && ['ADMIN', 'SUPER_ADMIN'].includes((session as { user: { role?: string } }).user.role || '')
}

/** Создать подраздел подраздела (третий уровень) */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!ensureAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const subsectionId = body.subsectionId
    const title = String(body.title || '').trim()

    if (!subsectionId) return NextResponse.json({ error: 'Укажите подраздел (subsectionId)' }, { status: 400 })
    if (!title) return NextResponse.json({ error: 'Укажите название подраздела подраздела' }, { status: 400 })

    const slug = (body.slug && String(body.slug).trim()) || slugFromTitle(title)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ error: 'Slug: только латиница, цифры и дефисы' }, { status: 400 })
    }

    const maxOrder = await prisma.catalogSubsubsection.aggregate({
      where: { subsectionId },
      _max: { order: true }
    })
    const order = (maxOrder._max.order ?? -1) + 1

    const subsubsection = await prisma.catalogSubsubsection.create({
      data: { subsectionId, title, slug, order }
    })
    return NextResponse.json(subsubsection, { status: 201 })
  } catch (error: unknown) {
    const e = error as { code?: string }
    if (e?.code === 'P2002') return NextResponse.json({ error: 'Подраздел подраздела с таким slug уже есть' }, { status: 400 })
    if (e?.code === 'P2003') return NextResponse.json({ error: 'Подраздел не найден' }, { status: 400 })
    console.error('[ADMIN CATALOG SUBSECTIONS] POST error:', error)
    return NextResponse.json({ error: 'Ошибка создания' }, { status: 500 })
  }
}
