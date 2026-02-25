'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SparksEffect from '@/components/SparksEffect'

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams?.get('orderId')
  const [order, setOrder] = useState<{ projectTitle: string; amount: number; status: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderId) {
      setLoading(false)
      return
    }
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.ok ? r.json() : null)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false))
  }, [orderId])

  const formatPrice = (n: number) => new Intl.NumberFormat('ru-RU').format(n / 100) + ' ₽'

  return (
    <>
      <Header variant="light" />
      <main className="pt-16 min-h-screen bg-[#0D0805] relative overflow-hidden">
        <SparksEffect />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(92,56,37,0.12)_0%,transparent_50%)] pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto px-4 py-16 sm:py-24 text-center">
          {loading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-amber-500/50 border-t-amber-400 mx-auto" />
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-8 border border-emerald-500/40">
                <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white font-lora mb-4">
                Оплата прошла успешно
              </h1>
              <p className="text-white/70 mb-8 max-w-md mx-auto">
                Спасибо за заказ! Мы свяжемся с вами в ближайшее время для уточнения деталей.
              </p>
              {order && (
                <div className="rounded-xl bg-white/5 border border-white/10 p-6 mb-8 inline-block text-left">
                  <p className="text-white/80 text-sm">Номер заказа</p>
                  <p className="text-white font-mono text-lg">{orderId}</p>
                  <p className="text-white/80 text-sm mt-3">{order.projectTitle}</p>
                  <p className="text-amber-400 font-bold text-xl">{formatPrice(order.amount)}</p>
                </div>
              )}
              <Link
                href="/catalog"
                className="inline-block px-8 py-4 bg-amber-500 hover:bg-amber-500/90 text-[#0D0805] font-bold rounded-xl transition-colors"
              >
                В каталог
              </Link>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
