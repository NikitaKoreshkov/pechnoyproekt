import type { Metadata } from 'next'
import { Inter, Lora } from 'next/font/google'
import './globals.css'
import dynamicImport from 'next/dynamic'
import Providers from '@/components/providers/SessionProvider'
import { FavoritesCompareProvider } from '@/components/providers/FavoritesCompareProvider'
import MetadataTags from '@/components/MetadataTags'

const AIAssistant = dynamicImport(() => import('@/components/AIAssistant'), { ssr: false })
import { generateSiteMetadata, getSiteMetadata } from '@/lib/metadata'

// Отключаем кеширование для динамических метаданных
export const dynamic = 'force-dynamic'
export const revalidate = 0

const inter = Inter({ 
  subsets: ['cyrillic', 'latin'],
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700', '800', '900']
})

const lora = Lora({ 
  subsets: ['cyrillic', 'latin'],
  variable: '--font-lora',
  weight: ['400', '500', '600', '700']
})

export async function generateMetadata(): Promise<Metadata> {
  return generateSiteMetadata()
}

const defaultCompanyName = 'Печнойпроект'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let companyName = defaultCompanyName
  let ogImage = '/images/1.png'
  try {
    const metadata = await getSiteMetadata()
    companyName = metadata.companyName
    ogImage = metadata.ogImage
  } catch (_) {
    // используем дефолты при любой ошибке (БД, Prisma и т.д.)
  }
  const baseUrl = 'https://xn--e1aalfmgbdekz5c.xn--p1ai'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`,
        name: companyName,
        url: baseUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${baseUrl}/logo.png`,
          width: 200,
          height: 60
        },
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+7-952-131-52-82',
          contactType: 'customer service',
          areaServed: 'RU',
          availableLanguage: 'Russian'
        },
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Санкт-Петербург',
          addressCountry: 'RU'
        },
        sameAs: [
          'https://www.youtube.com/channel/UCwthYpA8PPvh6DLqUKKaG1w',
          'https://t.me/proektmangal96',
          'https://vk.com/public45498931'
        ]
      },
      {
        '@type': 'LocalBusiness',
        '@id': `${baseUrl}/#localbusiness`,
        name: `${companyName} - Печи, камины, барбекю`,
        image: `${baseUrl}${ogImage}`,
        telephone: '+7-952-131-52-82',
        email: '89521315282@mail.ru',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Санкт-Петербург',
          addressCountry: 'RU'
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 59.9333,
          longitude: 30.6500
        },
        url: baseUrl,
        priceRange: '$$',
        openingHoursSpecification: {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          opens: '09:00',
          closes: '18:00'
        },
        serviceArea: {
          '@type': 'GeoCircle',
          geoMidpoint: {
            '@type': 'GeoCoordinates',
            latitude: 59.9333,
            longitude: 30.6500
          },
          geoRadius: '100000'
        }
      },
      {
        '@type': 'Service',
        '@id': `${baseUrl}/#service`,
        name: 'Трубы ПНД и комплектующие для инженерных систем',
        description: 'Полный спектр услуг по поставке труб ПНД (ПЭ) и комплектующих для водопровода, канализации и газопровода',
        provider: {
          '@id': `${baseUrl}/#organization`
        },
        areaServed: {
          '@type': 'Country',
          name: 'Россия'
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Каталог товаров',
          itemListElement: [
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Product',
                name: 'Трубы ПНД и комплектующие',
                description: 'Качественные трубы ПНД (ПЭ) и комплектующие для водопровода, канализации и газопровода'
              }
            }
          ]
        }
      }
    ]
  }

  return (
    <html lang="ru" className={`${inter.variable} ${lora.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <MetadataTags />
      </head>
      <body className="font-inter">
        <Providers>
          <FavoritesCompareProvider>
            {children}
            <AIAssistant />
          </FavoritesCompareProvider>
        </Providers>
      </body>
    </html>
  )
}
