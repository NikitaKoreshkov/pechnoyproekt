import { NextResponse } from 'next/server'
import { getTypeProjects } from '@/lib/parser-data'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const projects = await getTypeProjects()
    return NextResponse.json({ projects })
  } catch (err) {
    console.error('[Portfolio Types API]', err)
    return NextResponse.json({ projects: [] })
  }
}
