/**
 * Скрипт для обновления данных футера под тематику продажи труб
 * Запуск: npx tsx scripts/update-footer-for-pipes.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateFooterForPipes() {
  try {
    console.log('🔄 Начинаю обновление данных футера под продажу труб...')

    const existing = await prisma.footerConfig.findFirst()
    
    if (existing) {
      const updated = await prisma.footerConfig.update({
        where: { id: existing.id },
        data: {
          companyName: 'АкваГазТех',
          companyDescription: 'Поставка качественных труб ПНД и комплектующих для инженерных систем. Надежно, выгодно, с гарантией качества.',
          whatsappUrl: 'https://wa.me/79313023008',
          whatsappText: '🔧 АкваГазТех\n\nЗдравствуйте! Хочу узнать больше о трубах ПНД и материалах.\n\nГотов(а) ответить на ваши вопросы!',
          phone: '+7 (931) 302-30-08',
          email: 'agtspb@inbox.ru',
          copyright: '© 2025 АкваГазТех. Все права защищены.',
          newsletterDescription: 'Подпишитесь на рассылку и получайте информацию о новых поступлениях и специальных предложениях'
        }
      })
      console.log('✅ Данные футера обновлены:', updated.id)
      console.log('   Название компании:', updated.companyName)
      console.log('   Телефон:', updated.phone)
      console.log('   Email:', updated.email)
      console.log('   Копирайт:', updated.copyright)
    } else {
      const created = await prisma.footerConfig.create({
        data: {
          companyName: 'АкваГазТех',
          companyDescription: 'Поставка качественных труб ПНД и комплектующих для инженерных систем. Надежно, выгодно, с гарантией качества.',
          whatsappUrl: 'https://wa.me/79313023008',
          whatsappText: '🔧 АкваГазТех\n\nЗдравствуйте! Хочу узнать больше о трубах ПНД и материалах.\n\nГотов(а) ответить на ваши вопросы!',
          phone: '+7 (931) 302-30-08',
          email: 'agtspb@inbox.ru',
          addressLine1: '188680, Ленинградская обл.,',
          addressLine2: 'Всеволожский р-н, г. Колтуши,',
          addressLine3: 'ул. Мира, д. 9, кв. 222',
          workingHoursLine1: 'Пн-Пт: 9:00 - 18:00',
          workingHoursLine2: 'Сб-Вс: выходные',
          newsletterTitle: 'Новости и акции',
          newsletterDescription: 'Подпишитесь на рассылку и получайте информацию о новых поступлениях и специальных предложениях',
          copyright: '© 2025 АкваГазТех. Все права защищены.',
          ip: 'ООО "АКВАГАЗТЕХ"',
          inn: 'ИНН: 4706094590, КПП: 470601001, ОГРН: 1254700021575',
          legalAddress: 'Юридический адрес: 188680, РОССИЯ, ЛЕНИНГРАДСКАЯ ОБЛ, ВСЕВОЛОЖСКИЙ Р-Н, Г КОЛТУШИ, УЛ МИРА, Д 9, КВ 222'
        }
      })
      console.log('✅ Данные футера созданы:', created.id)
    }

    console.log('✅ Обновление завершено успешно!')
  } catch (error) {
    console.error('❌ Ошибка при обновлении:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateFooterForPipes()
  .then(() => {
    console.log('🎉 Скрипт выполнен успешно')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Критическая ошибка:', error)
    process.exit(1)
  })
