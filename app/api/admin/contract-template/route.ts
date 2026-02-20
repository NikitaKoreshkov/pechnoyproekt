import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

function ensureAdmin(session: any) {
  return session?.user && ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')
}

export async function GET() {
  try {
    const config = await prisma.contractTemplateConfig.findFirst()
    return NextResponse.json({
      filePath: config?.filePath || null
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    })
  } catch (error: any) {
    console.error('[CONTRACT TEMPLATE] Error loading:', error)
    return NextResponse.json({ error: 'Ошибка загрузки' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!ensureAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Проверка типа файла - только PDF
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Invalid file type. Only PDF files allowed.' }, { status: 400 })
    }

    // Проверка размера (макс 10MB для PDF)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 400 })
    }

    // Создаём папку uploads/contracts если её нет
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'contracts')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true, mode: 0o755 })
    }

    // Удаляем старый файл если есть
    const oldConfig = await prisma.contractTemplateConfig.findFirst()
    if (oldConfig?.filePath) {
      const oldFilePath = join(process.cwd(), 'public', oldConfig.filePath)
      if (existsSync(oldFilePath)) {
        try {
          await unlink(oldFilePath)
        } catch (err) {
          console.warn('[CONTRACT TEMPLATE] Failed to delete old file:', err)
        }
      }
    }

    // Генерируем уникальное имя файла
    const timestamp = Date.now()
    const filename = `contract-template-${timestamp}.pdf`
    const filepath = join(uploadsDir, filename)

    // Сохраняем файл
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Сохраняем путь в БД
    const publicPath = `/uploads/contracts/${filename}`
    
    if (oldConfig) {
      await prisma.contractTemplateConfig.update({
        where: { id: oldConfig.id },
        data: { filePath: publicPath }
      })
    } else {
      await prisma.contractTemplateConfig.create({
        data: { filePath: publicPath }
      })
    }

    return NextResponse.json({ filePath: publicPath })
  } catch (error: any) {
    console.error('[CONTRACT TEMPLATE] Error uploading:', error)
    return NextResponse.json({ 
      error: 'Ошибка загрузки', 
      details: error.message 
    }, { status: 500 })
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!ensureAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const config = await prisma.contractTemplateConfig.findFirst()
    if (config?.filePath) {
      // Удаляем файл
      const filePath = join(process.cwd(), 'public', config.filePath)
      if (existsSync(filePath)) {
        await unlink(filePath)
      }

      // Удаляем запись из БД
      await prisma.contractTemplateConfig.delete({
        where: { id: config.id }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[CONTRACT TEMPLATE] Error deleting:', error)
    return NextResponse.json({ 
      error: 'Ошибка удаления', 
      details: error.message 
    }, { status: 500 })
  }
}

