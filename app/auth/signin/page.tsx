'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { Mail, Lock, Loader, Eye, EyeOff } from 'lucide-react'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('Начало входа...')
      // Таймаут 8 секунд
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 8000)
      )

      // Используем redirect: false чтобы обработать ошибки
      // Затем сами делаем редирект после успешного входа
      const result = await Promise.race([
        signIn('credentials', {
          email,
          password,
          redirect: false,
          callbackUrl: '/profile'
        }),
        timeoutPromise
      ]) as any
      
      console.log('SignIn result:', result)

      if (result?.error) {
        const errorMsg = result.error === 'CredentialsSignin' 
          ? 'Неверный email или пароль' 
          : result.error
        setError(errorMsg)
        setLoading(false)
        return
      }

      if (result?.ok) {
        // Вход успешен - делаем редирект на профиль
        window.location.href = '/profile'
        return
      }
      
      // Если нет результата - неизвестная ошибка
      setError('Ошибка входа. Попробуйте еще раз.')
      setLoading(false)
    } catch (err: any) {
      console.error('SignIn error:', err)
      const errorMsg = err?.message?.includes('Timeout')
        ? 'Превышено время ожидания (8 сек). Проверьте подключение или попробуйте еще раз.'
        : 'Произошла ошибка при входе. Попробуйте обновить страницу.'
      setError(errorMsg)
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    await signIn('google', { callbackUrl: '/admin' })
  }

  return (
    <>
      <Header />
      <div className="min-h-screen pt-16 relative overflow-hidden bg-gradient-to-b from-[#FAF7F2] via-[#F5F0E8] to-[#EDE8E0]">
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            {/* Premium Card */}
            <div className="bg-white rounded-2xl border border-[#E8E2D9] shadow-[0_25px_50px_-12px_rgba(26,15,10,0.15)] overflow-hidden">
              <div className="relative p-8 md:p-10 space-y-6">
                <div className="text-center mb-8">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#5C3825] mb-4 font-medium">Личный кабинет</p>
                  <h1 className="text-4xl font-bold text-[#1A1210] mb-2 font-lora">Добро пожаловать!</h1>
                  <p className="text-[#5C3825]/90">Войдите в личный кабинет</p>
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5C3825]/60 group-focus-within:text-[#1A0F0A] transition-colors" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] focus:border-[#1A0F0A] focus:outline-none focus:ring-2 focus:ring-[#1A0F0A]/20 transition-all"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Пароль
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5C3825]/60 group-focus-within:text-[#1A0F0A] transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-12 py-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] focus:border-[#1A0F0A] focus:outline-none focus:ring-2 focus:ring-[#1A0F0A]/20 transition-all"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-[#1A0F0A] text-white font-bold rounded-xl text-base hover:bg-[#2C1810] transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_4px_20px_-4px_rgba(26,15,10,0.3)]"
                  >
                    {loading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Вход...
                      </>
                    ) : (
                      'Войти'
                    )}
                  </button>
                </form>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#E8E2D9]"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-[#5C3825]/70">или</span>
                  </div>
                </div>

                <div className="text-center text-sm text-[#5C3825]/90 mt-6">
                  Нет аккаунта?{' '}
                  <a href="/auth/register" className="font-semibold text-[#1A0F0A] hover:text-[#2C1810] underline underline-offset-2 transition-colors">
                    Зарегистрироваться
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  )
}
