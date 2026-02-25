/**
 * Скрипт для обновления юридических документов в БД
 * (Политика конфиденциальности, Условия использования, Политика Cookie)
 *
 * Запуск: npx tsx scripts/update-legal-docs.ts
 */

import { PrismaClient } from '@prisma/client'
import { legalContents } from '../lib/legal-content'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Обновление юридических документов...\n')

  // Privacy
  const privacy = await prisma.privacyConfig.findFirst()
  if (privacy) {
    await prisma.privacyConfig.update({
      where: { id: privacy.id },
      data: legalContents.privacy
    })
    console.log('✅ Обновлено: Политика конфиденциальности')
  } else {
    await prisma.privacyConfig.create({ data: legalContents.privacy })
    console.log('✅ Создано: Политика конфиденциальности')
  }

  // Terms
  const terms = await prisma.termsConfig.findFirst()
  if (terms) {
    await prisma.termsConfig.update({
      where: { id: terms.id },
      data: legalContents.terms
    })
    console.log('✅ Обновлено: Условия использования')
  } else {
    await prisma.termsConfig.create({ data: legalContents.terms })
    console.log('✅ Создано: Условия использования')
  }

  // Cookies
  const cookies = await prisma.cookiesConfig.findFirst()
  if (cookies) {
    await prisma.cookiesConfig.update({
      where: { id: cookies.id },
      data: legalContents.cookies
    })
    console.log('✅ Обновлено: Политика Cookie')
  } else {
    await prisma.cookiesConfig.create({ data: legalContents.cookies })
    console.log('✅ Создано: Политика Cookie')
  }

  console.log('\n✅ Готово! Юридические документы обновлены.')
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
