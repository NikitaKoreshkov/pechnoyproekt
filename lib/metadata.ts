import { prisma } from './prisma'
import type { Metadata } from 'next'

export async function getSiteMetadata(): Promise<{
  siteTitle: string
  siteDescription: string
  siteKeywords: string
  ogImage: string
  companyName: string
}> {
  try {
    const [metadataConfig, footerConfig] = await Promise.all([
      prisma.siteMetadataConfig.findFirst(),
      prisma.footerConfig.findFirst()
    ])

    const companyName = footerConfig?.companyName || 'АкваГазТех'
    
    return {
      siteTitle: metadataConfig?.siteTitle || `Трубы ПНД и комплектующие | ${companyName} - Качественные материалы для инженерных систем`,
      siteDescription: metadataConfig?.siteDescription || 'Поставка качественных труб ПНД (ПЭ) и комплектующих для водопровода, канализации и газопровода. Широкий ассортимент, быстрая доставка, гарантия качества.',
      siteKeywords: metadataConfig?.siteKeywords || 'трубы ПНД, трубы ПЭ, комплектующие для труб, водопровод, канализация, газопровод, фитинги, Москва, Россия',
      ogImage: metadataConfig?.ogImage || '/images/1.png',
      companyName
    }
  } catch (error) {
    console.error('[METADATA] Error loading metadata:', error)
    return {
      siteTitle: 'Трубы ПНД и комплектующие | АкваГазТех',
      siteDescription: 'Поставка качественных труб ПНД (ПЭ) и комплектующих для водопровода, канализации и газопровода.',
      siteKeywords: 'трубы ПНД, трубы ПЭ, комплектующие для труб, водопровод, канализация, газопровод, фитинги, Москва, Россия',
      ogImage: '/images/1.png',
      companyName: 'АкваГазТех'
    }
  }
}

export async function generateSiteMetadata(): Promise<Metadata> {
  const metadata = await getSiteMetadata()
  const baseUrl = 'https://aquagazteh.ru'

  return {
    title: metadata.siteTitle,
    description: metadata.siteDescription,
    keywords: metadata.siteKeywords,
    authors: [{ name: metadata.companyName }],
    creator: metadata.companyName,
    publisher: metadata.companyName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: '/',
    },
    openGraph: {
      title: metadata.siteTitle.split(' - ')[0] || metadata.siteTitle,
      description: metadata.siteDescription,
      url: baseUrl,
      siteName: metadata.companyName,
      images: [
        {
          url: metadata.ogImage,
          width: 1200,
          height: 630,
          alt: `Трубы ПНД и комплектующие от ${metadata.companyName}`,
        },
      ],
      locale: 'ru_RU',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: metadata.siteTitle.split(' - ')[0] || metadata.siteTitle,
      description: metadata.siteDescription,
      images: [metadata.ogImage],
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}
