import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await prisma.estimateDocument.delete({
      where: { id: params.id, userId: session.user.id } as any,
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    // Fallback: ensure ownership via transaction
    const doc = await prisma.estimateDocument.findUnique({ where: { id: params.id } })
    if (!doc || doc.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    await prisma.estimateDocument.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  }
}


