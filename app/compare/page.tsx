'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface Project {
  id: string
  title: string
  area: number
  priceFrom: number
  priceTo?: number
  floors: number
  material: string
  buildTime: number
  completion: string
  region: string
  image: string
  tags: string[]
}

export default function ComparePage() {
  const [compareItems, setCompareItems] = useState<Project[]>([])

  useEffect(() => {
    // Загрузка из localStorage или API
    const saved = localStorage.getItem('project-compare')
    if (saved) {
      // TODO: Загрузить полноценные данные через API
      const items = JSON.parse(saved)
      setCompareItems(items)
    }
  }, [])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽'
  }

  const removeFromCompare = (id: string) => {
    setCompareItems(items => items.filter(item => item.id !== id))
    // TODO: Сохранить в localStorage/API
  }

  if (compareItems.length === 0) {
    return (
      <>
        <Header />
        <main className="pt-16 pb-20 min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-6">Сравнение проектов</h1>
              <p className="text-xl text-gray-600 mb-8">Выберите проекты для сравнения в каталоге</p>
              <Link
                href="/catalog"
                className="inline-block px-8 py-4 bg-black text-white font-bold rounded-lg text-lg"
              >
                Перейти в каталог
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="pt-16 pb-20 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Сравнение проектов</h1>

          <div className="overflow-x-auto">
            <table className="w-full bg-white border-2 border-black">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="px-6 py-4 text-left text-sm font-bold">Характеристики</th>
                  {compareItems.map(item => (
                    <th key={item.id} className="px-6 py-4 text-center align-top">
                      <div className="relative">
                        <button
                          onClick={() => removeFromCompare(item.id)}
                          className="absolute top-0 right-0 text-white"
                          aria-label="Удалить из сравнения"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <div className="aspect-[4/3] mb-4">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                        <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                        <Link
                          href={`/project/${item.id}`}
                          className="text-white underline text-sm"
                        >
                          Подробнее
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-200">
                <tr>
                  <td className="px-6 py-4 font-bold text-gray-900">Диаметр</td>
                  {compareItems.map(item => (
                    <td key={`area-${item.id}`} className="px-6 py-4 text-center text-gray-700">
                      {item.area} мм
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 font-bold text-gray-900">Материал</td>
                  {compareItems.map(item => (
                    <td key={`material-${item.id}`} className="px-6 py-4 text-center text-gray-700 capitalize">
                      {item.material}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 font-bold text-gray-900">Длина</td>
                  {compareItems.map(item => (
                    <td key={`buildTime-${item.id}`} className="px-6 py-4 text-center text-gray-700">
                      {item.buildTime} м
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 font-bold text-gray-900">Комплектация</td>
                  {compareItems.map(item => (
                    <td key={`completion-${item.id}`} className="px-6 py-4 text-center text-gray-700">
                      {item.completion}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 font-bold text-gray-900">Регион</td>
                  {compareItems.map(item => (
                    <td key={`region-${item.id}`} className="px-6 py-4 text-center text-gray-700">
                      {item.region}
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-100">
                  <td className="px-6 py-4 font-bold text-gray-900">Цена</td>
                  {compareItems.map(item => (
                    <td key={`price-${item.id}`} className="px-6 py-4 text-center">
                      <div className="text-xl font-bold text-gray-900">
                        {item.priceTo 
                          ? `${formatPrice(item.priceFrom)} - ${formatPrice(item.priceTo)}`
                          : `от ${formatPrice(item.priceFrom)}`
                        }
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
