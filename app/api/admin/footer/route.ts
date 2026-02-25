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
          companyName: 'Печнойпроект',
          companyDescription: 'Качественные услуги и продукция. Надёжно, выгодно, с гарантией качества.',
          whatsappUrl: 'https://max.ru/u/f9LHodD0cOIpDPuCcMZgHcMs8Q34keKCS0fVwDTH9yLudQ6BH_47EGRwPTE',
          whatsappText: 'Печнойпроект\n\nЗдравствуйте! Хочу узнать больше о печных комплексах и мангалах.\n\nГотов(а) ответить на ваши вопросы!',
          phone: '+7 (952) 131-52-82',
          email: 'agtspb@inbox.ru',
          addressLine1: 'Санкт-Петербург',
          addressLine2: '',
          addressLine3: '',
          workingHoursLine1: 'Пн-Пт: 9:00 - 18:00',
          workingHoursLine2: 'Сб-Вс: выходные',
          newsletterTitle: 'Новости и акции',
          newsletterDescription: 'Подпишитесь на рассылку и получайте информацию о новых поступлениях и специальных предложениях',
          copyright: '© 2025. Все права защищены.',
          ip: 'ООО "АКВАГАЗТЕХ"',
          inn: 'ИНН: 4706094590, КПП: 470601001, ОГРН: 1254700021575',
          legalAddress: 'Санкт-Петербург'
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
      phone2,
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
      legalAddress,
      youtubeUrl,
      telegramUrl,
      vkUrl,
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
            phone2: phone2 ?? undefined,
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
            legalAddress,
            youtubeUrl: youtubeUrl ?? undefined,
            telegramUrl: telegramUrl ?? undefined,
            vkUrl: vkUrl ?? undefined,
          }
        })
      : await prisma.footerConfig.create({
          data: {
            companyName,
            companyDescription,
            whatsappUrl,
            whatsappText,
            phone,
            phone2: phone2 ?? undefined,
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
            legalAddress,
            youtubeUrl: youtubeUrl ?? undefined,
            telegramUrl: telegramUrl ?? undefined,
            vkUrl: vkUrl ?? undefined,
          }
        })

    console.log('[ADMIN FOOTER] POST - Saved config:', config.id)
    return NextResponse.json(config)
  } catch (error: any) {
    console.error('[ADMIN FOOTER] POST Error:', error)
    return NextResponse.json({ error: 'Ошибка сохранения конфигурации' }, { status: 500 })
  }
}

