import dynamic from 'next/dynamic'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import ProjectsCatalog from '@/components/ProjectsCatalog'
import AboutCompany from '@/components/AboutCompany'
import Advantages from '@/components/Advantages'
import ContactsCTA from '@/components/ContactsCTA'
import Footer from '@/components/Footer'
import { prisma } from '@/lib/prisma'

// Динамические импорты для тяжелых компонентов (lazy loading)
const Calculator = dynamic(() => import('@/components/Calculator'), {
  ssr: true, // SSR нужен для SEO
})

const ReviewsGallery = dynamic(() => import('@/components/ReviewsGallery'), {
  ssr: false, // Можно отключить SSR так как это интерактивный компонент
})

const FAQ = dynamic(() => import('@/components/FAQ'), {
  ssr: false, // Отключаем SSR для FAQ чтобы данные всегда загружались на клиенте в реальном времени
})

const defaultHeroConfig = {
  heroImage: '/images/1.png',
  title: 'Трубы ПНД и комплектующие для инженерных систем',
  subtitle: 'Надёжно. Выгодно. С гарантией качества.'
}

export default async function Home() {
  const heroConfig = await prisma.heroConfig.findFirst().catch(() => null)
  const initialHero = heroConfig
    ? { heroImage: heroConfig.heroImage, title: heroConfig.title, subtitle: heroConfig.subtitle }
    : defaultHeroConfig

  return (
    <main className="min-h-screen">
      <Header />
      <Hero initialConfig={initialHero} />
      <ProjectsCatalog />
      <Calculator />
      <AboutCompany />
      <Advantages />
      <ReviewsGallery />
      <FAQ />
      <ContactsCTA />
      <Footer />
    </main>
  )
}
