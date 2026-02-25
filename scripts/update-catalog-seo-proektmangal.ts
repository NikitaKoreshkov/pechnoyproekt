/**
 * Обновление SEO-текста каталога — продающий текст для ProektMangal
 * Запуск: npx tsx scripts/update-catalog-seo-proektmangal.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TITLE = 'Каталог продукции и услуг'

const CONTENT = `В каталоге представлены печные комплексы, мангалы, барбекю, камины и банные печи — готовые проекты и индивидуальные решения. Выбирайте из сотен реализованных конструкций или закажите расчёт под ваш участок и бюджет.

Мы проектируем и изготавливаем конструкции любой сложности: от компактного уличного мангала до полноценного печного комплекса с зоной отдыха. Русские печи, каминопечи, барбекю-зоны — каждый проект выполняется с учётом ваших пожеланий и особенностей дома или участка.

Качественные материалы, соблюдение сроков, гарантия на все конструкции. Консультация специалиста и подбор проекта — бесплатно.`

async function main() {
  console.log('🔄 Обновление SEO-текста каталога...')

  const existing = await prisma.catalogSeoTextConfig.findFirst()

  if (existing) {
    await prisma.catalogSeoTextConfig.update({
      where: { id: existing.id },
      data: { title: TITLE, content: CONTENT, updatedAt: new Date() },
    })
    console.log('✅ Запись обновлена:', existing.id)
  } else {
    const created = await prisma.catalogSeoTextConfig.create({
      data: {
        id: 'default',
        title: TITLE,
        content: CONTENT,
        updatedAt: new Date(),
      },
    })
    console.log('✅ Запись создана:', created.id)
  }

  console.log('   Заголовок:', TITLE)
  console.log('✅ Готово')
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
