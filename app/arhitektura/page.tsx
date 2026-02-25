import Header from '@/components/Header'
import PortfolioVid from '@/components/PortfolioVid'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Архитектура решений',
  description: 'Вид проекта — визуализация, разрезы, порядовка',
}

export default function ArhitekturaPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#FAF7F2] via-[#F5F0E8] to-[#EDE8E0] pt-16">
      <Header />
      <PortfolioVid />
      <p className="text-center py-12 text-[#5C3825]/70 text-sm">
        Остались вопросы? Свяжитесь с нами — контакты внизу страницы.
      </p>
      <Footer />
    </main>
  )
}
