import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    console.log('[CALLBACK API] Received request')
    const body = await req.json()
    console.log('[CALLBACK API] Body:', JSON.stringify(body))
    
    const { name, phone } = body

    // Валидация
    if (!name || !phone) {
      console.log('[CALLBACK API] Validation failed - missing name or phone')
      return NextResponse.json(
        { error: 'Имя и телефон обязательны' },
        { status: 400 }
      )
    }

    console.log(`[CALLBACK API] Saving lead to DB: ${name}, ${phone}`)
    
    try {
      // Сохраняем в БД вместо отправки на почту
      const lead = await prisma.whatsAppLead.create({
        data: {
          name,
          phone,
          source: 'callback',
          purpose: 'Заказ звонка'
        }
      })

      console.log(`[CALLBACK API] Lead saved: ${lead.id}`)

      return NextResponse.json(
        { success: true, message: 'Заявка успешно отправлена' },
        { status: 200 }
      )
    } catch (dbError: any) {
      console.error('[CALLBACK API] Exception during DB save:', dbError)
      console.error('[CALLBACK API] Error message:', dbError?.message)
      return NextResponse.json(
        { error: `Ошибка сохранения: ${dbError?.message || 'Unknown error'}` },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[CALLBACK API] Error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

