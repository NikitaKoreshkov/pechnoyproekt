import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function ensureAdmin(session: any) {
  return session?.user && ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')
}

export async function GET() {
  try {
    let config = await prisma.footerConfig.findFirst()
    
    if (!config) {
      config = await prisma.footerConfig.create({
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
    }
    
    // Возвращаем конфигурацию как есть
    const responseConfig = {
      ...config
    }
    
    return NextResponse.json(responseConfig, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Accel-Expires': '0'
      }
    })
  } catch (error: any) {
    console.error('[ADMIN FOOTER] GET Error:', error)
    return NextResponse.json({ error: 'Ошибка загрузки конфигурации' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  console.log('[ADMIN FOOTER] POST - Session:', !!session, session?.user?.email, session?.user?.role)
  if (!ensureAdmin(session)) {
    console.log('[ADMIN FOOTER] POST - Unauthorized')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    console.log('[ADMIN FOOTER] POST - Body:', body)
    const {
      companyName,
      companyDescription,
      whatsappUrl,
      whatsappText,
      phone,
      email,
      addressLine1,
      addressLine2,
      addressLine3,
      workingHoursLine1,
      workingHoursLine2,
      newsletterTitle,
      newsletterDescription,
      copyright,
      ip,
      inn,
      legalAddress
    } = body

    const existingConfig = await prisma.footerConfig.findFirst()
    console.log('[ADMIN FOOTER] POST - Existing config:', !!existingConfig)
    
    const config = existingConfig
      ? await prisma.footerConfig.update({
          where: { id: existingConfig.id },
          data: {
            companyName,
            companyDescription,
            whatsappUrl,
            whatsappText,
            phone,
            email,
            addressLine1,
            addressLine2,
            addressLine3,
            workingHoursLine1,
            workingHoursLine2,
            newsletterTitle,
            newsletterDescription,
            copyright,
            ip,
            inn,
            legalAddress
          }
        })
      : await prisma.footerConfig.create({
          data: {
            companyName,
            companyDescription,
            whatsappUrl,
            whatsappText,
            phone,
            email,
            addressLine1,
            addressLine2,
            addressLine3,
            workingHoursLine1,
            workingHoursLine2,
            newsletterTitle,
            newsletterDescription,
            copyright,
            ip,
            inn,
            legalAddress
          }
        })

    console.log('[ADMIN FOOTER] POST - Saved config:', config.id)
    return NextResponse.json(config)
  } catch (error: any) {
    console.error('[ADMIN FOOTER] POST Error:', error)
    return NextResponse.json({ error: 'Ошибка сохранения конфигурации' }, { status: 500 })
  }
}

