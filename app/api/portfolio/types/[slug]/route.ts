import { NextRequest, NextResponse } from 'next/server'
import { getProjectDetail } from '@/lib/parser-data'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  try {
    const data = await getProjectDetail('types', slug)
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(data)
  } catch (err) {
    console.error('[Portfolio Types Detail API]', err)
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 })
  }
}
