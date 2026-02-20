import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugFromTitle } from '@/lib/slug'

function ensureAdmin(session: unknown) {
  return (session as { user?: { role?: string } })?.user && ['ADMIN', 'SUPER_ADMIN'].includes((session as { user: { role?: string } }).user.role || '')
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!ensureAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = params instanceof Promise ? await params : params
  if (!id) return NextResponse.json({ error: 'ID не указан' }, { status: 400 })

  try {
    const body = await req.json()
    const data: { title?: string; slug?: string; order?: number } = {}

    if (typeof body.title === 'string') data.title = body.title.trim()
    if (typeof body.slug === 'string') data.slug = body.slug.trim()
    if (typeof body.order === 'number') data.order = body.order

    if (data.title && !data.slug) data.slug = slugFromTitle(data.title)
    if (data.slug && !/^[a-z0-9-]+$/.test(data.slug)) {
      return NextResponse.json({ error: 'Slug: только латиница, цифры и дефисы' }, { status: 400 })
    }

    const subsection = await prisma.catalogSubsection.update({
      where: { id },
      data: Object.keys(data).length ? data : undefined
    })
    return NextResponse.json(subsection)
  } catch (error: unknown) {
    const e = error as { code?: string }
    if (e?.code === 'P2025') return NextResponse.json({ error: 'Подраздел не найден' }, { status: 404 })
    if (e?.code === 'P2002') return NextResponse.json({ error: 'Slug уже занят в этом разделе' }, { status: 400 })
    console.error('[ADMIN CATALOG SUBSECTIONS] PATCH error:', error)
    return NextResponse.json({ error: 'Ошибка обновления' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!ensureAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = params instanceof Promise ? await params : params
  if (!id) return NextResponse.json({ error: 'ID не указан' }, { status: 400 })

  try {
    await prisma.catalogSubsection.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    const e = error as { code?: string }
    if (e?.code === 'P2025') return NextResponse.json({ error: 'Подраздел не найден' }, { status: 404 })
    console.error('[ADMIN CATALOG SUBSECTIONS] DELETE error:', error)
    return NextResponse.json({ error: 'Ошибка удаления' }, { status: 500 })
  }
}
