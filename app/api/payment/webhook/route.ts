import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { type, event } = body

    if (event !== 'payment.succeeded' && event !== 'payment.canceled') {
      return NextResponse.json({ received: true })
    }

    const payment = body?.object
    const orderId = payment?.metadata?.orderId

    if (!orderId) {
      console.warn('[PAYMENT WEBHOOK] No orderId in metadata:', payment?.metadata)
      return NextResponse.json({ received: true })
    }

    if (event === 'payment.succeeded') {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'paid', updatedAt: new Date() },
      })
      console.log('[PAYMENT WEBHOOK] Order paid:', orderId)
    } else if (event === 'payment.canceled') {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'cancelled', updatedAt: new Date() },
      })
      console.log('[PAYMENT WEBHOOK] Order cancelled:', orderId)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[PAYMENT WEBHOOK] Error:', error)
    return NextResponse.json({ received: true }, { status: 200 })
  }
}
