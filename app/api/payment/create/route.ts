import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'

const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://xn--e1aalfmgbdekz5c.xn--p1ai'

export async function POST(req: Request) {
  try {
    if (!YOOKASSA_SHOP_ID || !YOOKASSA_SECRET_KEY) {
      console.error('[PAYMENT] YooKassa credentials not configured')
      return NextResponse.json(
        { error: 'Оплата временно недоступна. Настройте YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY.' },
        { status: 503 }
      )
    }

    const body = await req.json()
    const { projectId, projectTitle, amount, config, email, phone } = body

    if (!projectId || !projectTitle || !amount || typeof amount !== 'number' || amount < 100) {
      return NextResponse.json(
        { error: 'Неверные данные заказа: projectId, projectTitle и сумма обязательны (мин. 1 ₽)' },
        { status: 400 }
      )
    }

    const amountKopecks = Math.round(amount * 100)
    const orderId = nanoid(16)

    const order = await prisma.order.create({
      data: {
        id: orderId,
        projectId,
        projectTitle,
        amount: amountKopecks,
        config: config || {},
        status: 'pending',
        email: email || null,
        phone: phone || null,
      },
    })

    const returnUrl = `${SITE_URL}/checkout/success?orderId=${orderId}`
    const cancelUrl = `${SITE_URL}/checkout/${projectId}?cancelled=1`

    const yookassaRes = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString('base64')}`,
        'Idempotence-Key': orderId,
      },
      body: JSON.stringify({
        amount: {
          value: (amountKopecks / 100).toFixed(2),
          currency: 'RUB',
        },
        confirmation: {
          type: 'redirect',
          return_url: returnUrl,
          enforce: false,
        },
        capture: true,
        description: `Заказ ${projectTitle} (${orderId})`,
        metadata: {
          orderId,
          projectId,
        },
        receipt: email
          ? {
              customer: { email },
              items: [
                {
                  description: projectTitle,
                  quantity: '1',
                  amount: { value: (amountKopecks / 100).toFixed(2), currency: 'RUB' },
                  vat_code: 1,
                },
              ],
            }
          : undefined,
      }),
    })

    if (!yookassaRes.ok) {
      const errText = await yookassaRes.text()
      console.error('[PAYMENT] YooKassa error:', yookassaRes.status, errText)
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'failed' },
      })
      return NextResponse.json(
        { error: 'Не удалось создать платёж. Попробуйте позже.' },
        { status: 502 }
      )
    }

    const payment = await yookassaRes.json()
    const confirmationUrl = payment?.confirmation?.confirmation_url

    if (!confirmationUrl) {
      console.error('[PAYMENT] No confirmation_url in YooKassa response:', payment)
      return NextResponse.json(
        { error: 'Ошибка платёжной системы' },
        { status: 502 }
      )
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { yookassaPaymentId: payment.id },
    })

    return NextResponse.json({
      success: true,
      confirmationUrl,
      orderId,
    })
  } catch (error) {
    console.error('[PAYMENT] Create error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка при создании платежа' },
      { status: 500 }
    )
  }
}
