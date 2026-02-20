import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/** Дерево каталога: разделы с подразделами для панели каталога */
export async function GET() {
  try {
    const catalogSectionModel = (prisma as { catalogSection?: { findMany: (args: any) => Promise<any[]> } }).catalogSection
    if (!catalogSectionModel?.findMany) {
      console.warn('Catalog tree: run "npx prisma generate" — catalogSection model not in client')
      return NextResponse.json([], {
        headers: { 'Cache-Control': 'no-store, max-age=0' }
      })
    }
    const sections = await catalogSectionModel.findMany({
      orderBy: { order: 'asc' },
      include: {
        subsections: {
          orderBy: { order: 'asc' },
          include: {
            subsubsections: { orderBy: { order: 'asc' } }
          }
        }
      }
    })
    return NextResponse.json(sections, {
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    })
  } catch (error) {
    console.error('Catalog tree error:', error)
    return NextResponse.json(
      { error: 'Failed to load catalog tree' },
      { status: 500 }
    )
  }
}
