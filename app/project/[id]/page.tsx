'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useFavoritesCompare } from '@/components/providers/FavoritesCompareProvider'

interface Project {
  id: string
  title: string
  variationGroupId?: string | null
  area: number
  priceFrom: number
  priceTo?: number
  floors: number
  material: string
  buildTime: number
  completion: string
  region: string
  image: string
  images?: string[]
  tags: string[]
  hasTerrasse?: boolean
  hasBath?: boolean
  hasGarage?: boolean
  features?: string[]
  description?: string
  advantages?: string[]
  technicalSpecs?: string
  specs?: {
    [key: string]: any
    completionOptions?: Array<{ label: string; price: number }>
    additionalOptions?: Array<{ label: string; price: number }>
  }
}

interface VariationItem {
  id: string
  slug: string
  title: string
  area: number
  priceFrom: number
  inStock?: boolean
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [selectedImage, setSelectedImage] = useState(0)
  const [variations, setVariations] = useState<VariationItem[]>([])
  const [variationsLoading, setVariationsLoading] = useState(false)
  const [sizePanelOpen, setSizePanelOpen] = useState(false)
  const [diameterPanelOpen, setDiameterPanelOpen] = useState(false)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isInCompare, setIsInCompare] = useState(false)
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [similar, setSimilar] = useState<any[]>([])
  const [selectedCompletion, setSelectedCompletion] = useState<string | null>(null)
  const [selectedLength, setSelectedLength] = useState<string | null>(null)
  const [selectedAdditionalOptions, setSelectedAdditionalOptions] = useState<string[]>([])
  const [projectOptions, setProjectOptions] = useState<{
    [categoryId: string]: {
      title: string
      options: Array<{ id: string; label: string; price: number; isDefault: boolean }>
    }
  } | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [selectedPricePanelValues, setSelectedPricePanelValues] = useState<Record<number, string>>({})
  const [pricePanelOpen, setPricePanelOpen] = useState<Record<number, boolean>>({})
  const [optionsVersion, setOptionsVersion] = useState(0)
  const [optionsInitialized, setOptionsInitialized] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Получаем ID товара
  const projectId = params?.id


  // На детальной странице проекта предотвращаем восстановление скролла браузером
  useEffect(() => {
    if (typeof window === 'undefined' || !projectId) return
    const prev = (history as any).scrollRestoration
    try { (history as any).scrollRestoration = 'manual' } catch {}
    window.scrollTo({ top: 0, behavior: 'auto' })
    return () => { try { (history as any).scrollRestoration = prev || 'auto' } catch {} }
  }, [projectId])

  useEffect(() => {
    if (!projectId) {
      setError('ID товара не указан')
      setLoading(false)
      return
    }

    const fetchProject = async () => {
      try {
        setLoading(true)
        setError(null)
        setSelectedImage(0) // Сбрасываем на главное фото при загрузке
        console.log('[PROJECT DETAIL] Fetching project:', projectId)
        
        // Добавляем cache: 'no-store' чтобы всегда получать свежие данные
        const response = await fetch(`/api/projects/${projectId}`, { 
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        if (!response.ok) {
          let errorText = 'Товар не найден. Возможно, он был удален.'
          try {
            const errorData = await response.json()
            errorText = errorData.error || errorData.details || errorText
            console.error('[PROJECT DETAIL] API error response:', errorData)
          } catch {
            errorText = `Ошибка ${response.status}: ${response.statusText}`
          }
          
          setError(errorText)
          // Предлагаем вернуться в каталог
          setTimeout(() => {
            if (window.confirm(`${errorText}\n\nВернуться в каталог?`)) {
              window.location.href = '/catalog'
            }
          }, 1000)
          return
        }
        
        let data
        try {
          data = await response.json()
        console.log('[PROJECT DETAIL] Loaded project data:', data)
        } catch (jsonError) {
          console.error('[PROJECT DETAIL] JSON parse error:', jsonError)
          throw new Error('Ошибка парсинга данных от сервера')
        }
        
        if (!data || !data.id || !data.title) {
          console.error('[PROJECT DETAIL] Invalid data structure:', data)
          throw new Error('Неполные данные проекта получены от сервера')
        }
        
        // Нормализуем specs
        if (!data.specs || typeof data.specs !== 'object') {
          data.specs = {}
        } else {
          if (data.specs.completionOptions && !Array.isArray(data.specs.completionOptions)) {
            data.specs.completionOptions = []
          }
          if (!data.specs.completionOptions) data.specs.completionOptions = []
          if (data.specs.lengthOptions && !Array.isArray(data.specs.lengthOptions)) {
            data.specs.lengthOptions = []
          }
          if (!data.specs.lengthOptions) data.specs.lengthOptions = []
          if (data.specs.additionalOptions && !Array.isArray(data.specs.additionalOptions)) {
            data.specs.additionalOptions = []
          }
          if (!data.specs.additionalOptions) data.specs.additionalOptions = []
          if (data.specs.pricePanels && !Array.isArray(data.specs.pricePanels)) {
            data.specs.pricePanels = []
          }
          if (!data.specs.pricePanels) data.specs.pricePanels = []
        }
        
        setProject(data)
        
        // По умолчанию выбираем бухту 100 м если есть lengthOptions
        if (data.specs?.lengthOptions?.length) {
          const baseOption = data.specs.lengthOptions.find((o: any) => o.price === 0)
          setSelectedLength(baseOption ? baseOption.label : data.specs.lengthOptions[0].label)
        } else {
          setSelectedLength(null)
        }

        // Инициализация панелей цен (pricePanels)
        if (data.specs?.pricePanels?.length) {
          const init: Record<number, string> = {}
          data.specs.pricePanels.forEach((p: any, i: number) => {
            const opts = p.options || []
            if (opts.length > 0 && opts[0].label) {
              init[i] = opts[0].label
            }
          })
          setSelectedPricePanelValues(init)
        }
        
        // Загружаем вариации (другие диаметры/размеры) если есть группа
        if (data.variationGroupId) {
          setVariationsLoading(true)
          try {
            const varRes = await fetch(`/api/projects?variationGroup=${encodeURIComponent(data.variationGroupId)}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } })
            if (varRes.ok) {
              const list = await varRes.json()
              const mapped = (list || []).map((p: any) => ({
                id: p.id || p.slug,
                slug: p.slug || p.id,
                title: p.title,
                area: p.area ?? 0,
                priceFrom: p.priceFrom ?? 0,
                inStock: p.inStock !== false
              })).sort((a: VariationItem, b: VariationItem) => a.area - b.area)
              setVariations(mapped)
            }
          } catch (e) {
            console.warn('[PROJECT DETAIL] Failed to load variations:', e)
          } finally {
            setVariationsLoading(false)
          }
        } else {
          setVariations([])
        }
        
        // Проверяем, есть ли опции конфигурации в specs товара
        // Поддерживаем как новую структуру (optionCategories), так и старую (finishing, insulation и т.д.)
        if (data.specs?.optionCategories && typeof data.specs.optionCategories === 'object') {
          // Новая структура: optionCategories
          const optionCategories: Record<string, { title: string; options: any[] }> = {}
          Object.entries(data.specs.optionCategories).forEach(([categoryId, category]: [string, any]) => {
            if (category && typeof category === 'object' && category.title && Array.isArray(category.options)) {
              optionCategories[categoryId] = {
                title: category.title,
                options: category.options
              }
            }
          })
          
          if (Object.keys(optionCategories).length > 0) {
            console.log('[PROJECT OPTIONS] Using new optionCategories structure:', optionCategories)
            setProjectOptions(optionCategories)
            
            // Устанавливаем значения по умолчанию
            const newSelectedOptions: Record<string, string> = {}
            Object.entries(optionCategories).forEach(([categoryId, category]) => {
              if (category.options && category.options.length > 0) {
                const defaultOption = category.options.find((o: any) => o.isDefault) || category.options[0]
                if (defaultOption) {
                  newSelectedOptions[categoryId] = defaultOption.label
                }
              }
            })
            setSelectedOptions(newSelectedOptions)
            setOptionsInitialized(true)
          }
        } else if (data.specs && (
          (data.specs.finishing && Array.isArray(data.specs.finishing) && data.specs.finishing.length > 0) ||
          (data.specs.insulation && Array.isArray(data.specs.insulation) && data.specs.insulation.length > 0) ||
          (data.specs.floor && Array.isArray(data.specs.floor) && data.specs.floor.length > 0) ||
          (data.specs.foundation && Array.isArray(data.specs.foundation) && data.specs.foundation.length > 0)
        )) {
          // Старая структура: finishing, insulation, floor, foundation
          // Конвертируем в новую структуру для обратной совместимости
          const optionCategories: Record<string, { title: string; options: any[] }> = {}
          
          if (data.specs.finishing && Array.isArray(data.specs.finishing) && data.specs.finishing.length > 0) {
            optionCategories.finishing = { title: 'Отделка', options: data.specs.finishing }
          }
          if (data.specs.insulation && Array.isArray(data.specs.insulation) && data.specs.insulation.length > 0) {
            optionCategories.insulation = { title: 'Утепление', options: data.specs.insulation }
          }
          if (data.specs.floor && Array.isArray(data.specs.floor) && data.specs.floor.length > 0) {
            optionCategories.floor = { title: 'Пол', options: data.specs.floor }
          }
          if (data.specs.foundation && Array.isArray(data.specs.foundation) && data.specs.foundation.length > 0) {
            optionCategories.foundation = { title: 'Фундамент', options: data.specs.foundation }
          }
          
          if (Object.keys(optionCategories).length > 0) {
            console.log('[PROJECT OPTIONS] Using old structure, converted to optionCategories:', optionCategories)
            setProjectOptions(optionCategories)
            
            // Устанавливаем значения по умолчанию
            const newSelectedOptions: Record<string, string> = {}
            Object.entries(optionCategories).forEach(([categoryId, category]) => {
              if (category.options && category.options.length > 0) {
                const defaultOption = category.options.find((o: any) => o.isDefault) || category.options[0]
                if (defaultOption) {
                  newSelectedOptions[categoryId] = defaultOption.label
                }
              }
            })
            setSelectedOptions(newSelectedOptions)
            setOptionsInitialized(true)
          }
        }
      } catch (err: any) {
        console.error('[PROJECT DETAIL] Error fetching project:', err)
        const errorMessage = err?.message || 'Ошибка загрузки товара'
        setError(errorMessage)
        
        // Если товар не найден - предлагаем вернуться в каталог
        if (err?.message?.includes('не найден') || err?.message?.includes('not found')) {
          setTimeout(() => {
            if (window.confirm('Товар не найден. Вернуться в каталог?')) {
              window.location.href = '/catalog'
            }
          }, 1000)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [projectId])

  // Загружаем опции товаров динамически (с автоматическим обновлением)
  // Используем только опции из товара, без fallback на глобальные
  useEffect(() => {
    if (!project) return
    
    let mounted = true
    
    const loadOptions = () => {
      try {
        // Получаем текущие опции товара (если есть)
        const projectCategories = project.specs?.optionCategories || {}
        
        // Формируем финальные опции: используем ТОЛЬКО опции из товара
        const finalOptions: Record<string, { title: string; options: any[] }> = {}
        
        // Проверяем категории из товара (новая структура)
        Object.entries(projectCategories).forEach(([categoryId, category]: [string, any]) => {
          if (category && typeof category === 'object' && category.title && Array.isArray(category.options) && category.options.length > 0) {
            finalOptions[categoryId] = {
              title: category.title,
              options: [...category.options]
            }
          }
        })
        
        // Для старых категорий (finishing, insulation и т.д.) проверяем, есть ли они в товаре
        const legacyCategories = ['finishing', 'insulation', 'floor', 'foundation']
        const legacyTitles: Record<string, string> = {
          finishing: 'Отделка',
          insulation: 'Утепление',
          floor: 'Пол',
          foundation: 'Фундамент'
        }
        
        legacyCategories.forEach(categoryId => {
          // Если категория уже есть в finalOptions, не перезаписываем
          if (finalOptions[categoryId]) return
          
          // Проверяем, есть ли опции в товаре (старая структура)
          const projectOptions = project.specs?.[categoryId]
          if (projectOptions && Array.isArray(projectOptions) && projectOptions.length > 0) {
            finalOptions[categoryId] = {
              title: legacyTitles[categoryId],
              options: [...projectOptions]
            }
          }
        })
        
        console.log('[PROJECT OPTIONS] Final options:', Object.keys(finalOptions))
        
        // Обновляем состояние ТОЛЬКО если есть опции из товара
        if (Object.keys(finalOptions).length > 0) {
          setProjectOptions(finalOptions)
          
          // Устанавливаем значения по умолчанию ТОЛЬКО при первой загрузке
          if (!optionsInitialized) {
            const newSelectedOptions: Record<string, string> = {}
            Object.entries(finalOptions).forEach(([categoryId, category]) => {
              if (category.options && category.options.length > 0) {
                const defaultOption = category.options.find((opt: any) => opt.isDefault) || category.options[0]
                if (defaultOption) {
                  newSelectedOptions[categoryId] = defaultOption.label
                }
              }
            })
            setSelectedOptions(newSelectedOptions)
            setOptionsInitialized(true)
          }
        } else {
          // Если нет опций из проекта, скрываем блок
          setProjectOptions(null)
        }
      } catch (err) {
        if (mounted) {
          console.error('[PROJECT OPTIONS] Error loading options:', err)
        }
      }
    }
    
    // Загружаем сразу
    loadOptions()
    
    return () => {
      mounted = false
    }
  }, [project, optionsInitialized])
  
  // Отдельный эффект для принудительного обновления при изменении данных
  useEffect(() => {
    if (projectOptions && Object.keys(projectOptions).length > 0) {
      const categoryKeys = Object.keys(projectOptions)
      const dataHash = JSON.stringify(projectOptions)
      const hashCode = dataHash.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0)
      console.log('[EFFECT] projectOptions changed. Categories:', categoryKeys, 'Hash:', hashCode)
      // Обновляем версию только один раз при изменении данных
      setOptionsVersion(hashCode)
    }
  }, [projectOptions])

  useEffect(() => {
    const loadSimilar = async () => {
      try {
        // Добавляем cache: 'no-store' чтобы всегда получать свежие данные
        const res = await fetch('/api/projects', { 
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        if (!res.ok) return
        const all = await res.json()
        const current = all.find((p: any) => p.id === projectId)
        const scored = all
          .filter((p: any) => p.id !== projectId)
          .map((p: any) => {
            let score = 0
            if (current) {
              if (p.material === current.material) score += 2
              if (p.region === current.region) score += 1
              if (p.floors === current.floors) score += 1
              const overlap = (p.tags || []).some((t: string) => (current.tags || []).includes(t))
              if (overlap) score += 1
              if (current.area && p.area) {
                const diff = Math.abs(p.area - current.area) / current.area
                if (diff <= 0.15) score += 1
              }
            }
            return { ...p, _score: score }
          })
          .filter((p: any) => p._score > 0)
          .sort((a: any, b: any) => b._score - a._score || (a.priceFrom ?? 0) - (b.priceFrom ?? 0))
          .slice(0, 6)
        setSimilar(scored)
      } catch {}
    }
    if (projectId) {
    loadSimilar()
    }
  }, [projectId])

  const formatPrice = (price: number) => {
    if (!price || typeof price !== 'number' || isNaN(price)) {
      console.warn('[PROJECT DETAIL] formatPrice: invalid price:', price)
      return '0 ₽'
    }
    // Показываем полную цену без округления
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽'
  }

  // Рассчитываем итоговую цену. Опционально: overridePanelIdx/overrideLabel — подставить выбор для панели (для отображения цены при наведении на опцию)
  const calculateTotalPrice = (overridePanelIdx?: number, overrideLabel?: string) => {
    if (!project) return 0
    const getSel = (idx: number) => (idx === overridePanelIdx && overrideLabel !== undefined ? overrideLabel : selectedPricePanelValues[idx])

    let total: number

    // Панели цен: главная цена + модификаторы
    const panels = project.specs?.pricePanels
    if (panels && panels.length > 0) {
      const mainPanel = panels.find((p: any) => p.isMainPrice)
      const mainPanelIdx = mainPanel != null ? panels.indexOf(mainPanel) : -1
      let base = project.priceFrom
      if (mainPanelIdx >= 0) {
        const mainSelected = getSel(mainPanelIdx)
        const mainOpt = mainPanel?.options?.find((o: any) => o.label === mainSelected)
        if (mainOpt && typeof mainOpt.price === 'number') base = mainOpt.price
      }
      total = base

      // Добавляем модификаторы из дополнительных панелей
      panels.forEach((p: any, idx: number) => {
        if (p.isMainPrice) return
        const sel = getSel(idx)
        const opt = p.options?.find((o: any) => o.label === sel)
        if (!opt || sel === undefined) return
        const mod = typeof opt.modifier === 'number' ? opt.modifier : 0
        if (p.modifierType === 'percent') {
          total += Math.round(total * mod / 100)
        } else {
          total += mod
        }
      })
    }
    // Длина (5м, 7м, 10м и т.д.): price 0 = базовая цена бухты, иначе цена за выбранный метраж
    else if (selectedLength && project.specs?.lengthOptions) {
      const lenOpt = project.specs.lengthOptions.find((o: any) => o.label === selectedLength)
      total = lenOpt ? (lenOpt.price === 0 ? project.priceFrom : lenOpt.price) : project.priceFrom
    } else if (selectedCompletion && project.specs?.completionOptions) {
      const completion = project.specs.completionOptions.find((opt: any) => opt.label === selectedCompletion)
      total = completion ? project.priceFrom + completion.price : project.priceFrom
    } else {
      total = project.priceFrom
    }
    
    // Добавляем цены выбранных дополнительных опций
    if (selectedAdditionalOptions.length > 0 && project.specs?.additionalOptions) {
      selectedAdditionalOptions.forEach((optLabel: string) => {
        const option = project.specs?.additionalOptions?.find((opt: any) => opt.label === optLabel)
        if (option) {
          total += option.price
        }
      })
    }
    
    // Добавляем цены выбранных опций конфигурации
    if (projectOptions) {
      Object.entries(projectOptions).forEach(([categoryId, category]) => {
        const selectedLabel = selectedOptions[categoryId]
        if (selectedLabel && category.options && Array.isArray(category.options)) {
          const option = category.options.find((opt: any) => opt.label === selectedLabel)
          if (option) {
            total += option.price
          }
        }
      })
    }
    
    return total
  }


  const handlePhone = () => {
    if (!project) return
    
    // Формируем сообщение для WhatsApp с данными товара
    let message = `🔧 ЗАПРОС ПО ТОВАРУ: ${project.title}\n\n`
    
    message += `📋 Параметры товара:\n`
    message += `• Название: ${project.title}\n`
    message += `• Диаметр: ${project.area} мм\n`
    message += `• Материал: ${project.material}\n`
    if (selectedLength) {
      message += `• Длина: ${selectedLength}\n`
    }
    if (project.specs?.pricePanels?.length) {
      project.specs.pricePanels.forEach((p: any, i: number) => {
        const sel = selectedPricePanelValues[i]
        if (sel && p.title) message += `• ${p.title}: ${sel}\n`
      })
    }
    if (selectedAdditionalOptions.length > 0) {
      message += `• Дополнительно: ${selectedAdditionalOptions.join(', ')}\n`
    }
    message += `\n`
    
    // Добавляем выбранные опции конфигурации, если есть
    if (projectOptions && Object.keys(projectOptions).length > 0) {
      const selectedOptionsText = Object.entries(selectedOptions)
        .map(([categoryId, optionLabel]) => {
          const category = projectOptions[categoryId]
          return `• ${category.title}: ${optionLabel}`
        })
        .join('\n')
      
      if (selectedOptionsText) {
        message += `\n🎨 Выбранные опции:\n${selectedOptionsText}\n`
      }
    }
    
    // Добавляем итоговую цену
    const totalPrice = calculateTotalPrice()
    message += `\n💰 Итоговая стоимость: ${formatPrice(totalPrice)}\n`
    message += `\n📞 Прошу связаться со мной для консультации и заказа!`
    
    // Открываем WhatsApp
    const whatsappNumber = '79313023008'
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const { favorites, addFavorite, removeFavorite } = useFavoritesCompare() as any
  // Используем project.id (который является slug) вместо params.id для избранного
  const favoriteId = project?.id || projectId
  const isFavorite = favorites?.includes(favoriteId)

  const handleLike = async () => {
    if (!favoriteId) return
    try {
      if (isFavorite) {
        await removeFavorite(favoriteId)
      } else {
        await addFavorite(favoriteId)
      }
    } catch (e) {
      console.error('Favorite toggle failed', e)
    }
  }

  const handleCompare = () => {
    setIsInCompare(!isInCompare)
    // TODO: Реализовать добавление в сравнение через API
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="pt-16 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A5F] mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка товара...</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (error || !project) {
    return (
      <>
        <Header />
        <main className="pt-16 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Товар не найден</h1>
            <p className="text-gray-600 mb-8">{error || 'Запрошенный товар не существует'}</p>
            <Link 
              href="/catalog"
              className="px-6 py-3 bg-[#1E3A5F] hover:bg-[#2C5282] text-white font-semibold rounded-xl transition-colors duration-200"
            >
              Вернуться в каталог
            </Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="pt-16">
        {/* Hero секция с галереей */}
        <section className="bg-[#fafaf8] py-8 sm:py-14">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
            {/* Хлебные крошки */}
            <nav className="mb-6 sm:mb-10" aria-label="Breadcrumb">
              <ol className="flex items-center flex-wrap gap-1.5 text-xs sm:text-sm text-gray-500 tracking-wide">
                <li><Link href="/" className="hover:text-gray-900 transition-colors">Главная</Link></li>
                <li className="text-gray-300">/</li>
                <li><Link href="/catalog" className="hover:text-gray-900 transition-colors">Каталог</Link></li>
                <li className="text-gray-300">/</li>
                <li className="text-gray-900 font-medium truncate max-w-[120px] sm:max-w-none">{project.title}</li>
              </ol>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16">
              {/* Галерея */}
              <div className="space-y-4">
                <div className="relative aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08),0_8px_48px_-8px_rgba(0,0,0,0.04)]">
                  <Image
                    src={(() => {
                      // Всегда включаем главное фото первым в галерею
                      const allImages = [project.image, ...(project.images || [])].filter(Boolean)
                      return allImages[selectedImage] || project.image
                    })()}
                    alt={project.title}
                    fill
                    className="object-cover cursor-pointer"
                    onClick={() => setIsLightboxOpen(true)}
                    priority
                    quality={90}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  {(() => {
                    const allImages = [project.image, ...(project.images || [])].filter(Boolean)
                    return allImages
                  })().map((img, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
                        selectedImage === index 
                          ? 'ring-2 ring-[#1E3A5F] ring-offset-2 shadow-lg' 
                          : 'opacity-75 hover:opacity-100 hover:shadow-md'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${project.title} ${index + 1}`}
                        fill
                        className="object-cover"
                        loading="lazy"
                        quality={80}
                        sizes="(max-width: 1024px) 25vw, 12.5vw"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Информация о товаре */}
              <div>
                <h1 className="font-lora text-2xl sm:text-3xl lg:text-[2rem] font-semibold text-gray-900 tracking-tight mb-6 leading-tight">{project.title}</h1>

                {/* 1. Характеристики — первый блок, данные обновляются при выборе из панелей */}
                {(() => {
                  const map = project.specs?.fieldPanelMap || {}
                  const charArea = map.area != null ? (selectedPricePanelValues[map.area] ?? project.area) : project.area
                  const charMaterial = map.material != null ? (selectedPricePanelValues[map.material] ?? project.material) : project.material
                  const charLength = map.buildTime != null ? (selectedPricePanelValues[map.buildTime] ?? selectedLength) : selectedLength
                  return (
                <div className="rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6 mb-4 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06)]">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Характеристики</h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">Диаметр</div>
                      <div className="text-base font-semibold text-gray-900">{charArea}{!isNaN(Number(charArea)) && String(charArea).trim() !== '' ? ' мм' : ''}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">Материал</div>
                      <div className="text-base font-semibold text-gray-900 capitalize">{charMaterial}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">Длина</div>
                      <div className="text-base font-semibold text-gray-900">{charLength || '—'}{charLength && !isNaN(Number(charLength)) ? ' м' : ''}</div>
                    </div>
                  </div>
                </div>
                  )
                })()}

                {/* 2. Размер — раскрывающаяся панель, длина трубы */}
                {/* Панели цен (главная цена + доплаты) */}
                {project.specs?.pricePanels && project.specs.pricePanels.length > 0 && (
                  <div className="space-y-4 mb-4">
                    {project.specs.pricePanels.map((panel: any, pIdx: number) => {
                      const isOpen = pricePanelOpen[pIdx] ?? false
                      const selectedLabel = selectedPricePanelValues[pIdx] ?? ''
                      const opts = panel.options || []
                      return (
                        <div key={pIdx} className={`rounded-2xl overflow-hidden transition-all ${selectedLabel ? 'border-2 border-[#1E3A5F]/30 shadow-[0_2px_20px_-4px_rgba(30,58,95,0.12)]' : 'border border-gray-200/80 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06)]'} bg-white`}>
                          <button
                            type="button"
                            onClick={() => setPricePanelOpen(prev => ({ ...prev, [pIdx]: !prev[pIdx] }))}
                            className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${selectedLabel ? 'hover:bg-[#1E3A5F]/5' : 'hover:bg-gray-50/50'}`}
                          >
                            <span className="font-medium text-gray-900">
                              {panel.title || 'Панель'}
                              {selectedLabel && <span className="text-gray-500 font-normal">: {selectedLabel}</span>}
                            </span>
                            <svg className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {isOpen && opts.length > 0 && (
                            <div className="border-t border-gray-100 px-5 py-4 space-y-1">
                              {opts.map((opt: any, oIdx: number) => {
                                const label = String(opt.label || '')
                                const isSelected = selectedLabel === label
                                let displayPrice = ''
                                if (panel.isMainPrice) {
                                  // Главная цена: показываем сумму из опции
                                  const p = typeof opt.price === 'number' ? opt.price : 0
                                  displayPrice = formatPrice(p)
                                } else {
                                  // Доп. панель: показываем итоговую посчитанную сумму (без +/-)
                                  const totalForOption = calculateTotalPrice(pIdx, label)
                                  displayPrice = formatPrice(totalForOption)
                                }
                                return (
                                  <label
                                    key={oIdx}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${isSelected ? 'bg-[#1E3A5F]/5 border border-[#1E3A5F]/20' : 'hover:bg-gray-50 border border-transparent'}`}
                                  >
                                    <input
                                      type="radio"
                                      name={`pricePanel-${pIdx}`}
                                      className="w-4 h-4 text-[#1E3A5F]"
                                      checked={isSelected}
                                      onChange={() => setSelectedPricePanelValues(prev => ({ ...prev, [pIdx]: label }))}
                                    />
                                    <span className="flex-1 text-gray-900">{label}</span>
                                    <span className="text-sm font-semibold text-gray-700">{displayPrice}</span>
                                  </label>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {project.specs?.lengthOptions && project.specs.lengthOptions.length > 0 && !project.specs?.pricePanels?.length && (
                  <div className="rounded-2xl border border-gray-200/80 bg-white mb-4 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06)] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setSizePanelOpen(!sizePanelOpen)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
                    >
                      <span className="font-medium text-gray-900">Размер</span>
                      <span className="text-sm text-gray-600">{selectedLength || 'Выберите длину'}</span>
                      <svg className={`w-5 h-5 text-gray-400 transition-transform ${sizePanelOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {sizePanelOpen && (
                      <div className="border-t border-gray-100 px-5 py-4 space-y-1">
                        {project.specs.lengthOptions.map((opt: any, idx: number) => {
                          if (!opt || typeof opt !== 'object') return null
                          const label = String(opt.label || '')
                          const price = typeof opt.price === 'number' ? opt.price : 0
                          const inStock = opt.inStock !== false
                          const isSelected = selectedLength === label
                          const displayPrice = price === 0 ? formatPrice(project.priceFrom) : formatPrice(price)
                          return (
                            <label
                              key={idx}
                              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${!inStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${isSelected && inStock ? 'bg-[#1E3A5F]/5 border border-[#1E3A5F]/20' : inStock ? 'hover:bg-gray-50 border border-transparent' : ''}`}
                            >
                              <input type="radio" name="length" className="w-4 h-4 text-[#1E3A5F]" checked={isSelected} disabled={!inStock} onChange={() => inStock && setSelectedLength(label)} />
                              <span className="flex-1 text-gray-900">{label}</span>
                              {!inStock && <span className="text-xs text-red-500">Нет в наличии</span>}
                              {inStock && <span className="text-sm font-semibold text-gray-700">{displayPrice}</span>}
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Диаметр — раскрывающаяся панель, все диаметры этой трубы */}
                {(variations.length > 1 || variationsLoading) && (
                  <div className="rounded-2xl border border-gray-200/80 bg-white mb-4 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06)] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setDiameterPanelOpen(!diameterPanelOpen)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
                    >
                      <span className="font-medium text-gray-900">Диаметр</span>
                      <span className="text-sm text-gray-600">{project.area} мм</span>
                      <svg className={`w-5 h-5 text-gray-400 transition-transform ${diameterPanelOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {diameterPanelOpen && (
                      <div className="border-t border-gray-100 px-5 py-4 space-y-1">
                        {variationsLoading ? (
                          <div className="py-4 text-gray-400 text-sm">Загрузка...</div>
                        ) : (
                          variations.map((v) => {
                            const inStock = v.inStock !== false
                            const isCurrent = v.slug === project.id
                            return (
                              <button
                                key={v.slug}
                                type="button"
                                disabled={!inStock}
                                onClick={() => inStock && v.slug !== project.id && router.push(`/project/${v.slug}`)}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left ${!inStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'} ${isCurrent ? 'bg-[#1E3A5F]/5 border border-[#1E3A5F]/20' : ''}`}
                              >
                                <span className="text-gray-900">{v.area} мм</span>
                                <span className="flex items-center gap-2">
                                  {!inStock && <span className="text-xs text-red-500">Нет в наличии</span>}
                                  <span className="text-sm font-semibold text-gray-700">от {formatPrice(v.priceFrom)}</span>
                                </span>
                              </button>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Комплектация (для товаров без lengthOptions) */}
                {project.specs?.completionOptions && project.specs.completionOptions.length > 0 && !project.specs?.lengthOptions?.length && (
                  <div className="rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6 mb-4 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06)]">
                    <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 block">Комплектация</h2>
                    <div className="space-y-1">
                      {project.specs.completionOptions.map((opt: any, idx: number) => {
                        if (!opt || typeof opt !== 'object') return null
                        const label = String(opt.label || '')
                        const price = typeof opt.price === 'number' ? opt.price : 0
                        const isSelected = selectedCompletion === label
                        return (
                          <label key={idx} className={`flex items-center cursor-pointer gap-3 px-4 py-3 rounded-xl transition-all ${isSelected ? 'bg-[#1E3A5F]/5 border border-[#1E3A5F]/20' : 'hover:bg-gray-50 border border-transparent'}`}>
                            <input type="radio" name="completion" className="w-4 h-4 text-[#1E3A5F]" checked={isSelected} onChange={() => setSelectedCompletion(label)} />
                            <span className="flex-1 text-gray-900">{label}</span>
                            <span className="text-sm font-semibold text-gray-700">{price > 0 ? `+${formatPrice(price)}` : 'Включено'}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Дополнительные опции */}
                {project.specs?.additionalOptions && project.specs.additionalOptions.length > 0 && (
                  <div className="rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6 mb-4 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06)]">
                    <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 block">Дополнительные опции</h2>
                    <div className="space-y-1">
                      {project.specs.additionalOptions.map((opt: any, idx: number) => {
                        if (!opt || typeof opt !== 'object') return null
                        const label = String(opt.label || '')
                        const price = typeof opt.price === 'number' ? opt.price : 0
                        const isChecked = selectedAdditionalOptions.includes(label)
                        return (
                          <label key={idx} className={`flex items-center cursor-pointer gap-3 px-4 py-3 rounded-xl transition-all ${isChecked ? 'bg-[#1E3A5F]/5 border border-[#1E3A5F]/20' : 'hover:bg-gray-50 border border-transparent'}`}>
                            <input type="checkbox" className="w-4 h-4 rounded text-[#1E3A5F]" checked={isChecked} onChange={(e) => {
                              if (e.target.checked) setSelectedAdditionalOptions([...selectedAdditionalOptions, label])
                              else setSelectedAdditionalOptions(selectedAdditionalOptions.filter((l: string) => l !== label))
                            }} />
                            <span className="flex-1 text-gray-900">{label}</span>
                            <span className="text-sm font-semibold text-gray-700">+{formatPrice(price)}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Динамические опции (optionCategories) */}
                {projectOptions && Object.keys(projectOptions).length > 0 && (
                  <div className="rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6 mb-4 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06)]">
                    {Object.entries(projectOptions).map(([categoryId, category]) => (
                      <div key={categoryId} className="mb-4 last:mb-0">
                        <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 block">{category.title}</h2>
                        <div className="space-y-1">
                          {category.options?.map((opt: any) => (
                            <label key={opt.id || opt.label} className={`flex items-center cursor-pointer gap-3 px-4 py-3 rounded-xl transition-all ${selectedOptions[categoryId] === opt.label ? 'bg-[#1E3A5F]/5 border border-[#1E3A5F]/20' : 'hover:bg-gray-50 border border-transparent'}`}>
                              <input type="radio" name={`opt-${categoryId}`} className="w-4 h-4 text-[#1E3A5F]" checked={selectedOptions[categoryId] === opt.label} onChange={() => setSelectedOptions(prev => ({ ...prev, [categoryId]: opt.label }))} />
                              <span className="flex-1 text-gray-900">{opt.label}</span>
                              <span className="text-sm font-semibold text-gray-700">{opt.price > 0 ? `+${formatPrice(opt.price)}` : '0'}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Теги */}
                {project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.tags.map((tag, index) => (
                      <span key={index} className="px-3 py-1 rounded-lg text-xs font-medium text-gray-600 bg-gray-100/80">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Итоговая цена */}
                <div className="rounded-2xl bg-gray-900 text-white p-5 sm:p-6 mb-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.15)]">
                  <div className="text-xs font-medium uppercase tracking-wider text-white/70 mb-1">Итого</div>
                  <div className="text-2xl sm:text-3xl font-semibold tracking-tight">
                    {formatPrice(calculateTotalPrice())}
                  </div>
                </div>

                {/* Кнопка действий */}
                <div className="space-y-3">
                  <button
                    onClick={handlePhone}
                    className="block w-full px-6 py-4 bg-[#1E3A5F] hover:bg-[#152a47] text-white font-semibold rounded-xl text-center transition-all duration-200 shadow-[0_2px_12px_-2px_rgba(30,58,95,0.4)] hover:shadow-[0_4px_20px_-2px_rgba(30,58,95,0.5)]"
                  >
                    Заказать звонок
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={handleLike}
                      className="flex-1 px-4 py-3.5 border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 font-medium rounded-xl flex items-center justify-center gap-2 transition-all duration-200"
                    >
                      <svg
                        className={`w-5 h-5 ${isFavorite ? 'fill-[#1E3A5F]' : 'fill-none'}`}
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                      {isFavorite ? 'В избранном' : 'В избранное'}
                    </button>
                    
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Описание — общее или по выбранному варианту главной цены */}
        {(() => {
          const descPanelIdx = project.specs?.descriptionPanelIdx
          let descText = project.description || ''
          if (descPanelIdx != null && project.specs?.pricePanels?.[descPanelIdx]) {
            const sel = selectedPricePanelValues[descPanelIdx]
            const opt = project.specs.pricePanels[descPanelIdx].options?.find((o: any) => o.label === sel)
            if (opt?.description?.trim()) descText = opt.description
          }
          return descText ? (
            <section className="py-12 sm:py-16 bg-white">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="font-lora text-xl font-semibold text-gray-900 mb-4 tracking-tight">Описание</h2>
                <p className="text-gray-600 leading-relaxed">{descText}</p>
              </div>
            </section>
          ) : null
        })()}

        {/* Технические характеристики — общие или по выбранному варианту главной цены */}
        {(() => {
          const specPanelIdx = project.specs?.technicalSpecsPanelIdx
          let specText = project.technicalSpecs || ''
          if (specPanelIdx != null && project.specs?.pricePanels?.[specPanelIdx]) {
            const sel = selectedPricePanelValues[specPanelIdx]
            const opt = project.specs.pricePanels[specPanelIdx].options?.find((o: any) => o.label === sel)
            if (opt?.technicalSpecs?.trim()) specText = opt.technicalSpecs
          }
          return specText ? (
            <section className="py-12 sm:py-16 bg-[#fafaf8]">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="font-lora text-xl font-semibold text-gray-900 mb-4 tracking-tight">Технические характеристики</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{specText}</p>
              </div>
            </section>
          ) : null
        })()}

        {/* Преимущества */}
        {project.advantages && project.advantages.length > 0 && (
          <section className="py-12 sm:py-16 bg-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="font-lora text-xl font-semibold text-gray-900 mb-6 tracking-tight">Преимущества товара</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {project.advantages.map((advantage, index) => (
                  <div key={index} className="rounded-xl border border-gray-200/80 bg-white p-5 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] transition-shadow duration-200">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-9 h-9 bg-gray-900 text-white rounded-lg flex items-center justify-center font-semibold text-sm">
                        {index + 1}
                      </div>
                      <p className="text-gray-600 leading-relaxed pt-0.5">{advantage}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Блок выбора опций конфигурации */}
        {projectOptions && Object.keys(projectOptions).length > 0 && (
        <section id="project-options-block" className="py-4 sm:py-6 md:py-8 bg-white" key={`section-options-v${optionsVersion}`}>
          <div className="max-w-4xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Дополнительные опции</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Выберите дополнительные опции для вашего заказа</p>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4 md:p-6" key={`options-v${optionsVersion}`}>
              {/* Рендерим категории динамически */}
              {Object.entries(projectOptions).map(([categoryId, category]) => (
                <div key={categoryId} className="mb-3 sm:mb-4 md:mb-5">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">{category.title}</h3>
                  <div className="space-y-1.5 sm:space-y-2">
                    {category.options && category.options.length > 0 ? (
                      category.options.map((opt: any) => (
                        <label key={opt.id || opt.label} className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`option-${categoryId}`}
                            className="w-4 h-4 sm:w-5 sm:h-5 text-[#1E3A5F] focus:ring-[#1E3A5F]"
                            checked={selectedOptions[categoryId] === opt.label}
                            onChange={() => setSelectedOptions(prev => ({ ...prev, [categoryId]: opt.label }))}
                          />
                          <span className="ml-2 sm:ml-3 text-gray-900 flex-1 text-sm sm:text-base">{opt.label}</span>
                          <span className="text-base sm:text-lg font-semibold text-gray-900 whitespace-nowrap">
                            {opt.price > 0 ? `+${formatPrice(opt.price)}` : '0'}
                          </span>
                        </label>
                      ))
                    ) : (
                      <div className="text-xs sm:text-sm text-gray-500 italic">Нет доступных опций</div>
                    )}
                  </div>
                </div>
              ))}

              {/* Итог перед кнопками */}
              <div className="mt-4 sm:mt-6 md:mt-8 pt-4 sm:pt-5 md:pt-6 border-t border-gray-200">
                <div className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">Итого</div>
                <div className="text-2xl sm:text-3xl font-bold text-[#1E3A5F]">
                  {formatPrice(calculateTotalPrice())}
                </div>
              </div>

              {/* Кнопка */}
              <div className="space-y-2 sm:space-y-3 md:space-y-4 pt-3 sm:pt-4">
                <button
                  onClick={handlePhone}
                  className="block w-full px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 border-2 border-[#1E3A5F] text-[#1E3A5F] hover:bg-[#1E3A5F] hover:text-white font-semibold rounded-xl text-sm sm:text-base md:text-lg transition-colors duration-200"
                >
                  Заказать звонок
                </button>
              </div>
              </div>
            </div>
          </section>
        )}

        {/* CTA секция */}
        <section className="py-16 sm:py-20 bg-gray-900">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="font-lora text-2xl sm:text-3xl font-semibold text-white mb-3 tracking-tight">Заинтересовал товар?</h2>
            <p className="text-gray-400 mb-8">Свяжитесь с нами для консультации</p>
            <button 
              onClick={handlePhone}
              className="px-8 py-4 bg-white text-gray-900 hover:bg-gray-100 font-semibold rounded-xl transition-all duration-200"
            >
              Заказать звонок
            </button>
          </div>
        </section>
        {/* Похожие товары */}
        {similar.length > 0 && (
          <section className="py-12 sm:py-16 bg-[#fafaf8]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-8 text-center">
                <h2 className="font-lora text-xl font-semibold text-gray-900 mb-2 tracking-tight">Похожие товары</h2>
                <p className="text-sm text-gray-500">Вам также может подойти</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {similar.map((p: any) => (
                  <a key={p.id} href={`/project/${p.id}`} className="group rounded-2xl border border-gray-200/80 overflow-hidden bg-white hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] transition-all duration-300">
                    <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                      <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      {(p.tags?.slice(0,1) || []).map((tag: string, i: number) => (
                        <span key={i} className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold bg-black/60 text-white">{tag}</span>
                      ))}
                    </div>
                    <div className="p-3 sm:p-4 md:p-5">
                      <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2">
                        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 line-clamp-2 flex-1">{p.title}</h3>
                        <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap ml-2">{p.area} мм</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm sm:text-base text-[#1E3A5F] font-bold">
                          {`от ${new Intl.NumberFormat('ru-RU').format(p.priceFrom)} ₽`}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">{p.material}</div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  )
}
