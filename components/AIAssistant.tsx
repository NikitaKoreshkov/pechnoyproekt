'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  groupFAQIntoThemes,
  getFollowUpQuestions,
  type GroupedTheme,
  type FAQItemFromAPI,
} from '@/lib/assistant-data'
import SparksEffect from '@/components/SparksEffect'

type View = 'closed' | 'themes' | 'questions' | 'answer'

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<View>('themes')
  const [themes, setThemes] = useState<GroupedTheme[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTheme, setSelectedTheme] = useState<GroupedTheme | null>(null)
  const [selectedQuestion, setSelectedQuestion] = useState<FAQItemFromAPI | null>(null)
  const [answerTyping, setAnswerTyping] = useState('')
  const [isTypingComplete, setIsTypingComplete] = useState(false)

  // Загрузка FAQ из API
  useEffect(() => {
    const loadFAQ = async () => {
      try {
        const res = await fetch(`/api/faq?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        })
        if (res.ok) {
          const items: FAQItemFromAPI[] = await res.json()
          const grouped = groupFAQIntoThemes(items)
          setThemes(grouped)
        }
      } catch (e) {
        console.error('[AIAssistant] Failed to load FAQ:', e)
      } finally {
        setLoading(false)
      }
    }
    loadFAQ()
    const ch = new BroadcastChannel('faq-updates')
    ch.onmessage = (e) => e.data?.type === 'FAQ_UPDATED' && loadFAQ()
    return () => ch.close()
  }, [])

  const openAssistant = useCallback(() => {
    setIsOpen(true)
    setView('themes')
    setSelectedTheme(null)
    setSelectedQuestion(null)
    setAnswerTyping('')
    setIsTypingComplete(false)
  }, [])

  useEffect(() => {
    const handler = () => openAssistant()
    window.addEventListener('open-ai-assistant', handler)
    return () => window.removeEventListener('open-ai-assistant', handler)
  }, [openAssistant])

  const closeAssistant = useCallback(() => {
    setIsOpen(false)
    setView('themes')
    setSelectedTheme(null)
    setSelectedQuestion(null)
  }, [])

  const selectTheme = useCallback((theme: GroupedTheme) => {
    setSelectedTheme(theme)
    setView('questions')
    setSelectedQuestion(null)
  }, [])

  const selectQuestion = useCallback(
    (question: FAQItemFromAPI) => {
      if (!selectedTheme) return
      setSelectedQuestion(question)
      setView('answer')
      setAnswerTyping('')
      setIsTypingComplete(false)
    },
    [selectedTheme]
  )

  const goBackToQuestions = useCallback(() => {
    setView('questions')
    setSelectedQuestion(null)
    setAnswerTyping('')
    setIsTypingComplete(false)
  }, [])

  const goBackToThemes = useCallback(() => {
    setSelectedTheme(null)
    setView('themes')
    setSelectedQuestion(null)
  }, [])

  // Typing effect for answer
  useEffect(() => {
    if (view !== 'answer' || !selectedQuestion) return
    const text = selectedQuestion.answer
    setAnswerTyping('')
    setIsTypingComplete(false)
    let i = 0
    const step = 2
    const delay = 18
    const timer = setInterval(() => {
      i += step
      if (i >= text.length) {
        setAnswerTyping(text)
        setIsTypingComplete(true)
        clearInterval(timer)
      } else {
        setAnswerTyping(text.slice(0, i))
      }
    }, delay)
    return () => clearInterval(timer)
  }, [view, selectedQuestion?.id])

  const followUps =
    selectedQuestion && selectedTheme
      ? getFollowUpQuestions(
          selectedQuestion.id,
          selectedTheme.questions,
          selectedTheme.questions
        )
      : []

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      <button
        onClick={openAssistant}
        aria-label="Открыть AI-помощника"
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 group flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full shadow-xl border-2 border-white/40 overflow-hidden transition-all duration-300 hover:scale-110 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-[#5C3825]/40"
        style={{
          background: 'linear-gradient(135deg, #2C1810 0%, #5C3825 50%, #3D2314 100%)',
          boxShadow: '0 8px 32px rgba(26, 15, 10, 0.35), 0 0 0 1px rgba(255,255,255,0.1)',
        }}
      >
        <span className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="relative flex items-center justify-center">
          <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white/95" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </span>
        <span className="absolute inset-0 rounded-full opacity-15 assistant-pulse" style={{ background: 'radial-gradient(circle, #F5F0E8 0%, transparent 70%)' }} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={closeAssistant} aria-hidden />
          <div
            className="relative w-full h-full sm:h-[85vh] sm:max-h-[800px] sm:max-w-2xl sm:rounded-3xl overflow-hidden flex flex-col bg-[#1A0F0A] shadow-2xl border border-white/20 assistant-panel-in"
            onClick={(e) => e.stopPropagation()}
          >
            <SparksEffect />
            <div className="relative z-10 flex-shrink-0 px-6 py-4 border-b border-white/20 bg-white/5 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20 border border-white/30">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-lg font-bold text-white font-lora">AI-помощник Печнойпроект</h2>
                    <p className="text-xs text-white/80 truncate max-w-[200px] sm:max-w-none">
                      {view === 'themes' && 'Выберите тему'}
                      {view === 'questions' && selectedTheme?.title}
                      {view === 'answer' && selectedQuestion?.question}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {(view === 'questions' || view === 'answer') && (
                    <button onClick={view === 'answer' ? goBackToQuestions : goBackToThemes} className="p-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors" aria-label="Назад">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                    </button>
                  )}
                  <button onClick={closeAssistant} className="p-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors" aria-label="Закрыть">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="relative z-10 flex-1 overflow-y-auto overscroll-contain p-6">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/50 border-t-transparent" />
                </div>
              ) : view === 'themes' ? (
                <div className="space-y-4">
                  <p className="text-sm text-white/80 mb-6">Выберите тему — ответы на частые вопросы из нашей базы</p>
                  {themes.length === 0 ? (
                    <p className="text-white/60 text-center py-8">Вопросов пока нет. Добавьте их в админ-панели.</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {themes.map((theme) => (
                        <button
                          key={theme.id}
                          onClick={() => selectTheme(theme)}
                          className="group flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/20 hover:bg-white/10 hover:border-white/30 transition-all duration-300 text-left"
                        >
                          <span className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-white/10 group-hover:bg-white/20 transition-colors">
                            {theme.icon}
                          </span>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-white font-lora mb-0.5">{theme.title}</h3>
                            <p className="text-sm text-white/70 line-clamp-2">{theme.description}</p>
                            <span className="inline-block mt-2 text-xs font-medium text-white/80 group-hover:translate-x-1 transition-transform">
                              {theme.questions.length} {theme.questions.length === 1 ? 'вопрос' : theme.questions.length < 5 ? 'вопроса' : 'вопросов'} →
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : view === 'questions' && selectedTheme ? (
                <div className="space-y-4">
                  <p className="text-sm text-white/80 mb-4">Нажмите на вопрос, чтобы получить ответ</p>
                  <div className="space-y-2">
                    {selectedTheme.questions.map((q) => (
                      <button
                        key={q.id}
                        onClick={() => selectQuestion(q)}
                        className="w-full flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-white/5 border border-white/20 hover:bg-white/10 hover:border-white/30 transition-all duration-200 text-left group"
                      >
                        <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white group-hover:bg-white/20 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </span>
                        <span className="font-medium text-white group-hover:text-white/90 text-sm sm:text-base line-clamp-2">{q.question}</span>
                        <svg className="w-4 h-4 text-white/50 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              ) : view === 'answer' && selectedQuestion ? (
                <div className="space-y-6">
                  <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/20 p-6">
                    <h3 className="text-lg font-semibold text-white font-lora mb-4">{selectedQuestion.question}</h3>
                    <div className="text-white/90 leading-relaxed">
                      {answerTyping}
                      {!isTypingComplete && <span className="inline-block w-2 h-4 ml-0.5 bg-white animate-pulse" style={{ verticalAlign: 'text-bottom' }} />}
                    </div>
                  </div>

                  {isTypingComplete && followUps.length > 0 && (
                    <div className="animate-fadeInUp">
                      <p className="text-sm font-medium text-white/80 mb-3">Узнать больше:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {followUps.map((fq) => (
                          <button
                            key={fq.id}
                            onClick={() => selectQuestion(fq)}
                            className="min-h-[48px] sm:min-h-[52px] px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 border border-white/30 text-white hover:bg-white/20 transition-all duration-200 text-left line-clamp-2"
                          >
                            {fq.question}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {isTypingComplete && (
                    <div className="pt-4 border-t border-white/20">
                      <p className="text-sm text-white/70 mb-3">Не нашли ответ? Свяжитесь с нами</p>
                      <button
                        onClick={() => {
                          closeAssistant()
                          window.dispatchEvent(new CustomEvent('open-callback-modal'))
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold bg-white text-[#1A0F0A] hover:bg-white/90 transition-all duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Заказать звонок
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
