import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const PARSER_ROOT = join(process.cwd(), 'парсер')

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await params
  const pathSegments = Array.isArray(path) ? path : path ? [path] : []
  if (!pathSegments.length) {
    return NextResponse.json({ error: 'Path required' }, { status: 400 })
  }
  const decoded = pathSegments.map((p) => decodeURIComponent(p))
  const filePath = join(PARSER_ROOT, ...decoded)
  if (!filePath.startsWith(PARSER_ROOT)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  try {
    const buffer = await readFile(filePath)
    const ext = pathSegments[pathSegments.length - 1].split('.').pop()?.toLowerCase()
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    }
    const contentType = mimeTypes[ext || ''] || 'application/octet-stream'
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (err) {
    console.error('[Parser API]', err)
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 })
  }
}
