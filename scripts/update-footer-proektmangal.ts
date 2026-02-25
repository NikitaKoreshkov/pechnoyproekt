/**
 * Обновление футера и контактов для ProektMangal
 * WhatsApp: +7 (952) 131-52-82
 *
 * Запуск: npx tsx scripts/update-footer-proektmangal.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const WHATSAPP_NUMBER = '79521315282'
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`

const FOOTER_DATA = {
  companyName: 'ProektMangal.ru',
  companyDescription: 'Печи, камины, барбекю',
  whatsappUrl: WHATSAPP_URL,
  whatsappText:
    'ProektMangal.ru\n\nЗдравствуйте! Хочу узнать больше о печных комплексах и мангалах.\n\nГотов(а) ответить на ваши вопросы!',
  phone: '+7 (952) 131-52-82',
  phone2: '+7 (982) 709-32-57',
  email: '89521315282@mail.ru',
  addressLine1: 'г. Екатеринбург, ул. Рощинская 71 а',
  addressLine2: '',
  addressLine3: '',
  workingHoursLine1: 'Пн-Сб с 9:00 до 20:00',
  workingHoursLine2: 'Вс — выходной',
  newsletterTitle: 'Новости и акции',
  newsletterDescription:
    'Подпишитесь на рассылку и получайте информацию о новых проектах и специальных предложениях',
  copyright: '© 2025 ProektMangal. Все права защищены.',
  ip: 'СМЗ Бушуева Марина Викторовна',
  inn: '',
  legalAddress: 'г. Екатеринбург, ул. Рощинская 71 а',
  youtubeUrl: 'https://www.youtube.com/channel/UCwthYpA8PPvh6DLqUKKaG1w',
  telegramUrl: 'https://t.me/proektmangal96',
  vkUrl: 'https://vk.com/public45498931',
}

async function main() {
  console.log('🔄 Обновление FooterConfig...')

  const existing = await prisma.footerConfig.findFirst()

  if (existing) {
    await prisma.footerConfig.update({
      where: { id: existing.id },
      data: {
        ...FOOTER_DATA,
        addressLine2: FOOTER_DATA.addressLine2 || existing.addressLine2,
        addressLine3: FOOTER_DATA.addressLine3 || existing.addressLine3,
        inn: FOOTER_DATA.inn || existing.inn,
        updatedAt: new Date(),
      },
    })
    console.log('✅ FooterConfig обновлён')
  } else {
    await prisma.footerConfig.create({
      data: {
        id: 'default',
        ...FOOTER_DATA,
        updatedAt: new Date(),
      },
    })
    console.log('✅ FooterConfig создан')
  }

  console.log('\n📋 Контакты:')
  console.log('   Телефон:', FOOTER_DATA.phone, FOOTER_DATA.phone2)
  console.log('   Email:', FOOTER_DATA.email)
  console.log('   WhatsApp:', WHATSAPP_URL)
  console.log('   YouTube:', FOOTER_DATA.youtubeUrl)
  console.log('   Telegram:', FOOTER_DATA.telegramUrl)
  console.log('   VK:', FOOTER_DATA.vkUrl)
  console.log('\n🎉 Готово!')
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
