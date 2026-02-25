import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const orderId = params?.orderId
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { projectTitle: true, amount: true, status: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('[ORDERS API] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
