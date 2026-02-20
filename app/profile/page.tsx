'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { 
  User, Heart, MessageCircle, 
  Settings, LogOut, Eye, EyeOff 
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useFavoritesCompare } from '@/components/providers/FavoritesCompareProvider';

type Section = 'profile' | 'favorites' | 'tickets' | 'settings'

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<Section>('profile')

  // --- FAV/COMPARE API (global context) ---
  const favContext = useFavoritesCompare();
  const { favorites = [], favoritesList = [], removeFavorite = async () => {}, loading = false } = favContext || {};

  useEffect(() => {
    if (session?.user?.email) {
      // fetch('/api/profile/favorites/none').then(r => r.json()).then(data => {
      //   setFavorites(Array.isArray(data.favorites) ? data.favorites.map(p => p.id) : [])
      //   setFavoritesList(data.favorites||[])
      // })
      // fetch('/api/profile/compare/none').then(r => r.json()).then(data => {
      //   setCompare(Array.isArray(data.compare) ? data.compare.map(p => p.id) : [])
      //   setCompareList(data.compare||[])
      // })
    }
  }, [session])

  // async function handleRemoveFavorite(id) {
  //   await fetch(`/api/profile/favorites/${id}`, { method: 'DELETE' })
  //   const res = await fetch('/api/profile/favorites/none');
  //   const data = await res.json();
  //   setFavorites(Array.isArray(data.favorites) ? data.favorites.map(p => p.id) : [])
  //   setFavoritesList(data.favorites||[])
  // }
  // async function handleRemoveCompare(id) {
  //   await fetch(`/api/profile/compare/${id}`, { method: 'DELETE' })
  //   const res = await fetch('/api/profile/compare/none');
  //   const data = await res.json();
  //   setCompare(Array.isArray(data.compare) ? data.compare.map(p => p.id) : [])
  //   setCompareList(data.compare||[])
  // }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1E3A5F]"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const sections = [
    { id: 'profile' as Section, label: 'Профиль', icon: User },
    { id: 'favorites' as Section, label: 'Избранное', icon: Heart },
    { id: 'tickets' as Section, label: 'Поддержка', icon: MessageCircle },
    { id: 'settings' as Section, label: 'Настройки', icon: Settings },
  ]

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pt-16">
        {/* Page Header */}
        <div className="bg-white shadow-sm sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-2xl font-bold text-gray-900 font-inter">Личный кабинет</h1>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Выйти</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4 space-y-2">
              {sections.map((section) => {
                const Icon = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      activeSection === section.id
                        ? 'bg-[#1E3A5F] text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{section.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm p-6">
              {activeSection === 'profile' && (
                <div className="space-y-4">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 font-inter">Профиль</h2>
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-8 h-8 md:w-12 md:h-12 text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg md:text-xl font-semibold text-gray-900 truncate">
                        {session.user?.name || 'Пользователь'}
                      </h3>
                      <p className="text-sm md:text-base text-gray-600 break-words">
                        {session.user?.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              

              {activeSection === 'favorites' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 font-inter">Избранное</h2>
                  <p className="text-gray-600">У вас пока нет избранных проектов</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {favoritesList.map(f => (
                      <a key={f.id} href={`/project/${f.slug}`} className="bg-[#f6f4f3] p-5 rounded-xl flex flex-col shadow-sm relative hover:shadow-md transition-shadow">
                        <img src={f.image} alt={f.title} className="w-full aspect-video rounded-lg object-cover mb-4" />
                        <div className="mb-2 font-bold text-lg">{f.title}</div>
                        <div className="font-semibold text-[#1E3A5F]">{f.priceFrom ? `${f.priceFrom.toLocaleString()} ₽` : ''}</div>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFavorite(f.slug) }}
                          className="absolute top-3 right-3 text-[#1E3A5F] hover:text-red-500"
                          aria-label="Убрать из избранного"
                        >
                          <Heart/>
                        </button>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              


              

              {activeSection === 'tickets' && (
                <SupportChat />
              )}

              {activeSection === 'settings' && (
                <ProfileSettings session={session} />
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}


// Компонент чата поддержки
function SupportChat() {
  const initial = [{ from: 'bot', text: 'Здравствуйте! Какой у вас вопрос? Выберите тему из списка.' }]
  const faq = [
    { q: 'Как рассчитать стоимость труб?', a: 'Для расчета стоимости воспользуйтесь калькулятором на сайте или свяжитесь с нами для получения точного расчета.' },
    { q: 'Какие типы труб вы поставляете?', a: 'Мы поставляем трубы ПНД различных диаметров и классов прочности. Наши менеджеры помогут подобрать оптимальный вариант для вашего проекта.' },
    { q: 'Какие документы нужны для заказа?', a: 'Основные документы — паспорт, реквизиты организации (если требуется) и техническое задание на поставку.' },
    { q: 'Какие гарантии на продукцию?', a: 'Мы предоставляем гарантию качества на всю поставляемую продукцию. Все детали в договоре поставки.' },
    { q: 'Какой срок поставки?', a: 'Срок поставки зависит от объема заказа и наличия товара на складе. Обычно 3-7 рабочих дней.' },
  ]
  const [messages, setMessages] = useState(initial)
  const [inputOpen, setInputOpen] = useState(true)
  const [pendingQ, setPendingQ] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function sendQuestion(q: string) {
    setMessages(msgs => [
      ...msgs,
      { from: 'user', text: q },
      { from: 'bot', text: faq.find(f => f.q === q)?.a || 'Пожалуйста, выберите вопрос из списка.'}
    ])
    setInputOpen(false)
    setTimeout(() => {
      setInputOpen(true)
    }, 350) // для имитации бота
  }

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-[#1E3A5F] mb-4 font-inter">Чат поддержки</h2>
      <div className="rounded-xl border border-[#D4E4F0] bg-gray-50 p-4 mb-3 min-h-[240px] max-h-[360px] overflow-y-auto flex flex-col">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-2 flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`inline-block px-4 py-2 rounded-2xl text-sm max-w-[75%] break-words ${msg.from === 'user' ? 'bg-[#1E3A5F] text-white' : 'bg-[#E8F0F8] text-[#1E3A5F] border border-[#D4E4F0]'}`}>{msg.text}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {inputOpen && (
        <div className="flex flex-wrap gap-2 mb-4">
          {faq.map(f => (
            <button key={f.q} onClick={() => sendQuestion(f.q)} className="px-4 py-2 rounded-full text-sm font-medium border bg-white text-[#1E3A5F] border-[#1E3A5F] hover:bg-[#E8F0F8] transition-all">
              {f.q}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-3 border-t pt-3 mt-2">
        <a href="https://wa.me/79313023008" target="_blank" rel="noopener noreferrer" className="flex-1 py-3 px-4 bg-[#1E3A5F] text-white font-bold rounded-xl text-base hover:bg-[#2C5282] transition-all flex items-center justify-center gap-2 shadow-md">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          WhatsApp
        </a>
        <a href="tel:+79313023008" className="flex-1 py-3 px-4 bg-[#1E3A5F] text-white font-bold rounded-xl text-base hover:bg-[#2C5282] transition-all flex items-center justify-center gap-2 shadow-md whitespace-nowrap">Позвонить: +7 (931) 302-30-08</a>
      </div>
    </div>
  )
}

// Компонент настроек профиля
function ProfileSettings({ session }) {
  const [name, setName] = useState(session.user?.name ?? '')
  const [showChangePwd, setShowChangePwd] = useState(false)
  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [pwdVisible, setPwdVisible] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notifications, setNotifications] = useState(true)
  const [loading, setLoading] = useState(false)

  function handleSave(e) {
    e.preventDefault();
    setSuccess('Имя успешно обновлено!');
    setError(null);
  }

  async function handlePwd(e) {
    e.preventDefault();
    setError(null); setSuccess(null);
    if (!oldPwd || !newPwd) { setError('Заполните оба поля'); return }
    if (newPwd.length < 8) { setError('Пароль слишком короткий'); return; }
    setLoading(true)
    try {
      const res = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email, oldPassword: oldPwd, newPassword: newPwd })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Ошибка смены пароля');
      } else {
        setSuccess('Пароль успешно изменён');
        setOldPwd(''); setNewPwd(''); setShowChangePwd(false);
      }
    } catch(error) {
      setError('Ошибка смены пароля');
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-[#1E3A5F] mb-4 font-inter">Настройки профиля</h2>
      <form onSubmit={handleSave} className="space-y-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Имя</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/50 border border-gray-200 focus:border-[#1E3A5F] outline-none transition-all" />
        </div>
        <div className="flex items-center gap-3">
          <label className="block text-sm font-medium text-gray-700">Уведомления по e-mail</label>
          <input type="checkbox" checked={notifications} onChange={e => setNotifications(e.target.checked)} className="w-6 h-6 text-[#1E3A5F] border-gray-300 rounded" />
        </div>
        <button type="submit" className="bg-[#1E3A5F] text-white font-bold rounded-xl py-3 px-8 hover:bg-[#2C5282] transition-all">Сохранить</button>
      </form>
      <button onClick={()=>setShowChangePwd(s=>!s)} className="mb-6 text-[#1E3A5F] underline">Сменить пароль</button>
      {showChangePwd && (
        <form onSubmit={handlePwd} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Старый пароль</label>
            <div className="relative">
              <input type={pwdVisible ? 'text' : 'password'} value={oldPwd} onChange={e=>setOldPwd(e.target.value)} className="w-full h-12 px-4 pr-12 rounded-xl bg-white/50 border border-gray-200 focus:border-[#1E3A5F] outline-none transition-all" placeholder="••••••••" />
              <button type="button" onClick={()=>setPwdVisible(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1E3A5F]">
                {pwdVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Новый пароль</label>
            <div className="relative">
              <input type={pwdVisible ? 'text' : 'password'} value={newPwd} onChange={e=>setNewPwd(e.target.value)} className="w-full h-12 px-4 pr-12 rounded-xl bg-white/50 border border-gray-200 focus:border-[#1E3A5F] outline-none transition-all" placeholder="••••••••" disabled={!oldPwd} />
            </div>
          </div>
          <button type="submit" className="bg-[#1E3A5F] text-white font-bold rounded-xl py-3 px-8 hover:bg-[#2C5282] transition-all block w-full" disabled={loading}>
            {loading ? 'Изменение...' : 'Сменить пароль'}
          </button>
        </form>
      )}
      {success && <div className="mt-4 text-green-600 bg-green-100 rounded-xl py-3 px-4">{success}</div>}
      {error && <div className="mt-4 text-red-600 bg-red-100 rounded-xl py-3 px-4">{error}</div>}
    </div>
  )
}

