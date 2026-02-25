import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const getContractHTML = (companyName: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.5;
      padding: 50px;
      color: #000;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    .header h1 {
      font-size: 20pt;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .header h2 {
      font-size: 14pt;
      margin-bottom: 20px;
    }
    .date {
      text-align: right;
      font-size: 10pt;
      margin-bottom: 20px;
    }
    .section {
      margin-bottom: 15px;
    }
    .section-title {
      font-size: 12pt;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .text {
      font-size: 10pt;
      text-align: justify;
      margin-bottom: 5px;
    }
    .text-bold {
      font-size: 10pt;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .list-item {
      font-size: 10pt;
      margin-left: 20px;
      margin-bottom: 3px;
    }
    .signature-block {
      margin-top: 30px;
      margin-bottom: 15px;
    }
    .signature-label {
      font-size: 11pt;
      font-weight: bold;
      margin-bottom: 15px;
    }
    .footer {
      margin-top: 30px;
      font-size: 8pt;
      color: #666;
      text-align: center;
    }
    @media print {
      body {
        padding: 20mm;
      }
      .page-break {
        page-break-before: always;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>ДОГОВОР ПОДРЯДА</h1>
    <h2>на поставку товаров и оказание услуг</h2>
  </div>

  <div class="date">
    г. Москва<br>
    «__» __________ 2025 г.
  </div>

  <div class="section">
    <div class="text-bold">${companyName.toUpperCase()}</div>
    <div class="text">ИНН: 4706094590</div>
    <div class="text">КПП: 470601001</div>
    <div class="text">ОГРН: 1254700021575</div>
    <div class="text">Юридический адрес: Санкт-Петербург</div>
    <div class="text">Телефон: +7 (931) 302-30-08</div>
    <div class="text">Расчетный счет: 40702810710002035521</div>
    <div class="text">Банк: АО «ТБанк»</div>
    <div class="text">БИК: 044525974</div>
    <div class="text">Корреспондентский счет: 30101810145250000974</div>
    <div class="text">именуемое в дальнейшем «Поставщик», с одной стороны,</div>
  </div>

  <div class="section">
    <div class="text-bold">Гражданин (ка) Российской Федерации</div>
    <div class="text">Паспорт: серия ______ № ______________</div>
    <div class="text">Выдан: _________________________________________________</div>
    <div class="text">Дата выдачи: ______________</div>
    <div class="text">Адрес регистрации: _____________________________________</div>
    <div class="text">именуемый(ая) в дальнейшем «Заказчик», с другой стороны,</div>
  </div>

  <div class="section">
    <div class="text">совместно именуемые «Стороны», заключили настоящий Договор подряда (далее — «Договор») о нижеследующем:</div>
  </div>

  <div class="section">
    <div class="section-title">1. ПРЕДМЕТ ДОГОВОРА</div>
    <div class="text">1.1. Поставщик обязуется поставить товары и оказать услуги (далее — «Товар»), а Покупатель обязуется принять поставленный товар и оплатить его стоимость в порядке и сроки, установленные настоящим Договором.</div>
    <div class="text">1.2. Технические характеристики Товара:</div>
    <div class="list-item">— Тип труб: __________________________________________________</div>
    <div class="list-item">— Диаметр: __________ мм</div>
    <div class="list-item">— Длина: __________ м</div>
    <div class="list-item">— Количество: __________ шт.</div>
    <div class="list-item">— Адрес доставки: ____________________________________</div>
    <div class="text">1.3. Поставщик поставляет следующие виды товара:</div>
    <div class="list-item">— Продукция согласно спецификации</div>
    <div class="list-item">— Комплектующие</div>
    <div class="list-item">— Дополнительные материалы</div>
    <div class="list-item">— Дополнительные материалы (согласно спецификации)</div>
  </div>

  <div class="section page-break">
    <div class="section-title">2. СТОИМОСТЬ ТОВАРА И ПОРЯДОК РАСЧЕТОВ</div>
    <div class="text">2.1. Общая стоимость товара по настоящему Договору составляет:</div>
    <div class="text-bold" style="margin-left: 20px;">______________________________ рублей (__________________) рублей 00 копеек.</div>
    <div class="text">2.2. Стоимость товара включает в себя стоимость материалов, транспортных расходов, налогов и сборов, подлежащих уплате в соответствии с законодательством Российской Федерации.</div>
    <div class="text">2.3. Детальная спецификация товара является неотъемлемой частью настоящего Договора (Приложение № 1).</div>
    <div class="text">2.4. Порядок оплаты:</div>
    <div class="list-item">— Предоплата при подписании Договора: 50% от общей стоимости — _______________ рублей</div>
    <div class="list-item">— Оплата после доставки товара: 50% от общей стоимости — _______________ рублей</div>
    <div class="text">2.5. Расчеты между Сторонами производятся путем перечисления денежных средств на расчетный счет Поставщика: 40702810710002035521 в АО «ТБанк», БИК: 044525974, корр. счет: 30101810145250000974.</div>
  </div>

  <div class="section">
    <div class="section-title">3. СРОКИ ПОСТАВКИ</div>
    <div class="text">3.1. Срок начала поставки: «__» __________ 2025 г.</div>
    <div class="text">3.2. Срок окончания поставки: «__» __________ 2025 г.</div>
    <div class="text">3.3. Общий срок поставки составляет: ______________ календарных дней с момента начала поставки.</div>
    <div class="text">3.4. В случае нарушения сроков поставки по вине Покупателя (несвоевременная оплата, непредоставление доступа для разгрузки и т.д.) сроки поставки продлеваются на период такого нарушения.</div>
  </div>

  <div class="section">
    <div class="section-title">4. ТРЕБОВАНИЯ К КАЧЕСТВУ ТОВАРА</div>
    <div class="text">4.1. Качество поставляемого товара должно соответствовать:</div>
    <div class="list-item">— ГОСТ 18599-2001 «Трубы напорные из полиэтилена. Технические условия»</div>
    <div class="list-item">— ГОСТ Р 50838-2009 «Трубы из полиэтилена для газопроводов. Технические условия»</div>
    <div class="list-item">— Техническим регламентам Таможенного союза</div>
    <div class="list-item">— Иным действующим нормам и правилам Российской Федерации</div>
    <div class="text">4.2. Все поставляемые материалы должны иметь сертификаты соответствия и документы, подтверждающие их происхождение и качество.</div>
    <div class="text">4.3. Товар должен соответствовать характеристикам, согласованным Сторонами в спецификации.</div>
  </div>

  <div class="section page-break">
    <div class="section-title">5. ОБЯЗАННОСТИ СТОРОН</div>
    <div class="text-bold">5.1. Поставщик обязуется:</div>
    <div class="list-item">— Поставить товар в соответствии с условиями настоящего Договора и спецификацией</div>
    <div class="list-item">— Поставить материалы, соответствующие требованиям технических регламентов</div>
    <div class="list-item">— Обеспечить качество поставляемого товара</div>
    <div class="list-item">— Предоставить все необходимые документы на товар</div>
    <div class="list-item">— Своевременно извещать Покупателя о готовности товара к отгрузке</div>
    <div class="list-item">— Поставить товар Покупателю в установленный срок</div>
    <div class="text-bold">5.2. Покупатель обязуется:</div>
    <div class="list-item">— Своевременно производить оплату в соответствии с условиями настоящего Договора</div>
    <div class="list-item">— Предоставить доступ для разгрузки товара</div>
    <div class="list-item">— Обеспечить условия для приемки товара</div>
    <div class="list-item">— Принять поставленный товар и подписать акт приема-передачи</div>
    <div class="list-item">— Не вмешиваться в деятельность Поставщика, если иное не предусмотрено Договором</div>
  </div>

  <div class="section">
    <div class="section-title">6. ГАРАНТИЙНЫЕ ОБЯЗАТЕЛЬСТВА</div>
    <div class="text">6.1. Поставщик предоставляет гарантию на поставляемый товар в соответствии с гарантийными обязательствами производителя.</div>
    <div class="text">6.2. В гарантийный период Поставщик обязуется заменить товар с выявленными недостатками, возникшими по вине производителя.</div>
    <div class="text">6.3. Гарантия не распространяется на недостатки, возникшие вследствие:</div>
    <div class="list-item">— Нормального износа</div>
    <div class="list-item">— Неправильной эксплуатации товара</div>
    <div class="list-item">— Действий третьих лиц или обстоятельств непреодолимой силы</div>
    <div class="list-item">— Механических повреждений при транспортировке или монтаже</div>
  </div>

  <div class="section">
    <div class="section-title">7. ПРИЕМКА ТОВАРА</div>
    <div class="text">7.1. Приемка поставленного товара производится Покупателем в течение 3 (трех) календарных дней с даты доставки товара.</div>
    <div class="text">7.2. Результаты приемки товара оформляются актом приема-передачи товара по форме, утвержденной законодательством Российской Федерации.</div>
    <div class="text">7.3. При обнаружении недостатков в поставленном товаре Покупатель обязан указать на них в акте приема-передачи или направить Поставщику мотивированный отказ от приемки товара.</div>
    <div class="text">7.4. В случае если Покупатель в установленный срок не приступил к приемке товара либо уклоняется от приемки, товар считается принятым, а акт приема-передачи — подписанным со дня истечения срока приемки.</div>
  </div>

  <div class="section">
    <div class="section-title">8. ОТВЕТСТВЕННОСТЬ СТОРОН</div>
    <div class="text">8.1. За неисполнение или ненадлежащее исполнение обязательств по настоящему Договору Стороны несут ответственность в соответствии с действующим законодательством Российской Федерации.</div>
    <div class="text">8.2. В случае просрочки оплаты Покупателем Поставщик вправе приостановить поставку товара до момента полной оплаты задолженности.</div>
    <div class="text">8.3. В случае просрочки поставки товара по вине Поставщика Поставщик уплачивает Покупателю неустойку в размере 0,1% от стоимости непоставленного товара за каждый день просрочки, но не более 10% от общей стоимости товара.</div>
    <div class="text">8.4. Стороны освобождаются от ответственности за частичное или полное неисполнение обязательств по настоящему Договору, если это неисполнение явилось следствием обстоятельств непреодолимой силы (форс-мажор).</div>
  </div>

  <div class="section">
    <div class="section-title">9. РАЗРЕШЕНИЕ СПОРОВ</div>
    <div class="text">9.1. Все споры и разногласия, возникающие между Сторонами в связи с настоящим Договором, решаются путем переговоров.</div>
    <div class="text">9.2. В случае невозможности достижения согласия споры подлежат разрешению в суде по месту нахождения Поставщика в соответствии с законодательством Российской Федерации.</div>
  </div>

  <div class="section page-break">
    <div class="section-title">10. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ</div>
    <div class="text">10.1. Настоящий Договор вступает в силу с момента его подписания Сторонами и действует до полного исполнения Сторонами своих обязательств.</div>
    <div class="text">10.2. Изменения и дополнения к настоящему Договору должны быть совершены в письменной форме и подписаны обеими Сторонами.</div>
    <div class="text">10.3. Все приложения к настоящему Договору являются его неотъемлемой частью.</div>
    <div class="text">10.4. Настоящий Договор составлен в двух экземплярах, имеющих равную юридическую силу, по одному для каждой из Сторон.</div>
  </div>

  <div class="signature-block">
    <div class="signature-label">ПОСТАВЩИК:</div>
    <div class="text">ООО "АКВАГАЗТЕХ"</div>
    <div class="text" style="margin-top: 10px;">___________________ / ___________________ /</div>
    <div class="text" style="margin-top: 10px;">М.П.</div>
  </div>

  <div class="signature-block">
    <div class="signature-label">ПОКУПАТЕЛЬ:</div>
    <div class="text">___________________ (ФИО полностью)</div>
    <div class="text" style="margin-top: 10px;">___________________ / ___________________ /</div>
  </div>

  <div class="footer">
    <div>© 2025 ${companyName}. Все права защищены.</div>
    <div>Типовой договор. Фактические условия согласовываются при заключении договора.</div>
  </div>
</body>
</html>
`

export async function GET() {
  let browser
  try {
    // Проверяем, есть ли загруженный файл типового договора
    const config = await prisma.contractTemplateConfig.findFirst()
    
    if (config?.filePath) {
      const filePath = join(process.cwd(), 'public', config.filePath)
      if (existsSync(filePath)) {
        // Возвращаем загруженный файл
        const fileBuffer = await readFile(filePath)
        return new NextResponse(fileBuffer as unknown as BodyInit, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="dogovor-podryada.pdf"',
            'Content-Length': fileBuffer.length.toString(),
          },
        })
      }
    }

    // Получаем название компании из базы данных
    const footerConfig = await prisma.footerConfig.findFirst()
    const companyName = footerConfig?.companyName || 'Печнойпроект'

    // Если файла нет, генерируем PDF из HTML шаблона
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    await page.setContent(getContractHTML(companyName), { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      printBackground: true
    })

    await browser.close()

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="dogovor-podryada.pdf"',
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    if (browser) {
      await browser.close()
    }
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { 
        error: 'Ошибка при генерации PDF документа', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
