import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { message, phone, params } = body

    // Валидация
    if (!message) {
      return NextResponse.json(
        { error: 'Сообщение обязательно' },
        { status: 400 }
      )
    }

    if (!phone) {
      return NextResponse.json(
        { error: 'Номер телефона обязателен' },
        { status: 400 }
      )
    }

    // Сохраняем в БД вместо отправки на почту
    const lead = await prisma.whatsAppLead.create({
      data: {
        phone,
        message,
        params: params || null,
        source: 'calculator',
        purpose: 'Заявка из калькулятора'
      }
    })

    console.log('[CALCULATOR REQUEST API] Lead saved:', lead.id)

    return NextResponse.json(
      { success: true, message: 'Заявка успешно отправлена' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[CALCULATOR REQUEST API] Error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
