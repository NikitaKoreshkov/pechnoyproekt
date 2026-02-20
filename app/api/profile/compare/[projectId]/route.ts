import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req, { params }: { params: Promise<{ projectId: string }> | { projectId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }
  const resolvedParams = params instanceof Promise ? await params : params
  let projectId = resolvedParams.projectId;
  
  if (!projectId) {
    console.error('[COMPARE POST] No projectId in params:', resolvedParams)
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
  }
  
  // Декодируем URL-encoded параметр
  try {
    projectId = decodeURIComponent(projectId)
  } catch (e) {
    console.warn('[COMPARE POST] Failed to decode projectId, using as-is:', projectId)
  }
  
  console.log('[COMPARE POST] Adding compare for projectId:', projectId)
  
  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { compareProjects: { connect: { slug: projectId } } }
    })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[COMPARE POST] Error:', e.message)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}

export async function DELETE(req, { params }: { params: Promise<{ projectId: string }> | { projectId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }
  const resolvedParams = params instanceof Promise ? await params : params
  let projectId = resolvedParams.projectId;
  
  if (!projectId) {
    console.error('[COMPARE DELETE] No projectId in params:', resolvedParams)
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
  }
  
  // Декодируем URL-encoded параметр
  try {
    projectId = decodeURIComponent(projectId)
  } catch (e) {
    console.warn('[COMPARE DELETE] Failed to decode projectId, using as-is:', projectId)
  }
  
  console.log('[COMPARE DELETE] Removing compare for projectId:', projectId)
  
  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { compareProjects: { disconnect: { slug: projectId } } }
    })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[COMPARE DELETE] Error:', e.message)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}

export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }
  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { compareProjects: { select: { id: true, slug: true, title: true, image: true, priceFrom: true } } }
    })
    return NextResponse.json({ compare: user?.compareProjects || [] })
  } catch (e) {
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}
