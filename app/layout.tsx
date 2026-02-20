import type { Metadata } from 'next'
import { Inter, Lora } from 'next/font/google'
import './globals.css'
import Providers from '@/components/providers/SessionProvider'
import { FavoritesCompareProvider } from '@/components/providers/FavoritesCompareProvider'
import MetadataTags from '@/components/MetadataTags'
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const metadata = await getSiteMetadata()
  const baseUrl = 'https://aquagazteh.ru'
  const companyName = metadata.companyName

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
          telephone: '+7-495-023-82-15',
          contactType: 'customer service',
          areaServed: 'RU',
          availableLanguage: 'Russian'
        },
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Всеволожский р-н, г. Колтуши, ул. Мира, д. 9, кв. 222',
          addressLocality: 'Колтуши',
          addressRegion: 'Ленинградская область',
          postalCode: '188680',
          addressCountry: 'RU'
        },
        sameAs: [
          'https://facebook.com/аквагазтех',
          'https://instagram.com/аквагазтех'
        ]
      },
      {
        '@type': 'LocalBusiness',
        '@id': `${baseUrl}/#localbusiness`,
        name: `${companyName} - Поставка труб ПНД и комплектующих`,
        image: `${baseUrl}${metadata.ogImage}`,
        telephone: '+7-931-302-30-08',
        email: 'agtspb@inbox.ru',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Всеволожский р-н, г. Колтуши, ул. Мира, д. 9, кв. 222',
          addressLocality: 'Колтуши',
          addressRegion: 'Ленинградская область',
          postalCode: '188680',
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
          <FavoritesCompareProvider>{children}</FavoritesCompareProvider>
        </Providers>
      </body>
    </html>
  )
}
