/**
 * Скрипт для обновления реквизитов компании и режима работы в БД
 * Запуск: npx tsx scripts/update-company-details.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateCompanyDetails() {
  try {
    console.log('🔄 Начинаю обновление реквизитов компании и режима работы...')

    const existing = await prisma.footerConfig.findFirst()
    
    if (existing) {
      console.log('📋 Текущие данные в БД:')
      console.log('   Адрес:', existing.addressLine1, existing.addressLine2, existing.addressLine3)
      console.log('   Режим работы:', existing.workingHoursLine1, existing.workingHoursLine2)
      console.log('   ИП/ООО:', existing.ip)
      console.log('   ИНН:', existing.inn)
      console.log('   Юридический адрес:', existing.legalAddress)
      
      const updated = await prisma.footerConfig.update({
        where: { id: existing.id },
        data: {
          addressLine1: '188680, Ленинградская обл.,',
          addressLine2: 'Всеволожский р-н, г. Колтуши,',
          addressLine3: 'ул. Мира, д. 9, кв. 222',
          workingHoursLine1: 'Пн-Пт: 9:00 - 18:00',
          workingHoursLine2: 'Сб-Вс: выходные',
          ip: 'ООО "АКВАГАЗТЕХ"',
          inn: 'ИНН: 4706094590, КПП: 470601001, ОГРН: 1254700021575',
          legalAddress: 'Юридический адрес: 188680, РОССИЯ, ЛЕНИНГРАДСКАЯ ОБЛ, ВСЕВОЛОЖСКИЙ Р-Н, Г КОЛТУШИ, УЛ МИРА, Д 9, КВ 222'
        }
      })
      
      console.log('\n✅ Данные в БД обновлены:')
      console.log('   Адрес:', updated.addressLine1, updated.addressLine2, updated.addressLine3)
      console.log('   Режим работы:', updated.workingHoursLine1, updated.workingHoursLine2)
      console.log('   ООО:', updated.ip)
      console.log('   ИНН/КПП/ОГРН:', updated.inn)
      console.log('   Юридический адрес:', updated.legalAddress)
    } else {
      console.log('⚠️  Конфигурация футера не найдена в БД. Создаю новую...')
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

    console.log('\n✅ Обновление завершено успешно!')
  } catch (error) {
    console.error('❌ Ошибка при обновлении:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateCompanyDetails()
  .then(() => {
    console.log('🎉 Скрипт выполнен успешно')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Критическая ошибка:', error)
    process.exit(1)
  })
