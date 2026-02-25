'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SparksEffect from '@/components/SparksEffect'
import Image from 'next/image'

const STORAGE_KEY = 'pechnoyproekt_checkout_config'

export default function CheckoutPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params?.projectId as string
  const [config, setConfig] = useState<{
    projectTitle: string
    amount: number
    image?: string
    configSummary?: string[]
  } | null>(null)
  const [project, setProject] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cancelled, setCancelled] = useState(false)

  useEffect(() => {
    const sp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
    if (sp?.get('cancelled') === '1') setCancelled(true)
  }, [])

  useEffect(() => {
    if (!projectId || typeof window === 'undefined') return

    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (!stored) {
        setConfig(null)
        setLoading(false)
        return
      }
      const parsed = JSON.parse(stored)
      if (parsed.projectId !== projectId) {
        sessionStorage.removeItem(STORAGE_KEY)
        setConfig(null)
      } else {
        setConfig(parsed)
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY)
      setConfig(null)
    }
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    if (!projectId) return
    fetch(`/api/projects/${projectId}`, { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then(setProject)
      .catch(() => setProject(null))
  }, [projectId])

  const formatPrice = (n: number) => new Intl.NumberFormat('ru-RU').format(n) + ' ₽'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!config || !email.trim()) {
      setError('Укажите email для чека')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      const fullConfig = stored ? JSON.parse(stored) : {}
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          projectTitle: config.projectTitle,
          amount: config.amount,
          config: fullConfig,
          email: email.trim(),
          phone: phone.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка создания платежа')
      }
      if (data.confirmationUrl) {
        sessionStorage.removeItem(STORAGE_KEY)
        window.location.href = data.confirmationUrl
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка. Попробуйте ещё раз.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <>
        <Header variant="light" />
        <main className="pt-16 min-h-screen flex items-center justify-center bg-[#0D0805]">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-amber-500/50 border-t-amber-400" />
        </main>
        <Footer />
      </>
    )
  }

  if (!config) {
    return (
      <>
        <Header variant="light" />
        <main className="pt-16 min-h-screen flex flex-col items-center justify-center bg-[#0D0805] px-4">
          <p className="text-white/80 text-center mb-6">
            Данные заказа не найдены. Перейдите к товару и нажмите «Оплатить».
          </p>
          <Link
            href={projectId ? `/project/${projectId}` : '/catalog'}
            className="px-6 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold rounded-xl border border-amber-500/40"
          >
            К товару
          </Link>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header variant="light" />
      <main className="pt-16 min-h-screen bg-[#0D0805] relative overflow-hidden">
        <SparksEffect />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(92,56,37,0.12)_0%,transparent_50%)] pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto px-4 py-12 sm:py-16">
          <div className="text-center mb-10">
            <p className="text-amber-500/90 text-xs uppercase tracking-[0.3em] mb-2">Оформление заказа</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white font-lora tracking-tight">
              Оплата
            </h1>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mx-auto mt-4" />
          </div>

          {cancelled && (
            <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm">
              Оплата отменена. Вы можете попробовать снова.
            </div>
          )}

          <div
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden"
            style={{
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
            }}
          >
            <div className="p-6 sm:p-8">
              <div className="flex gap-4 sm:gap-6 mb-8">
                {(config.image || project?.image) && (
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-xl overflow-hidden bg-white/10">
                    <Image
                      src={config.image || project?.image || '/images/1.png'}
                      alt={config.projectTitle}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-semibold text-white font-lora mb-2">
                    {config.projectTitle}
                  </h2>
                  {config.configSummary && config.configSummary.length > 0 && (
                    <ul className="text-sm text-white/70 space-y-1">
                      {config.configSummary.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-4 text-2xl sm:text-3xl font-bold text-amber-400/95">
                    {formatPrice(config.amount)}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Email <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your@email.ru"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">Телефон</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 (999) 123-45-67"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-500/90 disabled:bg-amber-500/50 text-[#0D0805] font-bold rounded-xl transition-all duration-200 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30"
                >
                  {submitting ? 'Создание платежа...' : 'Перейти к оплате'}
                </button>
              </form>
            </div>
          </div>

          <p className="mt-6 text-center text-white/50 text-sm">
            После нажатия вы будете перенаправлены на защищённую страницу ЮKassa для оплаты
          </p>

          <div className="mt-8 text-center">
            <Link
              href={`/project/${projectId}`}
              className="text-amber-500/80 hover:text-amber-400 text-sm"
            >
              ← Вернуться к товару
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
