'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { 
  User, Heart, 
  Settings, LogOut, Eye, EyeOff 
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useFavoritesCompare } from '@/components/providers/FavoritesCompareProvider';

type Section = 'profile' | 'favorites' | 'settings'

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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1A0F0A]"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const sections = [
    { id: 'profile' as Section, label: 'Профиль', icon: User },
    { id: 'favorites' as Section, label: 'Избранное', icon: Heart },
    { id: 'settings' as Section, label: 'Настройки', icon: Settings },
  ]

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-[#FAF7F2] via-[#F5F0E8] to-[#EDE8E0] pt-16">
        {/* Page Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-[#E8E2D9] sticky top-16 z-40 shadow-[0_4px_24px_-4px_rgba(26,15,10,0.06)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-2xl font-bold text-[#1A1210] font-lora">Личный кабинет</h1>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 text-[#5C3825]/90 hover:text-[#1A0F0A] transition-colors"
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
            <div className="bg-white rounded-2xl shadow-[0_4px_24px_-4px_rgba(26,15,10,0.08)] border border-[#E8E2D9] p-4 space-y-2">
              {sections.map((section) => {
                const Icon = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      activeSection === section.id
                        ? 'bg-[#1A0F0A] text-white'
                        : 'text-[#5C3825]/90 hover:bg-[#FAF7F2]'
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
            <div className="bg-white rounded-2xl shadow-[0_4px_24px_-4px_rgba(26,15,10,0.08)] border border-[#E8E2D9] p-6 md:p-8">
              {activeSection === 'profile' && (
                <div className="space-y-4">
                  <h2 className="text-xl md:text-2xl font-bold text-[#1A1210] mb-2 font-lora">Профиль</h2>
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-[#1A0F0A]/10 flex items-center justify-center">
                      <User className="w-8 h-8 md:w-12 md:h-12 text-[#1A0F0A]" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg md:text-xl font-semibold text-[#1A1210] truncate">
                        {session.user?.name || 'Пользователь'}
                      </h3>
                      <p className="text-sm md:text-base text-[#5C3825]/90 break-words">
                        {session.user?.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              

              {activeSection === 'favorites' && (
                <div>
                  <h2 className="text-2xl font-bold text-[#1A1210] mb-4 font-lora">Избранное</h2>
                  <p className="text-[#5C3825]/90">У вас пока нет избранных проектов</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {favoritesList.map(f => (
                      <a key={f.id} href={`/project/${f.slug}`} className="bg-[#FAF7F2] p-5 rounded-2xl flex flex-col shadow-[0_4px_24px_-4px_rgba(26,15,10,0.08)] border border-[#E8E2D9] relative hover:shadow-[0_8px_30px_-8px_rgba(26,15,10,0.12)] transition-all">
                        <img src={f.image} alt={f.title} className="w-full aspect-video rounded-lg object-cover mb-4" />
                        <div className="mb-2 font-bold text-lg">{f.title}</div>
                        <div className="font-semibold text-[#1A0F0A]">{f.priceFrom ? `${f.priceFrom.toLocaleString()} ₽` : ''}</div>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFavorite(f.slug) }}
                          className="absolute top-3 right-3 text-[#1A0F0A] hover:text-red-500"
                          aria-label="Убрать из избранного"
                        >
                          <Heart/>
                        </button>
                      </a>
                    ))}
                  </div>
                </div>
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
      <h2 className="text-2xl font-bold text-[#1A1210] mb-4 font-lora">Настройки профиля</h2>
      <form onSubmit={handleSave} className="space-y-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Имя</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] focus:border-[#1A0F0A] outline-none transition-all" />
        </div>
        <div className="flex items-center gap-3">
          <label className="block text-sm font-medium text-gray-700">Уведомления по e-mail</label>
          <input type="checkbox" checked={notifications} onChange={e => setNotifications(e.target.checked)} className="w-6 h-6 text-[#1A0F0A] border-[#E8E2D9] rounded" />
        </div>
        <button type="submit" className="bg-[#1A0F0A] text-white font-bold rounded-xl py-3 px-8 hover:bg-[#2C1810] transition-all shadow-[0_4px_20px_-4px_rgba(26,15,10,0.3)]">Сохранить</button>
      </form>
      <button onClick={()=>setShowChangePwd(s=>!s)} className="mb-6 text-[#1A0F0A] hover:text-[#2C1810] underline transition-colors">Сменить пароль</button>
      {showChangePwd && (
        <form onSubmit={handlePwd} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Старый пароль</label>
            <div className="relative">
              <input type={pwdVisible ? 'text' : 'password'} value={oldPwd} onChange={e=>setOldPwd(e.target.value)} className="w-full h-12 px-4 pr-12 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] focus:border-[#1A0F0A] outline-none transition-all" placeholder="••••••••" />
              <button type="button" onClick={()=>setPwdVisible(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C3825]/60 hover:text-[#1A0F0A]">
                {pwdVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Новый пароль</label>
            <div className="relative">
              <input type={pwdVisible ? 'text' : 'password'} value={newPwd} onChange={e=>setNewPwd(e.target.value)} className="w-full h-12 px-4 pr-12 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] focus:border-[#1A0F0A] outline-none transition-all" placeholder="••••••••" disabled={!oldPwd} />
            </div>
          </div>
          <button type="submit" className="bg-[#1A0F0A] text-white font-bold rounded-xl py-3 px-8 hover:bg-[#2C1810] transition-all block w-full shadow-[0_4px_20px_-4px_rgba(26,15,10,0.3)]" disabled={loading}>
            {loading ? 'Изменение...' : 'Сменить пароль'}
          </button>
        </form>
      )}
      {success && <div className="mt-4 text-green-600 bg-green-100 rounded-xl py-3 px-4">{success}</div>}
      {error && <div className="mt-4 text-red-600 bg-red-100 rounded-xl py-3 px-4">{error}</div>}
    </div>
  )
}

