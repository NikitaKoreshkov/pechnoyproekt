import Header from '@/components/Header'
import PortfolioKladka from '@/components/PortfolioKladka'
import PortfolioTypes from '@/components/PortfolioTypes'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Воплощённые объекты',
  description: 'Завершённые проекты кладки и типы печей',
}

export default function PortfolioPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#FAF7F2] via-[#F5F0E8] to-[#EDE8E0] pt-16">
      <Header />
      <div className="relative">
        <PortfolioKladka />
        <PortfolioTypes />
      </div>
      <p className="text-center py-12 text-[#5C3825]/70 text-sm">
        Остались вопросы? Свяжитесь с нами — контакты внизу страницы.
      </p>
      <Footer />
    </main>
  )
}
