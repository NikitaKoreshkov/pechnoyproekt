import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Отключаем кеширование для этого API
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'
export const fetchCache = 'force-no-store'

function isDbUnreachable(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error)
  return /Can't reach database server|ECONNREFUSED|connection refused/i.test(msg)
}

export async function GET() {
  try {
    const items = await prisma.review.findMany({
      orderBy: { date: 'desc' }
    })
    return NextResponse.json(items, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Accel-Expires': '0',
        'Vary': '*'
      }
    })
  } catch (error) {
    if (isDbUnreachable(error)) {
      return NextResponse.json([], {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'X-DB-Status': 'unavailable'
        }
      })
    }
    console.error('[REVIEWS API] GET Error:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

