import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { legalContents } from '@/lib/legal-content'

function ensureAdmin(session: any) {
  return session?.user && ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')
}

const defaultContents = legalContents as Record<string, { title: string, content: string }>

export async function GET(req: Request, { params }: { params: { type: string } }) {
  try {
    const { type } = params
    let config = null

    if (type === 'privacy') {
      config = await prisma.privacyConfig.findFirst()
      if (!config) {
        config = await prisma.privacyConfig.create({ data: defaultContents.privacy })
      }
    } else if (type === 'terms') {
      config = await prisma.termsConfig.findFirst()
      if (!config) {
        config = await prisma.termsConfig.create({ data: defaultContents.terms })
      }
    } else if (type === 'cookies') {
      config = await prisma.cookiesConfig.findFirst()
      if (!config) {
        config = await prisma.cookiesConfig.create({ data: defaultContents.cookies })
      }
    }

    return NextResponse.json(config)
  } catch (error: any) {
    console.error(`[ADMIN LEGAL ${params.type.toUpperCase()}] GET Error:`, error)
    return NextResponse.json({ error: 'Ошибка загрузки конфигурации' }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: { type: string } }) {
  const session = await getServerSession(authOptions)
  const { type } = params
  console.log(`[ADMIN LEGAL ${type.toUpperCase()}] POST - Session:`, !!session, session?.user?.email, session?.user?.role)
  if (!ensureAdmin(session)) {
    console.log(`[ADMIN LEGAL ${type.toUpperCase()}] POST - Unauthorized`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    console.log(`[ADMIN LEGAL ${type.toUpperCase()}] POST - Body:`, body)
    const { title, content } = body

    let config
    if (type === 'privacy') {
      const existingConfig = await prisma.privacyConfig.findFirst()
      config = existingConfig
        ? await prisma.privacyConfig.update({
            where: { id: existingConfig.id },
            data: { title, content }
          })
        : await prisma.privacyConfig.create({
            data: { title, content }
          })
    } else if (type === 'terms') {
      const existingConfig = await prisma.termsConfig.findFirst()
      config = existingConfig
        ? await prisma.termsConfig.update({
            where: { id: existingConfig.id },
            data: { title, content }
          })
        : await prisma.termsConfig.create({
            data: { title, content }
          })
    } else if (type === 'cookies') {
      const existingConfig = await prisma.cookiesConfig.findFirst()
      config = existingConfig
        ? await prisma.cookiesConfig.update({
            where: { id: existingConfig.id },
            data: { title, content }
          })
        : await prisma.cookiesConfig.create({
            data: { title, content }
          })
    }

    console.log(`[ADMIN LEGAL ${type.toUpperCase()}] POST - Saved config:`, config?.id)
    return NextResponse.json(config)
  } catch (error: any) {
    console.error(`[ADMIN LEGAL ${type.toUpperCase()}] POST Error:`, error)
    return NextResponse.json({ error: 'Ошибка сохранения конфигурации' }, { status: 500 })
  }
}
