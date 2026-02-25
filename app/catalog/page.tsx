'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import CatalogFilters from '../../components/CatalogFilters'
import CatalogGrid from '../../components/CatalogGrid'
import CatalogSortBar from '../../components/CatalogSortBar'
import MobileFilters from '../../components/MobileFilters'
import Header from '@/components/Header'
import Footer from '../../components/Footer'
import CatalogSeoText from '@/components/CatalogSeoText'

// Типы для проектов
interface House {
  id: string
  title: string
  area: number
  price: number
  floors: number
  material: 'каркасный' | 'SIP' | 'комбинированный'
  completion: 'под ключ' | 'тёплый контур' | 'коробка'
  buildTime: number
  region: string
  image: string
  tags: string[]
  hasTerrasse?: boolean
  hasBath?: boolean
  hasGarage?: boolean
  features?: string[]
  filterValues?: Record<string, any> // Значения для динамических фильтров
}

interface FilterState {
  priceRange: [number, number]
  areaRange: [number, number]
  material: string[]
  buildTime: string[]
  features: string[]
  searchQuery: string
  [key: string]: any // Поддержка динамических фильтров
}

interface SortState {
  field: 'price' | 'new'
  direction: 'asc' | 'desc'
}

function CatalogPageContent() {
  const searchParams = useSearchParams()
  const subsectionId = searchParams.get('subsectionId')
  const subsubsectionId = searchParams.get('subsubsectionId')
  const sectionId = searchParams.get('sectionId')
  const catalogFilter = subsubsectionId || subsectionId || sectionId

  const [houses, setHouses] = useState<House[]>([])
  const [filteredHouses, setFilteredHouses] = useState<House[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [isFiltersVisible, setIsFiltersVisible] = useState(true)
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [visibleCount, setVisibleCount] = useState(9)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [isSticky, setIsSticky] = useState(false)
  const [isFading, setIsFading] = useState(false) // Для плавного ухода
  const [isCompact, setIsCompact] = useState(false) // Для размера панели
  const [headerOffsetTop, setHeaderOffsetTop] = useState(0)
  const [headerHeight, setHeaderHeight] = useState(0)
  const [topOffset, setTopOffset] = useState(64) // Начальное значение = высота хедера
  const [catalogHeaderHeight, setCatalogHeaderHeight] = useState(64)
  
  // Загрузка проектов: при ?subsection= только этот подраздел, иначе все + популярные
  useEffect(() => {
    const fetchProjects = async () => {
      // Добавляем проверку существования проектов и фильтрацию удаленных
      const validateProjects = async (projects: any[]) => {
        const validatedProjects: any[] = []
        for (const project of projects) {
          try {
            const response = await fetch(`/api/projects/${project.id}`, { 
              method: 'HEAD',
              cache: 'no-store',
              headers: { 'Cache-Control': 'no-cache' }
            })
            if (response.ok) {
              validatedProjects.push(project)
            }
          } catch (error) {
            // В случае ошибки все равно добавляем проект (чтобы не терять все проекты из-за сетевой ошибки)
            console.warn(`Project ${project.id} validation failed:`, error)
            validatedProjects.push(project)
          }
        }
        return validatedProjects
      }
      try {
        setIsLoadingProjects(true)

        // Если открыт каталог по подразделу подраздела, подразделу или разделу — загружаем только эти проекты
        if (subsubsectionId || subsectionId || sectionId) {
          const param = subsubsectionId
            ? `subsubsectionId=${encodeURIComponent(subsubsectionId)}`
            : subsectionId
              ? `subsectionId=${encodeURIComponent(subsectionId)}`
              : `sectionId=${encodeURIComponent(sectionId!)}`
          const url = `/api/projects?${param}`
          const res = await fetch(url, { cache: 'no-store' })
          if (!res.ok) {
            setHouses([])
            setFilteredHouses([])
            return
          }
          let data = await res.json()
          const converted: House[] = (data || []).map((p: any) => ({
            id: p.id,
            title: p.title,
            area: p.area,
            price: p.priceFrom ?? 0,
            floors: p.floors ?? 1,
            material: (p.material || 'каркасный') as House['material'],
            completion: (p.completion || 'под ключ') as House['completion'],
            buildTime: p.buildTime ?? 30,
            region: p.region || '',
            image: p.image || '/images/house.jpg',
            tags: p.tags || [],
            hasTerrasse: p.hasTerrasse ?? false,
            hasBath: p.hasBath ?? false,
            hasGarage: p.hasGarage ?? false,
            features: p.features || [],
            filterValues: (p.filterValues && typeof p.filterValues === 'object') ? p.filterValues : {}
          }))
          setHouses(converted)
          setFilteredHouses(converted)
          return
        }
        
        // Загружаем популярные проекты (когда подраздел не выбран)
        let allProjects: any[] = []
        try {
          const popularResponse = await fetch('/api/popular', { cache: 'no-store' })
          if (popularResponse.ok) {
            const panels = await popularResponse.json()
            const allPopularItems = panels.flatMap((panel: any) => panel.items || [])
            
            if (allPopularItems.length > 0) {
              // Загружаем все обычные проекты для подтягивания недостающих данных
              const projectsResponse = await fetch('/api/projects', { cache: 'no-store' })
              let allProjectsData: any[] = []
              if (projectsResponse.ok) {
                allProjectsData = await projectsResponse.json()
              }
              
              // Обрабатываем все популярные проекты
              const popularProjectsWithMergedData = allPopularItems
                .map((item: any) => {
                  // Если есть связь с реальным проектом - подтягиваем недостающие данные
                  if (item.projectSlug) {
                    const realProject = allProjectsData.find((p: any) => p.id === item.projectSlug)
                    if (realProject) {
                      // Используем кастомные данные из PopularItem (если есть), недостающие - из основного проекта
                      // ВАЖНО: Используем projectSlug как ID, а не UUID популярного элемента
                      return {
                        id: item.projectSlug, // Используем slug реального проекта, не UUID
                        title: item.title || realProject.title,
                        area: item.area || realProject.area,
                        priceFrom: item.priceFrom || realProject.priceFrom,
                        priceTo: item.priceTo ?? realProject.priceTo,
                        floors: item.floors ?? realProject.floors ?? 1,
                        material: item.material || realProject.material,
                        buildTime: item.buildTime ?? realProject.buildTime ?? 30,
                        completion: item.completion || realProject.completion || 'под ключ',
                        region: item.region || realProject.region || '',
                        image: item.image || realProject.image,
                        images: item.images || realProject.images || [],
                        tags: item.tags || realProject.tags || [],
                        hasTerrasse: item.hasTerrasse ?? realProject.hasTerrasse ?? false,
                        hasBath: item.hasBath ?? realProject.hasBath ?? false,
                        hasGarage: item.hasGarage ?? realProject.hasGarage ?? false,
                        features: item.features || realProject.features || [],
                        filterValues: realProject.filterValues || item.filterValues || null, // Добавляем filterValues
                        specs: item.specs || realProject.specs || null, // Добавляем specs для бытовок
                        isPopular: true,
                        projectSlug: item.projectSlug
                      }
                    }
                    // Если связанный проект не найден в обычных - используем данные из PopularItem
                    // Генерируем slug для популярного проекта (связанный проект удален)
                    console.warn(`[CATALOG] Linked project ${item.projectSlug} not found, generating slug for PopularItem`)
                  }
                  
                  // Если нет связи с реальным проектом ИЛИ связанный проект не найден - генерируем slug
                  // Генерируем уникальный slug на основе названия или используем существующий
                  const generateSlug = (title: string, itemId: string) => {
                    // Преобразуем название в slug
                    const baseSlug = title
                      .toLowerCase()
                      .replace(/[^a-zа-яё0-9]+/g, '-')
                      .replace(/^-+|-+$/g, '')
                      .substring(0, 50)
                    return `${baseSlug}-${itemId.substring(0, 8)}`
                  }
                  
                  // Если slug не задан - генерируем его (будет сохранен на сервере при первом использовании)
                  const projectSlug = item.slug || generateSlug(item.title, item.id)
                  
                  return {
                    id: projectSlug,
                    title: item.title,
                    area: item.area,
                    priceFrom: item.priceFrom,
                    priceTo: item.priceTo || null,
                    floors: item.floors ?? 1,
                    material: item.material || 'каркасный',
                    buildTime: item.buildTime ?? 30,
                    completion: item.completion || 'под ключ',
                    region: item.region || '',
                    image: item.image || '/images/1.png',
                    images: item.images || [],
                    tags: item.tags || [],
                    hasTerrasse: item.hasTerrasse ?? false,
                    hasBath: item.hasBath ?? false,
                    hasGarage: item.hasGarage ?? false,
                    features: item.features || [],
                    filterValues: item.filterValues || null, // Добавляем filterValues
                    specs: item.specs || null, // Добавляем specs для бытовок
                    isPopular: true,
                    projectSlug: item.projectSlug
                  }
                })
                .filter(Boolean) // Убираем null/undefined
              
              allProjects = [...popularProjectsWithMergedData]
              console.log('[CATALOG] Loaded popular projects:', allProjects.length)
            }
          }
        } catch (err) {
          console.error('Error loading popular projects:', err)
        }
        
        // Загружаем обычные проекты (только если еще не загрузили их выше для популярных)
        try {
          const response = await fetch('/api/projects', { cache: 'no-store' })
          if (response.ok) {
            const data = await response.json()
            // Проверяем, чтобы не дублировать проекты (если они уже есть в популярных)
            const popularSlugs = new Set(allProjects.map(p => p.id || p.projectSlug).filter(Boolean))
            const regularProjects = data
              .filter((project: any) => !popularSlugs.has(project.id)) // Убираем дубликаты
              .map((project: any) => ({
                id: project.id,
                title: project.title,
                area: project.area,
                priceFrom: project.priceFrom,
                priceTo: project.priceTo,
                floors: project.floors,
                material: project.material,
                completion: project.completion,
                buildTime: project.buildTime,
                region: project.region,
                image: project.image, // API уже возвращает правильное изображение
                tags: project.tags || [],
                hasTerrasse: project.hasTerrasse || false,
                hasBath: project.hasBath || false,
                hasGarage: project.hasGarage || false,
                features: project.features || [],
                filterValues: project.filterValues || null, // Добавляем filterValues
                specs: project.specs || null, // Добавляем specs для бытовок
                isPopular: false
              }))
            allProjects = [...allProjects, ...regularProjects]
          }
        } catch (err) {
          console.error('Error loading regular projects:', err)
        }
        
        // Функция для определения, является ли проект бытовкой
        const isBytovka = (project: any): boolean => {
          // Проверяем filterValues
          const filterValues = (project.filterValues && typeof project.filterValues === 'object') ? project.filterValues : {}
          
          // Проверяем все возможные ключи в filterValues для типа конструкции
          // Особенно проверяем ключ "Build" (с заглавной буквы)
          for (const [key, value] of Object.entries(filterValues)) {
            // Проверяем строку
            if (typeof value === 'string') {
              const normalized = value.toLowerCase()
              if (normalized.includes('бытовк') || normalized.includes('bytovk')) {
                console.log('[BYTOVKA CHECK] Found by filterValues string:', key, value)
                return true
              }
            }
            // Проверяем массив
            if (Array.isArray(value)) {
              const hasBytovka = value.some((v: any) => {
                if (typeof v === 'string') {
                  const normalized = v.toLowerCase()
                  return normalized.includes('бытовк') || normalized.includes('bytovk')
                }
                return false
              })
              if (hasBytovka) {
                console.log('[BYTOVKA CHECK] Found by filterValues array:', key, value)
                return true
              }
            }
          }
          
          // Проверяем tags
          if (Array.isArray(project.tags)) {
            if (project.tags.some((tag: string) => 
              typeof tag === 'string' && (tag.toLowerCase().includes('бытовк') || tag.toLowerCase().includes('bytovk'))
            )) {
              console.log('[BYTOVKA CHECK] Found by tags:', project.tags)
              return true
            }
          }
          
          // Проверяем title (на случай если в названии есть "бытовка")
          if (project.title && typeof project.title === 'string' && 
              (project.title.toLowerCase().includes('бытовк') || project.title.toLowerCase().includes('bytovk'))) {
            console.log('[BYTOVKA CHECK] Found by title:', project.title)
            return true
          }
          
          return false
        }
        
        // Функция для вычисления минимальной цены из дополнительных опций
        // Для бытовок в каталоге: берем цену дефолтной опции из optionCategories, игнорируя additionalOptions
        const calculateMinPriceFromOptions = (specs: any, projectId?: string): number => {
          if (!specs || typeof specs !== 'object') {
            console.log('[PRICE CALC] specs is not an object:', specs, 'projectId:', projectId)
            return 0
          }
          
          let minPrice = Infinity
          let foundPrices: number[] = []
          
          console.log('[PRICE CALC] Processing specs for project:', projectId, 'specs keys:', Object.keys(specs))
          
          // Проверяем optionCategories (новая структура)
          // Берем цену дефолтной опции или первой опции из каждой категории
          if (specs.optionCategories && typeof specs.optionCategories === 'object') {
            console.log('[PRICE CALC] Found optionCategories, keys:', Object.keys(specs.optionCategories))
            Object.entries(specs.optionCategories).forEach(([categoryId, category]: [string, any]) => {
              if (category && typeof category === 'object' && Array.isArray(category.options)) {
                console.log('[PRICE CALC] Category:', categoryId, 'title:', category.title, 'options count:', category.options.length)
                
                // Ищем дефолтную опцию или берем первую
                const defaultOption = category.options.find((opt: any) => opt.isDefault)
                const selectedOption = defaultOption || (category.options.length > 0 ? category.options[0] : null)
                
                if (selectedOption && typeof selectedOption === 'object') {
                  const price = typeof selectedOption.price === 'number' ? selectedOption.price : 0
                  console.log('[PRICE CALC] Selected option from category:', categoryId, 'label:', selectedOption.label, 'price:', price, 'isDefault:', !!defaultOption)
                  if (price > 0) {
                    foundPrices.push(price)
                    minPrice = Math.min(minPrice, price)
                  }
                }
              }
            })
          }
          
          // Проверяем старую структуру (finishing, insulation, floor, foundation)
          // Берем цену дефолтной опции или первой опции
          const legacyCategories = ['finishing', 'insulation', 'floor', 'foundation']
          legacyCategories.forEach(categoryId => {
            if (Array.isArray(specs[categoryId]) && specs[categoryId].length > 0) {
              console.log('[PRICE CALC] Found legacy category:', categoryId, 'options count:', specs[categoryId].length)
              
              // Ищем дефолтную опцию или берем первую
              const defaultOption = specs[categoryId].find((opt: any) => opt.isDefault)
              const selectedOption = defaultOption || specs[categoryId][0]
              
              if (selectedOption && typeof selectedOption === 'object') {
                const price = typeof selectedOption.price === 'number' ? selectedOption.price : 0
                console.log('[PRICE CALC] Selected legacy option from category:', categoryId, 'label:', selectedOption.label, 'price:', price, 'isDefault:', !!defaultOption)
                if (price > 0) {
                  foundPrices.push(price)
                  minPrice = Math.min(minPrice, price)
                }
              }
            }
          })
          
          // НЕ учитываем additionalOptions и completionOptions - это доп. услуги, не базовая цена для каталога
          // Они будут суммироваться на странице проекта, но не должны влиять на цену в каталоге
          
          const result = minPrice !== Infinity ? minPrice : 0
          console.log('[PRICE CALC] Result for project:', projectId, 'Found prices from default options:', foundPrices.sort((a, b) => a - b), 'minPrice:', result)
          return result
        }
        
        // Конвертируем все проекты в формат House для каталога
        const convertedHouses: House[] = allProjects.map((project: any) => {
          // filterValues может быть объектом или null, но не undefined
          const filterValues = (project.filterValues && typeof project.filterValues === 'object') ? project.filterValues : {}
          console.log('[CATALOG] Project:', project.id, 'slug:', project.slug, 'filterValues:', filterValues, 'type:', typeof filterValues)
          if (filterValues && Object.keys(filterValues).length > 0) {
            console.log('[CATALOG] filterValues keys:', Object.keys(filterValues))
            console.log('[CATALOG] filterValues content:', JSON.stringify(filterValues))
          }
          
          // Определяем цену: для бытовок берем минимальную цену из опций, для остальных - priceFrom
          let displayPrice = project.priceFrom || 0
          const isBytovkaProject = isBytovka(project)
          
          console.log('[CATALOG] Project:', project.id, 'title:', project.title, 'isBytovka:', isBytovkaProject, 'hasSpecs:', !!project.specs, 'priceFrom:', project.priceFrom)
          
          if (isBytovkaProject) {
            console.log('[CATALOG] Бытовка найдена:', project.id, 'title:', project.title, 'specs:', project.specs ? 'exists' : 'missing')
            if (project.specs) {
              const minPriceFromOptions = calculateMinPriceFromOptions(project.specs, project.id)
              console.log('[CATALOG] Минимальная цена из опций:', minPriceFromOptions, 'для проекта:', project.id, 'title:', project.title)
              // Для бытовок ВСЕГДА используем минимальную цену из опций, даже если она 0
              // Но если цена из опций больше 0, используем её
              if (minPriceFromOptions > 0) {
                displayPrice = minPriceFromOptions
                console.log('[CATALOG] ✅ Бытовка цена обновлена:', project.id, 'title:', project.title, 'старая цена (priceFrom):', project.priceFrom, 'новая цена (из опций):', minPriceFromOptions)
              } else {
                // Если минимальная цена из опций = 0, но priceFrom > 0, всё равно используем priceFrom
                // Но это странная ситуация - обычно у бытовок priceFrom = 0
                console.log('[CATALOG] ⚠️ Бытовка без цен в опциях (minPrice=0), используем priceFrom:', project.priceFrom, 'для проекта:', project.id, 'title:', project.title)
              }
            } else {
              console.log('[CATALOG] ⚠️ Бытовка без specs, используем priceFrom:', project.priceFrom, 'для проекта:', project.id, 'title:', project.title)
            }
          }
          
          return {
            id: project.id,
            title: project.title,
            area: project.area,
            price: displayPrice,
            floors: project.floors || 1,
            material: project.material || 'каркасный',
            completion: project.completion || 'под ключ',
            buildTime: project.buildTime || 30,
            region: project.region || '',
            image: project.image || '/images/house.jpg',
            tags: project.tags || [],
            hasTerrasse: project.hasTerrasse || false,
            hasBath: project.hasBath || false,
            hasGarage: project.hasGarage || false,
            features: project.features || [],
            filterValues: filterValues
          }
        })
        
        console.log('[CATALOG] Loaded projects:', {
          total: convertedHouses.length,
          popular: allProjects.filter(p => p.isPopular).length,
          regular: allProjects.filter(p => !p.isPopular).length
        })
        
        setHouses(convertedHouses)
        setFilteredHouses(convertedHouses)
      } catch (error) {
        console.error('Error loading projects:', error)
      } finally {
        setIsLoadingProjects(false)
      }
    }

    fetchProjects()
  }, [subsubsectionId, subsectionId, sectionId])

  // Обновляем каталог сразу после сохранения проекта в админке и при возвращении фокуса
  useEffect(() => {
    let mounted = true
    
    // Функция для определения, является ли проект бытовкой (дублируем для reload)
    const isBytovka = (project: any): boolean => {
      const filterValues = (project.filterValues && typeof project.filterValues === 'object') ? project.filterValues : {}
      for (const [key, value] of Object.entries(filterValues)) {
        if (typeof value === 'string') {
          const normalized = value.toLowerCase()
          if (normalized.includes('бытовк') || normalized.includes('bytovk')) return true
        }
        if (Array.isArray(value)) {
          if (value.some((v: any) => typeof v === 'string' && (v.toLowerCase().includes('бытовк') || v.toLowerCase().includes('bytovk')))) {
            return true
          }
        }
      }
      if (Array.isArray(project.tags)) {
        if (project.tags.some((tag: string) => typeof tag === 'string' && (tag.toLowerCase().includes('бытовк') || tag.toLowerCase().includes('bytovk')))) {
          return true
        }
      }
      if (project.title && typeof project.title === 'string' && (project.title.toLowerCase().includes('бытовк') || project.title.toLowerCase().includes('bytovk'))) {
        return true
      }
      return false
    }
    
    // Функция для вычисления минимальной цены из дополнительных опций (дублируем для reload)
    const calculateMinPriceFromOptions = (specs: any): number => {
      if (!specs || typeof specs !== 'object') return 0
      let minPrice = Infinity
      
      // Проверяем optionCategories (новая структура)
      // Берем цену дефолтной опции или первой опции из каждой категории
      if (specs.optionCategories && typeof specs.optionCategories === 'object') {
        Object.values(specs.optionCategories).forEach((category: any) => {
          if (category && typeof category === 'object' && Array.isArray(category.options)) {
            // Ищем дефолтную опцию или берем первую
            const defaultOption = category.options.find((opt: any) => opt.isDefault)
            const selectedOption = defaultOption || (category.options.length > 0 ? category.options[0] : null)
            
            if (selectedOption && typeof selectedOption === 'object') {
              const price = typeof selectedOption.price === 'number' ? selectedOption.price : 0
              if (price > 0) minPrice = Math.min(minPrice, price)
            }
          }
        })
      }
      
      // Проверяем старую структуру (finishing, insulation, floor, foundation)
      // Берем цену дефолтной опции или первой опции
      const legacyCategories = ['finishing', 'insulation', 'floor', 'foundation']
      legacyCategories.forEach(categoryId => {
        if (Array.isArray(specs[categoryId]) && specs[categoryId].length > 0) {
          // Ищем дефолтную опцию или берем первую
          const defaultOption = specs[categoryId].find((opt: any) => opt.isDefault)
          const selectedOption = defaultOption || specs[categoryId][0]
          
          if (selectedOption && typeof selectedOption === 'object') {
            const price = typeof selectedOption.price === 'number' ? selectedOption.price : 0
            if (price > 0) minPrice = Math.min(minPrice, price)
          }
        }
      })
      
      // НЕ учитываем additionalOptions и completionOptions - это доп. услуги, не базовая цена
      
      return minPrice !== Infinity ? minPrice : 0
    }
    
    const reload = async () => {
      if (!mounted) return
      try {
        // Если выбран подраздел или раздел — загружаем только его проекты (как при первичной загрузке)
        if (subsubsectionId || subsectionId || sectionId) {
          const param = subsubsectionId
            ? `subsubsectionId=${encodeURIComponent(subsubsectionId)}`
            : subsectionId
              ? `subsectionId=${encodeURIComponent(subsectionId)}`
              : `sectionId=${encodeURIComponent(sectionId!)}`
          const res = await fetch(`/api/projects?${param}&t=${Date.now()}`, { cache: 'no-store' })
          if (!res.ok) return
          let data = await res.json()
          if (!data || data.length === 0) {
            const fallbackRes = await fetch('/api/projects?t=' + Date.now(), { cache: 'no-store' })
            if (fallbackRes.ok) data = await fallbackRes.json()
          }
          const converted: House[] = (data || []).map((p: any) => ({
            id: p.id,
            title: p.title,
            area: p.area,
            price: p.priceFrom ?? 0,
            floors: p.floors ?? 1,
            material: (p.material || 'каркасный') as House['material'],
            completion: (p.completion || 'под ключ') as House['completion'],
            buildTime: p.buildTime ?? 30,
            region: p.region || '',
            image: p.image || '/images/house.jpg',
            tags: p.tags || [],
            hasTerrasse: p.hasTerrasse ?? false,
            hasBath: p.hasBath ?? false,
            hasGarage: p.hasGarage ?? false,
            features: p.features || [],
            filterValues: (p.filterValues && typeof p.filterValues === 'object') ? p.filterValues : {}
          }))
          setHouses(converted)
          setFilteredHouses(converted)
          return
        }
        // Загружаем популярные проекты и обычные, как при первичной загрузке
        let reloadedProjects: any[] = []
        try {
          const popularResponse = await fetch('/api/popular?' + Date.now(), { cache: 'no-store' })
          if (popularResponse.ok) {
            const panels = await popularResponse.json()
            const allPopularItems = panels.flatMap((panel: any) => panel.items || [])
            // Подтягиваем обычные проекты для мержа данных популярных
            const projectsResponse = await fetch('/api/projects?' + Date.now(), { cache: 'no-store' })
            const allProjectsData: any[] = projectsResponse.ok ? await projectsResponse.json() : []
            const popularProjectsWithMergedData = allPopularItems
              .map((item: any) => {
                if (item.projectSlug) {
                  const realProject = allProjectsData.find((p: any) => p.id === item.projectSlug)
                  if (realProject) {
                    return {
                      id: item.projectSlug,
                      title: item.title || realProject.title,
                      area: item.area || realProject.area,
                      priceFrom: item.priceFrom || realProject.priceFrom,
                      priceTo: item.priceTo ?? realProject.priceTo,
                      floors: item.floors ?? realProject.floors ?? 1,
                      material: item.material || realProject.material,
                      buildTime: item.buildTime ?? realProject.buildTime ?? 30,
                      completion: item.completion || realProject.completion || 'под ключ',
                      region: item.region || realProject.region || '',
                      image: item.image || realProject.image,
                      images: item.images || realProject.images || [],
                      tags: item.tags || realProject.tags || [],
                      hasTerrasse: item.hasTerrasse ?? realProject.hasTerrasse ?? false,
                      hasBath: item.hasBath ?? realProject.hasBath ?? false,
                      hasGarage: item.hasGarage ?? realProject.hasGarage ?? false,
                      features: item.features || realProject.features || [],
                      filterValues: realProject.filterValues || item.filterValues || null,
                      specs: item.specs || realProject.specs || null,
                      isPopular: true,
                      projectSlug: item.projectSlug
                    }
                  }
                }
                const generateSlug = (title: string, itemId: string) => title
                  .toLowerCase()
                  .replace(/[^a-zа-яё0-9]+/g, '-')
                  .replace(/^-+|-+$/g, '')
                  .substring(0, 50) + `-${item.id.substring(0, 8)}`
                const projectSlug = item.slug || generateSlug(item.title, item.id)
                return {
                  id: projectSlug,
                  title: item.title,
                  area: item.area,
                  priceFrom: item.priceFrom,
                  priceTo: item.priceTo || null,
                  floors: item.floors ?? 1,
                  material: item.material || 'каркасный',
                  buildTime: item.buildTime ?? 30,
                  completion: item.completion || 'под ключ',
                  region: item.region || '',
                  image: item.image || '/images/house.jpg',
                  images: item.images || [],
                  tags: item.tags || [],
                  hasTerrasse: item.hasTerrasse ?? false,
                  hasBath: item.hasBath ?? false,
                  hasGarage: item.hasGarage ?? false,
                  features: item.features || [],
                  filterValues: item.filterValues || null,
                  specs: item.specs || null,
                  isPopular: true,
                  projectSlug: item.projectSlug
                }
              })
              .filter(Boolean)
            reloadedProjects = [...popularProjectsWithMergedData]
          }
        } catch {}

        // Обычные проекты с устранением дублей популярных
        try {
          const response = await fetch('/api/projects?' + Date.now(), { cache: 'no-store' })
          if (response.ok) {
            const data = await response.json()
            const popularSlugs = new Set(reloadedProjects.map(p => p.id || p.projectSlug).filter(Boolean))
            const regularProjects = data
              .filter((project: any) => !popularSlugs.has(project.id))
              .map((project: any) => ({
                id: project.id,
                title: project.title,
                area: project.area,
                priceFrom: project.priceFrom,
                priceTo: project.priceTo,
                floors: project.floors,
                material: project.material,
                completion: project.completion,
                buildTime: project.buildTime,
                region: project.region,
                image: project.image,
                tags: project.tags || [],
                hasTerrasse: project.hasTerrasse || false,
                hasBath: project.hasBath || false,
                hasGarage: project.hasGarage || false,
                features: project.features || [],
                filterValues: project.filterValues || null,
                specs: project.specs || null,
                isPopular: false
              }))
            reloadedProjects = [...reloadedProjects, ...regularProjects]
          }
        } catch {}

        const converted: House[] = reloadedProjects.map((project: any) => {
          const filterValues = (project.filterValues && typeof project.filterValues === 'object') ? project.filterValues : {}
          
          // Определяем цену: для бытовок берем минимальную цену из опций, для остальных - priceFrom
          let displayPrice = project.priceFrom || 0
          if (isBytovka(project) && project.specs) {
            const minPriceFromOptions = calculateMinPriceFromOptions(project.specs)
            if (minPriceFromOptions > 0) {
              displayPrice = minPriceFromOptions
            }
          }
          
          return {
            id: project.id,
            title: project.title,
            area: project.area,
            price: displayPrice,
            floors: project.floors || 1,
            material: project.material || 'каркасный',
            completion: project.completion || 'под ключ',
            buildTime: project.buildTime || 30,
            region: project.region || '',
            image: project.image || '/images/house.jpg',
            tags: project.tags || [],
            hasTerrasse: project.hasTerrasse || false,
            hasBath: project.hasBath || false,
            hasGarage: project.hasGarage || false,
            features: project.features || [],
            filterValues: filterValues
          }
        })
        setHouses(converted)
        setFilteredHouses(converted)
      } catch {}
    }
    // Слушаем BroadcastChannel
    let ch: BroadcastChannel | null = null
    if (typeof BroadcastChannel !== 'undefined') {
      ch = new BroadcastChannel('projects-updated')
      ch.onmessage = (e) => {
        if (e.data?.type === 'projects-updated') reload()
      }
    }
    // Fallback: слушаем событие storage для кросс-вкладок
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === 'projects-updated') reload()
    }
    window.addEventListener('storage', onStorage)
    const onFocus = () => reload()
    window.addEventListener('focus', onFocus)
    return () => {
      mounted = false
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('storage', onStorage)
      if (ch) ch.close()
    }
  }, [subsubsectionId, subsectionId, sectionId])

  // Ref для отслеживания что панель только что открылась/закрылась
  const sortToggleRef = useRef(false)
  
  // Заморозка обновлений когда открывается/закрывается панель сортировки
  useEffect(() => {
    sortToggleRef.current = true
    const timer = setTimeout(() => {
      sortToggleRef.current = false
    }, 100)
    return () => clearTimeout(timer)
  }, [isSortOpen])

  // Обновляем высоту catalog-header
  useEffect(() => {
    const headerElement = document.getElementById('catalog-header')
    if (!headerElement) return
    
    const updateCatalogHeaderHeight = () => {
      const currentHeight = headerElement.getBoundingClientRect().height
      if (currentHeight !== catalogHeaderHeight) {
        setCatalogHeaderHeight(currentHeight)
      }
    }
    
    // Используем ResizeObserver для отслеживания изменений размера
    const resizeObserver = new ResizeObserver(() => {
      updateCatalogHeaderHeight()
    })
    
    resizeObserver.observe(headerElement)
    
    return () => {
      resizeObserver.disconnect()
    }
  }, [catalogHeaderHeight])

  // Sticky панель с отслеживанием исходной позиции и хедера
  useEffect(() => {
    const headerElement = document.getElementById('catalog-header')
    const siteHeader = document.querySelector('header')
    if (!headerElement) return

    let offsetTop = 0
    let headerHeight = 0
    let catalogHeaderHeight = 64 // Локальная переменная
    
    const updateOffsetTop = () => {
      const rect = headerElement.getBoundingClientRect()
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      offsetTop = rect.top + scrollTop
      headerHeight = rect.height
      catalogHeaderHeight = rect.height
      setHeaderOffsetTop(offsetTop)
      setHeaderHeight(headerHeight)
    }
    updateOffsetTop()

    let lastFiltersVisible = true
    let lastStickyState = false
    let lastTopOffset = 64
    if (siteHeader) {
      lastTopOffset = siteHeader.getBoundingClientRect().height
      setTopOffset(lastTopOffset)
    }
    
    const optimizedHandleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      
      // Обновляем высоту catalog-header динамически
      const currentCatalogHeaderHeight = headerElement.getBoundingClientRect().height
      if (currentCatalogHeaderHeight !== catalogHeaderHeight) {
        catalogHeaderHeight = currentCatalogHeaderHeight
      }
      
      // Проверяем видимость хедера сайта и вычисляем динамический top offset
      if (siteHeader && headerElement) {
        const headerRect = siteHeader.getBoundingClientRect()
        const siteHeaderHeight = headerRect.height
        
        // Вычисляем top offset напрямую по позиции хедера
        const calculatedOffset = Math.max(0, Math.min(siteHeaderHeight, siteHeaderHeight + headerRect.top))
        
        // Обновляем только если значение изменилось
        if (calculatedOffset !== lastTopOffset) {
          headerElement.style.top = `${calculatedOffset}px`
          lastTopOffset = calculatedOffset
          setTopOffset(calculatedOffset)
        }
      }
      
      // Проверяем видимость фильтров
      const filtersWrapper = document.getElementById('catalog-filters-wrapper')
      let filtersAreVisible = true
      
      if (filtersWrapper) {
        const filtersRect = filtersWrapper.getBoundingClientRect()
        
        // Фильтры полностью ушли вверх (верхний край тоже выше viewport)
        if (filtersRect.top < 0 && filtersRect.bottom < 0) {
          filtersAreVisible = false
        }
        // Фильтры хотя бы частично видны
        else {
          filtersAreVisible = true
        }
      }
      
      // Пропускаем обновления если панель сортировки только что открылась/закрылась
      if (sortToggleRef.current) {
        return
      }
      
      // Только обновляем состояние если оно изменилось
      if (filtersAreVisible !== lastFiltersVisible) {
        lastFiltersVisible = filtersAreVisible
        
        if (!filtersAreVisible) {
          setIsFading(true)
          setIsSticky(false)
        } else {
          setIsFading(false)
          const shouldBeSticky = scrollTop >= offsetTop - 64
          setIsSticky(shouldBeSticky)
          lastStickyState = shouldBeSticky
        }
      } else {
        // Обновляем только sticky если нужно
        const shouldBeSticky = scrollTop >= offsetTop - 64
        if (shouldBeSticky !== lastStickyState && filtersAreVisible) {
          setIsSticky(shouldBeSticky)
          lastStickyState = shouldBeSticky
        }
      }
      
      // Размер панели (компактный когда скроллим вниз)
      const shouldBeCompact = scrollTop >= offsetTop - 64
      setIsCompact(shouldBeCompact)
    }
    
    window.addEventListener('scroll', optimizedHandleScroll)
    return () => {
      window.removeEventListener('scroll', optimizedHandleScroll)
    }
  }, [])

  // Стабильные значения по умолчанию (одинаковы на сервере и клиенте)
  const defaultFilters: FilterState = {
    priceRange: [0, 50000000],
    areaRange: [0, 1000], // Увеличен диапазон чтобы включить все проекты
    material: [],
    buildTime: [],
    features: [],
    searchQuery: ''
  }

  // Загрузка фильтров из localStorage (используем ТОЛЬКО на клиенте после монтирования)
  const loadFiltersFromStorage = (): FilterState => {
    if (typeof window === 'undefined') {
      return defaultFilters
    }

    try {
      const saved = localStorage.getItem('catalog-filters')
      if (saved) {
        const parsed = JSON.parse(saved)
        // Валидация и установка значений по умолчанию если что-то отсутствует
        return {
          priceRange: parsed.priceRange || [0, 50000000],
          areaRange: parsed.areaRange || [0, 1000], // Увеличен диапазон чтобы включить все проекты
          material: Array.isArray(parsed.material) ? parsed.material : [],
          buildTime: Array.isArray(parsed.buildTime) ? parsed.buildTime : [],
          features: Array.isArray(parsed.features) ? parsed.features : [],
          searchQuery: parsed.searchQuery || ''
        }
      }
    } catch {
      // ignore
    }

    return defaultFilters
  }

  // Инициализируем стабильно, затем подтягиваем сохранённое значение на клиенте
  const [filters, setFilters] = useState<FilterState>(defaultFilters)

  useEffect(() => {
    const saved = loadFiltersFromStorage()
    setFilters(saved)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Сохранение фильтров в localStorage при изменении
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('catalog-filters', JSON.stringify(filters))
      } catch {
        // ignore
      }
    }
  }, [filters])

  const defaultSort: SortState = {
    field: 'new',
    direction: 'asc'
  }

  // Загрузка сортировки из localStorage (используем ТОЛЬКО на клиенте после монтирования)
  const loadSortFromStorage = (): SortState => {
    if (typeof window === 'undefined') {
      return defaultSort
    }

    try {
      const saved = localStorage.getItem('catalog-sort')
      if (saved) {
        const parsed = JSON.parse(saved)
        // Валидация
        if (parsed.field && ['price', 'new'].includes(parsed.field)) {
          return {
            field: parsed.field,
            direction: parsed.direction === 'asc' ? 'asc' : 'desc'
          }
        }
      }
    } catch (error) {
      console.error('Error loading sort from localStorage:', error)
    }

    return defaultSort
  }

  // Инициализируем стабильно, затем подтягиваем сохранённое значение на клиенте
  const [sort, setSort] = useState<SortState>(defaultSort)

  useEffect(() => {
    const savedSort = loadSortFromStorage()
    setSort(savedSort)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Сохранение сортировки в localStorage при изменении
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('catalog-sort', JSON.stringify(sort))
      } catch (error) {
        console.error('Error saving sort to localStorage:', error)
      }
    }
  }, [sort])

  // Применение фильтров
  useEffect(() => {
    let filtered = [...houses]

    // Поиск
    if (filters.searchQuery) {
      filtered = filtered.filter(house =>
        house.title.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        house.tags.some(tag => tag.toLowerCase().includes(filters.searchQuery.toLowerCase()))
      )
    }

    // Фильтр по цене - используем priceTo если есть, иначе price
    filtered = filtered.filter(house => {
      const housePrice = house.price
      return housePrice >= filters.priceRange[0] && housePrice <= filters.priceRange[1]
    })

    // Фильтр по площади
    filtered = filtered.filter(house =>
      house.area >= filters.areaRange[0] && house.area <= filters.areaRange[1]
    )

    // Фильтр по материалу
    if (filters.material.length > 0) {
      filtered = filtered.filter(house => filters.material.includes(house.material))
    }

    // Фильтр по дополнительным опциям
    if (filters.features.length > 0) {
      filtered = filtered.filter(house => {
        return filters.features.every(feature => 
          house.features?.includes(feature)
        )
      })
    }

    // Динамические фильтры (все фильтры кроме известных)
    const knownFilterKeys = new Set(['priceRange', 'areaRange', 'material', 'buildTime', 'features', 'searchQuery'])
    
    Object.keys(filters).forEach(filterKey => {
      if (!knownFilterKeys.has(filterKey)) {
        const filterValue = (filters as any)[filterKey]
        
        if (filterValue !== undefined && filterValue !== null && filterValue !== '' && 
            (Array.isArray(filterValue) ? filterValue.length > 0 : true)) {
          
          // Для range фильтров: если диапазон равен начальному (например, [0, 100]), не применяем фильтр
          // Это означает, что пользователь не изменил диапазон, и мы показываем все проекты
          if (Array.isArray(filterValue) && filterValue.length === 2 && typeof filterValue[0] === 'number') {
            // Проверяем, не является ли это диапазоном, который охватывает весь возможный диапазон
            // Если разница между min и max слишком мала (меньше 1% от диапазона), считаем это неактивным фильтром
            // Но для этого нам нужно знать min/max из конфигурации, которых у нас нет
            // Поэтому применяем фильтр всегда, если диапазон задан
          }
          
          filtered = filtered.filter((house: any) => {
            const houseFilterValues = (house.filterValues && typeof house.filterValues === 'object') ? house.filterValues : {}
            const houseValue = houseFilterValues[filterKey]
            
            if (Array.isArray(filterValue) && filterValue.length === 2 && typeof filterValue[0] === 'number') {
              if (houseValue === undefined || houseValue === null) return false
              if (typeof houseValue === 'number') {
                return houseValue >= filterValue[0] && houseValue <= filterValue[1]
              } else if (Array.isArray(houseValue) && houseValue.length === 2) {
                return !(houseValue[1] < filterValue[0] || houseValue[0] > filterValue[1])
              }
              return false
            } else if (Array.isArray(filterValue)) {
              // Для checkboxes - проверяем что хотя бы одно значение совпадает
              // houseValue может быть строкой (из filterValues в БД) или массивом
              if (houseValue === undefined || houseValue === null) {
                return false
              }
              let result: boolean
              if (Array.isArray(houseValue)) {
                result = filterValue.some((fv: any) => houseValue.includes(fv))
              } else {
                // houseValue — строка (напр. duhovka: "Есть", plita: "410мм*340мм")
                result = filterValue.includes(houseValue)
              }
              return result
            } else {
              if (houseValue === undefined || houseValue === null) return false
              return houseValue === filterValue
            }
          })
        }
      }
    })

    // Сортировка
    const extractOrderNumber = (title: string): number => {
      const m = title.match(/(\d+)/)
      return m ? parseInt(m[1], 10) : 0
    }

    filtered.sort((a, b) => {
      let aValue: number, bValue: number

      switch (sort.field) {
        case 'price':
          aValue = a.price
          bValue = b.price
          break
        case 'new':
          aValue = extractOrderNumber(a.title)
          bValue = extractOrderNumber(b.title)
          break
        default:
          aValue = extractOrderNumber(a.title)
          bValue = extractOrderNumber(b.title)
      }

      return sort.direction === 'asc' ? aValue - bValue : bValue - aValue
    })

    setFilteredHouses(filtered)
  }, [houses, filters, sort])

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 9)
  }

  const resetFilters = () => {
    setFilters(defaultFilters)
    // Очищаем localStorage при сбросе
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('catalog-filters')
      } catch (error) {
        console.error('Error removing filters from localStorage:', error)
      }
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-[#FAF7F2] via-[#F5F0E8] to-[#EDE8E0] pt-16 overflow-visible">

        {/* Заголовок раздела и панель управления - прижаты по краям */}
        <div 
          id="catalog-header"
          className={`hidden lg:block w-full backdrop-blur-xl bg-white/80 border-b border-[#E8E2D9] catalog-header-panel ${isSticky ? 'sticky z-50' : ''} ${isFading ? 'opacity-0 -translate-y-4 invisible' : 'opacity-100 translate-y-0 visible'} transition-all duration-500 shadow-[0_4px_24px_-4px_rgba(26,15,10,0.06)]`}
          style={isSticky ? { 
            top: `${topOffset}px`
          } : {}}
        >
            <div className={`w-full transition-all duration-500 ${isCompact ? 'py-3' : 'py-6'}`}>
            {/* Строка: слева - заголовок, справа - кнопки */}
            <div className="flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <h2 className={`font-semibold text-[#1A1210] font-lora transition-all duration-500 ${isCompact ? 'text-xl' : 'text-2xl'}`}>Проекты и комплектации ({filteredHouses.length})</h2>
              
              {/* Кнопки "Скрыть фильтры" и "Сортировка" - справа */}
              <div className="hidden lg:flex items-center gap-3">
                <button
                  onClick={() => setIsFiltersVisible(!isFiltersVisible)}
                  className={`flex items-center gap-2 font-medium rounded-md transition-all duration-500 ${
                    isCompact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
                  } ${
                    isFiltersVisible 
                      ? 'bg-[#1A0F0A] text-white' 
                      : 'bg-white text-[#1A1210] border border-[#E8E2D9]'
                  }`}
                >
                  <span>{isFiltersVisible ? 'Скрыть фильтры' : 'Показать фильтры'}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
                  </svg>
                </button>

                <button
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className={`flex items-center gap-2 font-medium bg-white text-[#1A1210] border border-[#E8E2D9] rounded-xl transition-all duration-500 ${
                    isCompact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
                  }`}
                >
                  <span>Сортировка</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
            </div>
        </div>
        
        {/* Панель сортировки (выпадающая) - ВНЕ sticky панели */}
        {isSortOpen && (
          <div className={`w-full ${isSticky ? 'sticky z-40' : ''}`} style={isSticky ? { top: `${topOffset + catalogHeaderHeight}px` } : {}}>
            <div className="flex justify-end px-4 sm:px-6 lg:px-8">
              <div className="border border-[#E8E2D9] rounded-xl bg-white p-4 shadow-[0_4px_24px_-4px_rgba(26,15,10,0.08)]">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500 font-medium whitespace-nowrap">Сортировать по:</span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'price', label: 'Цене' },
                      { value: 'new', label: 'Новизне' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          if (sort.field === option.value) {
                            setSort({
                              field: sort.field,
                              direction: sort.direction === 'asc' ? 'desc' : 'asc'
                            })
                          } else {
                            setSort({
                              field: option.value as any,
                              direction: option.value === 'new' ? 'asc' : 'desc'
                            })
                          }
                        }}
                        className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                            sort.field === option.value 
                            ? 'bg-[#1A0F0A] text-white' 
                            : 'bg-[#FAF7F2] text-[#1A1210] hover:bg-[#F5F0E8]'
                        }`}
                      >
                        <span>{option.label}</span>
                        {sort.field === option.value && (
                          <svg
                            className={`w-4 h-4 transition-transform duration-200 ${
                              sort.direction === 'desc' ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Панель поиска и управления (для мобильной версии) */}
        <CatalogSortBar
          searchQuery={filters.searchQuery}
          onSearchChange={(query) => setFilters(prev => ({ ...prev, searchQuery: query }))}
          sort={sort}
          onSortChange={setSort}
          isFiltersVisible={isFiltersVisible}
          onToggleFilters={() => setIsFiltersVisible(!isFiltersVisible)}
          onOpenMobileFilters={() => setIsMobileFiltersOpen(true)}
          resultsCount={filteredHouses.length}
          isSticky={isSticky}
          topOffset={topOffset}
          isFading={isFading}
        />

        <div id="catalog-filters-wrapper" className="flex py-8 items-stretch overflow-visible">
          {/* Родитель sticky: self-stretch чтобы колонка была высокой, ring для отладки */}
          <div className="hidden lg:block self-stretch overflow-visible min-w-[320px]">
            <CatalogFilters
              filters={filters}
              onFiltersChange={setFilters}
              onResetFilters={resetFilters}
              isVisible={isFiltersVisible}
              isHeaderSticky={isSticky}
              headerHeight={isSticky ? topOffset + catalogHeaderHeight : 96}
              subsectionId={subsectionId}
              sectionId={sectionId}
            />
          </div>

          {/* Сетка карточек с контейнером */}
          <div className="flex-1 px-4 sm:px-6 lg:px-8">
            <CatalogGrid
              houses={filteredHouses.slice(0, visibleCount)}
              isLoading={isLoading}
              onLoadMore={handleLoadMore}
              hasMore={visibleCount < filteredHouses.length}
              isFiltersVisible={isFiltersVisible}
            />
          </div>
        </div>

        {/* Призыв к действию */}
        <div className="bg-white/80 border-t border-[#E8E2D9] py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-[#5C3825] mb-4 font-medium">Калькулятор</p>
            <h2 className="text-3xl font-bold text-[#1A1210] mb-4 font-lora">
              Не нашли подходящее?
            </h2>
            <p className="text-xl text-[#5C3825]/90 mb-8">
              Печнойпроект разрабатывает печные комплексы, мангалы и барбекю по индивидуальным чертежам. Укажите параметры — получите предварительную стоимость и консультацию специалиста.
            </p>
            <div className="flex justify-center">
              <Link 
                href={{ pathname: '/', hash: 'calculator' }}
                className="inline-flex items-center px-8 py-4 bg-[#1A0F0A] hover:bg-[#2C1810] text-white font-semibold rounded-xl transition-all duration-300 shadow-[0_4px_20px_-4px_rgba(26,15,10,0.3)] hover:shadow-[0_8px_30px_-4px_rgba(26,15,10,0.4)] tracking-wider"
              >
                Рассчитать индивидуальный проект
              </Link>
            </div>
          </div>
        </div>

        {/* SEO-текст */}
        <CatalogSeoText />

        {/* Мобильные фильтры */}
        <MobileFilters
          filters={filters}
          onFiltersChange={setFilters}
          onResetFilters={resetFilters}
          isOpen={isMobileFiltersOpen}
          onClose={() => setIsMobileFiltersOpen(false)}
          subsectionId={subsectionId}
          sectionId={sectionId}
        />
      </div>
      <Footer />
    </>
  )
}

export default function CatalogPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FAF7F2] to-[#F5F0E8]">
        <span className="text-[#5C3825]/90">Загрузка каталога…</span>
      </div>
    }>
      <CatalogPageContent />
    </Suspense>
  )
}
