'use client'

import { useState, useEffect } from 'react'

interface CalculatorData {
  houseType: string
  area: number // Общий метраж (pipeLength * quantity) для обратной совместимости
  pipeLength: number // Метраж одной трубы
  quantity: number // Количество труб
  finishing: string[]
  options: string[] // Для совместимости оставляем массив, но на шаге 4 разрешаем только одну опцию
}

// Дефолтные значения (fallback если БД пустая)
const defaultHouseTypes = [
  { id: 'steel', name: 'Стальные трубы', image: '/images/pipe-steel.jpg', basePrice: 250 },
  { id: 'plastic', name: 'Пластиковые трубы (ПВХ)', image: '/images/pipe-plastic.jpg', basePrice: 150 },
  { id: 'metalplastic', name: 'Металлопластиковые трубы', image: '/images/pipe-metalplastic.jpg', basePrice: 200 }
]

const defaultFinishingOptions = [
  { id: 'none', name: 'Без обработки', multiplier: 0 },
  { id: 'galvanized', name: 'Оцинковка', multiplier: 0.15 },
  { id: 'painted', name: 'Покраска', multiplier: 0.1 },
  { id: 'insulated', name: 'Теплоизоляция', multiplier: 0.25 }
]

const defaultAdditionalOptions = [
  { id: 'delivery', name: 'Доставка', price: 5000 },
  { id: 'installation', name: 'Монтаж', price: 15000 },
  { id: 'cutting', name: 'Резка по размерам', price: 3000 },
  { id: 'welding', name: 'Сварочные работы', price: 20000 }
]

const STORAGE_KEY = 'aquagazteh_calculator_data'

