import Header from '@/components/Header'
import AboutPageContent from '@/components/AboutPageContent'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'О нас — Печнойпроект | Печные комплексы, мангалы и барбекю',
  description: 'Печнойпроект — ваш надёжный партнёр. Проектирование и строительство мангалов, печей, барбекю-зон. Качественные материалы, авторский подход, гарантия на десятилетия.',
}

export default function ONasPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#FAF7F2] via-[#F5F0E8] to-[#EDE8E0]">
      <Header />
      <AboutPageContent />
      <Footer />
    </main>
  )
}
