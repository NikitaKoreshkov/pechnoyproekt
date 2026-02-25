import { NextResponse } from 'next/server'
import { getKladkaProjects } from '@/lib/parser-data'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const projects = await getKladkaProjects()
    return NextResponse.json({ projects })
  } catch (err) {
    console.error('[Portfolio Kladka API]', err)
    return NextResponse.json({ projects: [] })
  }
}