export default function Calculator() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<CalculatorData>({
    houseType: 'steel',
    area: 50, // Общий метраж (будет вычисляться)
    pipeLength: 6, // Метраж одной трубы
    quantity: 1, // Количество труб
    finishing: [],
    options: []
  })
  const [isVisible, setIsVisible] = useState(false)
  const [estimatedPrice, setEstimatedPrice] = useState(0)
  const [houseTypes, setHouseTypes] = useState(defaultHouseTypes)
  const [finishingOptions, setFinishingOptions] = useState(defaultFinishingOptions)
  const [additionalOptions, setAdditionalOptions] = useState(defaultAdditionalOptions)
  const [stepTexts, setStepTexts] = useState({ step1Title: 'Выберите тип труб', step2Title: 'Укажите метраж и количество', step3Title: 'Выберите обработку/покрытие', step4Title: 'Дополнительные услуги' })
  const [areaSettings, setAreaSettings] = useState({ minArea: 1, maxArea: 12, defaultArea: 6, minQuantity: 1, maxQuantity: 100, defaultQuantity: 1 })
  const [whatsappTemplate, setWhatsappTemplate] = useState('')

  // Загрузка конфигурации калькулятора из БД
  useEffect(() => {
    const loadConfig = async () => {
      try {
        console.log('[CALC] Loading config from /api/calculator')
        const res = await fetch('/api/calculator', { cache: 'no-store' })
        if (res.ok) {
          const cfg = await res.json()
          console.log('[CALC] Loaded config:', { 
            finishingCount: cfg.finishingOptions?.length || 0, 
            additionalCount: cfg.additionalOptions?.length || 0 
          })
          if (cfg.houseTypes && Array.isArray(cfg.houseTypes)) {
            setHouseTypes(cfg.houseTypes)
            // Проверяем, что выбранный тип труб существует в новой конфигурации
            setData(prev => {
              const exists = cfg.houseTypes.find((t: any) => t.id === prev.houseType)
              if (!exists && cfg.houseTypes.length > 0) {
                return { ...prev, houseType: cfg.houseTypes[0].id }
              }
              return prev
            })
          }
          if (cfg.finishingOptions && Array.isArray(cfg.finishingOptions)) {
            console.log('[CALC] Setting finishing options:', cfg.finishingOptions)
            setFinishingOptions(cfg.finishingOptions)
          }
          if (cfg.additionalOptions && Array.isArray(cfg.additionalOptions)) {
            console.log('[CALC] Setting additional options:', cfg.additionalOptions)
            setAdditionalOptions(cfg.additionalOptions)
          }
          if (cfg.stepTexts) setStepTexts(cfg.stepTexts)
          if (cfg.areaSettings) setAreaSettings(cfg.areaSettings)
          if (cfg.whatsappTemplate) setWhatsappTemplate(cfg.whatsappTemplate)
        }
      } catch (error) {
        console.error('Error loading calculator config:', error)
      }
    }
    loadConfig()
  }, [])

  // Загрузка данных из localStorage при монтировании
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem(STORAGE_KEY)
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData)
          // Разделяем данные калькулятора и шаг
          const { currentStep: savedStep, ...savedCalculatorData } = parsed
          
          // Валидация загруженных данных
          if (savedCalculatorData.houseType && 
              Array.isArray(savedCalculatorData.finishing) && 
              Array.isArray(savedCalculatorData.options)) {
            // Обработка старых данных (без pipeLength и quantity)
            if (!savedCalculatorData.pipeLength || !savedCalculatorData.quantity) {
              const area = savedCalculatorData.area || 50
              savedCalculatorData.pipeLength = 6
              savedCalculatorData.quantity = Math.max(1, Math.ceil(area / 6))
              savedCalculatorData.area = savedCalculatorData.pipeLength * savedCalculatorData.quantity
            } else if (!savedCalculatorData.area) {
              // Если есть pipeLength и quantity, но нет area - вычисляем
              savedCalculatorData.area = (savedCalculatorData.pipeLength || 6) * (savedCalculatorData.quantity || 1)
            }
            setData(savedCalculatorData as CalculatorData)
            if (savedStep && typeof savedStep === 'number' && savedStep >= 1 && savedStep <= 4) {
              setCurrentStep(savedStep)
            }
          }
        } catch (e) {
          console.error('Error loading saved calculator data:', e)
          // Очищаем поврежденные данные
          localStorage.removeItem(STORAGE_KEY)
        }
      }
      setIsInitialized(true)
    }
  }, [])

  // Сохранение данных в localStorage при изменении (только после инициализации)
  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized) {
      try {
        const dataToSave = { 
          ...data, 
          currentStep 
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
      } catch (e) {
        console.error('Error saving calculator data:', e)
      }
    }
  }, [data, currentStep, isInitialized])


  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    const element = document.getElementById('calculator')
    if (element) {
      observer.observe(element)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    calculatePrice()
  }, [data, houseTypes, finishingOptions, additionalOptions])

  const calculatePrice = () => {
    const houseTypeData = houseTypes.find(ht => ht.id === data.houseType)
    if (!houseTypeData) return

    // Вычисляем общий метраж
    const totalLength = (data.pipeLength || data.area / (data.quantity || 1)) * (data.quantity || 1)
    
    let basePrice = houseTypeData.basePrice * totalLength

    // Добавляем стоимость отделки
    data.finishing.forEach(finishId => {
      const finish = finishingOptions.find(f => f.id === finishId)
      if (finish) {
        basePrice += basePrice * finish.multiplier
      }
    })

    // Добавляем дополнительные опции
    data.options.forEach(optionId => {
      const option = additionalOptions.find(o => o.id === optionId)
      if (option) {
        basePrice += option.price
      }
    })

    setEstimatedPrice(Math.round(basePrice))
  }

  const handleHouseTypeChange = (type: string) => {
    setData(prev => ({ ...prev, houseType: type }))
    console.log('Calculator step completed:', { step: 1, houseType: type })
  }

  const handleAreaChange = (area: number) => {
    setData(prev => ({ ...prev, area }))
    console.log('Calculator step completed:', { step: 2, area })
  }

  const handlePipeLengthChange = (pipeLength: number) => {
    setData(prev => {
      const totalLength = pipeLength * (prev.quantity || 1)
      return { ...prev, pipeLength, area: totalLength }
    })
    console.log('Calculator step completed:', { step: 2, pipeLength })
  }

  const handleQuantityChange = (quantity: number) => {
    setData(prev => {
      const totalLength = (prev.pipeLength || prev.area / (prev.quantity || 1)) * quantity
      return { ...prev, quantity, area: totalLength }
    })
    console.log('Calculator step completed:', { step: 2, quantity })
  }

  const handleFinishingChange = (finishId: string) => {
    setData(prev => ({
      ...prev,
      // На шаге 3 разрешаем выбрать только одну опцию (радиокнопка)
      finishing: [finishId]
    }))
    console.log('Calculator step completed:', { step: 3, selectedFinishing: finishId })
  }

  const handleOptionChange = (optionId: string) => {
    setData(prev => ({
      ...prev,
      // На шаге 4 разрешаем выбрать только одну опцию (радиокнопка)
      options: [optionId]
    }))
    console.log('Calculator step completed:', { step: 4, selectedOption: optionId })
  }

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽'
  }

  const getHouseTypeName = () => {
    return houseTypes.find(t => t.id === data.houseType)?.name || data.houseType
  }

  const getSelectedFinishing = () => {
    return data.finishing.map(id => finishingOptions.find(f => f.id === id)?.name).filter(Boolean).join(', ') || 'Не выбрано'
  }

  const getSelectedOptions = () => {
    return data.options.map(id => additionalOptions.find(o => o.id === id)).filter(Boolean)
  }

  const handleGetCalculation = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Формируем сообщение для WhatsApp с данными калькулятора
    const houseTypeName = getHouseTypeName()
    const finishing = getSelectedFinishing()
    const selectedOptions = getSelectedOptions()
    const optionsText = selectedOptions.length > 0 
      ? selectedOptions.map(opt => opt?.name).filter(Boolean).join(', ')
      : 'Не выбрано'
    
    const message = `🔧 ЗАПРОС ТОЧНОГО РАСЧЁТА ТРУБ

📋 Параметры:
• Тип труб: ${houseTypeName}
• Метраж одной трубы: ${data.pipeLength || 6} м
• Количество труб: ${data.quantity || 1} шт
• Общий метраж: ${data.area || (data.pipeLength || 6) * (data.quantity || 1)} м

🎨 Обработка/покрытие:
${finishing}

✨ Дополнительные услуги:
${optionsText}

💰 Предварительная стоимость:
${formatPrice(estimatedPrice)}

📞 Прошу связаться со мной для получения точного расчёта и консультации!`
    
    // Открываем WhatsApp
    const whatsappNumber = '79313023008'
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <section id="calculator" className="py-20 bg-white scroll-mt-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Калькулятор стоимости труб
          </h2>
          <p className="text-xl text-gray-600">
            Получите предварительную оценку стоимости материалов
          </p>
        </div>

        {/* Калькулятор */}
        <div className={`transition-all duration-500 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            {/* Прогресс бар */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium text-gray-600">
                  Шаг {currentStep} из 4
                </span>
                <span className="text-sm font-medium text-gray-600">
                  {Math.round((currentStep / 4) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(currentStep / 4) * 100}%`,
                    backgroundColor: '#1E3A5F'
                  }}
                ></div>
              </div>
            </div>

            {/* Шаг 1: Тип труб */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  {stepTexts.step1Title || 'Выберите тип труб'}
                </h3>
                <div className={`grid grid-cols-1 ${houseTypes.length === 1 ? 'md:grid-cols-1 max-w-sm mx-auto' : houseTypes.length === 2 ? 'md:grid-cols-2 max-w-2xl mx-auto' : 'md:grid-cols-3 max-w-4xl mx-auto'} gap-6 justify-items-center`}>
                  {houseTypes.map((type) => (
                    <div
                      key={type.id}
                      className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all duration-200 w-full max-w-xs flex flex-col items-center justify-center ${
                        data.houseType === type.id
                          ? 'border-[#1E3A5F] bg-[#E8F0F8]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleHouseTypeChange(type.id)}
                    >
                      <div className="text-center w-full">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2 text-center">
                          {type.name}
                        </h4>
                        <p className="text-sm text-gray-600 text-center">
                          от {formatPrice(type.basePrice)} за м
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Шаг 2: Метраж и количество */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  {stepTexts.step2Title || 'Укажите метраж и количество'}
                </h3>
                <div className="space-y-8">
                  {/* Метраж одной трубы */}
                  <div className="space-y-4">
                    <label className="block text-lg font-medium text-gray-700">
                      Метраж одной трубы: {data.pipeLength || 6} м
                    </label>
                    <input
                      type="range"
                      min={areaSettings.minArea || 1}
                      max={areaSettings.maxArea || 12}
                      value={data.pipeLength || 6}
                      onChange={(e) => handlePipeLengthChange(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      style={{ accentColor: '#1E3A5F' }}
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{areaSettings.minArea || 1} м</span>
                      <span>{areaSettings.maxArea || 12} м</span>
                    </div>
                  </div>

                  {/* Количество труб */}
                  <div className="space-y-4">
                    <label className="block text-lg font-medium text-gray-700">
                      Количество труб: {data.quantity || 1} шт.
                    </label>
                    <input
                      type="range"
                      min={areaSettings.minQuantity || 1}
                      max={areaSettings.maxQuantity || 100}
                      value={data.quantity || 1}
                      onChange={(e) => handleQuantityChange(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      style={{ accentColor: '#1E3A5F' }}
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{areaSettings.minQuantity || 1} шт.</span>
                      <span>{areaSettings.maxQuantity || 100} шт.</span>
                    </div>
                  </div>

                  {/* Общий метраж */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Общий метраж:</p>
                    <p className="text-xl font-bold text-gray-900">
                      {((data.pipeLength || 6) * (data.quantity || 1)).toFixed(1)} м
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Шаг 3: Отделка */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  {stepTexts.step3Title || 'Выберите тип отделки'}
                </h3>
                <div className="space-y-4">
                  {finishingOptions.map((option) => (
                    <label key={option.id} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="finishingOption"
                        checked={data.finishing.includes(option.id)}
                        onChange={() => handleFinishingChange(option.id)}
                        className="w-5 h-5 border-gray-300 focus:ring-[#1E3A5F]"
                        style={{ accentColor: '#1E3A5F' }}
                      />
                      <span className="text-lg text-gray-700">{option.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Шаг 4: Дополнительные опции */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  {stepTexts.step4Title || 'Дополнительные опции'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {additionalOptions.map((option) => (
                    <label key={option.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="additionalOption"
                          checked={data.options.includes(option.id)}
                          onChange={() => handleOptionChange(option.id)}
                          className="w-5 h-5 border-gray-300 focus:ring-[#1E3A5F]"
                          style={{ accentColor: '#1E3A5F' }}
                        />
                        <span className="text-lg text-gray-700">{option.name}</span>
                      </div>
                      <span className="font-semibold" style={{ color: '#1E3A5F' }}>
                        +{formatPrice(option.price)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Результат */}
            {currentStep === 4 && (
              <div className="mt-8 p-6 rounded-xl" style={{ backgroundColor: '#E8F0F8' }}>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Предварительная стоимость
                </h3>
                <div className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#1E3A5F' }}>
                  {formatPrice(estimatedPrice)}
                </div>
                <p className="text-gray-600 mb-6">
                  Точная стоимость будет рассчитана после общения с менеджером
                </p>
                
                {/* Кнопка получения точного расчёта */}
                <div className="flex justify-center">
                  <button
                    onClick={handleGetCalculation}
                    type="button"
                    className="group relative px-8 py-4 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl inline-flex items-center justify-center gap-2"
                    style={{ 
                      backgroundColor: '#1E3A5F',
                      willChange: 'transform',
                      backfaceVisibility: 'hidden'
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="relative z-10">Получить точный расчёт</span>
                  </button>
                </div>
              </div>
            )}

            {/* Навигация */}
            <div className="flex justify-between mt-8">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-semibold rounded-lg transition-colors duration-200"
              >
                Назад
              </button>
              {currentStep < 4 && (
                <button
                  onClick={nextStep}
                  className="px-6 py-2 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
                  style={{ 
                    backgroundColor: '#1E3A5F',
                    willChange: 'transform',
                    backfaceVisibility: 'hidden'
                  }}
                >
                  Далее
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

    </section>
  )
}
