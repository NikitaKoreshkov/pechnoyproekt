import { NextResponse } from 'next/server'
import { join } from 'path'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'

const UPLOADS_DIR = join(process.cwd(), 'public', 'uploads')

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  try {
    const resolved = params instanceof Promise ? await params : params
    const pathSegments = resolved?.path || []
    if (pathSegments.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (pathSegments.some((p) => p === '..' || p.includes('/') || p.includes('\\'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const filename = pathSegments[pathSegments.length - 1]
    const filepath = join(UPLOADS_DIR, ...pathSegments)
    if (!existsSync(filepath)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const ext = filename.includes('.') ? '.' + filename.split('.').pop()!.toLowerCase() : ''
    const contentType = MIME[ext] || 'application/octet-stream'
    const buffer = await readFile(filepath)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
