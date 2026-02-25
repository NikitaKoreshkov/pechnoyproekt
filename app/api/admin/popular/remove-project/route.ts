import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function ensureAdmin(session: unknown) {
  return (session as { user?: { role?: string } })?.user && ['ADMIN', 'SUPER_ADMIN'].includes((session as { user: { role?: string } }).user.role || '')
}

/** Убрать проект из популярных */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!ensureAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const projectSlug = typeof body.projectSlug === 'string' ? body.projectSlug.trim() : ''
    if (!projectSlug) return NextResponse.json({ error: 'Укажите projectSlug' }, { status: 400 })

    const deleted = await prisma.popularItem.deleteMany({
      where: { projectSlug }
    })
    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Проект не найден в популярных' }, { status: 404 })
    }
    return NextResponse.json({ ok: true, message: 'Убрано из популярных' })
  } catch (e: unknown) {
    console.error('[ADMIN POPULAR REMOVE] Error:', e)
    return NextResponse.json({ error: 'Ошибка удаления' }, { status: 500 })
  }
}
