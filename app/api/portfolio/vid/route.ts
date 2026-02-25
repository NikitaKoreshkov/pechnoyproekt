import { NextResponse } from 'next/server'
import { getVidProjects } from '@/lib/parser-data'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const projects = await getVidProjects()
    return NextResponse.json({ projects })
  } catch (err) {
    console.error('[Portfolio Vid API]', err)
    return NextResponse.json({ projects: [] })
  }
}
