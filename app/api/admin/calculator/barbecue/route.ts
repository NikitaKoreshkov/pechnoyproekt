import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function ensureAdmin(session: any) {
  return session?.user && ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!ensureAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const options = await prisma.calcBarbecueOption.findMany({
    orderBy: [{ variant: 'asc' }, { optionType: 'asc' }, { sortOrder: 'asc' }],
  })

  const standardMain = options.filter((o) => o.variant === 'standard' && o.optionType === 'main')
  const standardExtra = options.filter((o) => o.variant === 'standard' && o.optionType === 'extra')
  const vipMain = options.filter((o) => o.variant === 'vip' && o.optionType === 'main')
  const vipExtra = options.filter((o) => o.variant === 'vip' && o.optionType === 'extra')

  return NextResponse.json({
    standard: { main: standardMain, extra: standardExtra },
    vip: { main: vipMain, extra: vipExtra },
  })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!ensureAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { variant, optionType, name, price, image = '', sortOrder = 0 } = body

  if (!variant || !optionType || !name || typeof price !== 'number') {
    return NextResponse.json({ error: 'variant, optionType, name, price required' }, { status: 400 })
  }

  if (!['standard', 'vip'].includes(variant) || !['main', 'extra'].includes(optionType)) {
    return NextResponse.json({ error: 'Invalid variant or optionType' }, { status: 400 })
  }

  const created = await prisma.calcBarbecueOption.create({
    data: {
      variant,
      optionType,
      name: String(name).trim(),
      price: Math.round(Number(price)),
      image: String(image || ''),
      sortOrder: Math.round(Number(sortOrder)) || 0,
    },
  })

  return NextResponse.json(created)
}
