/**
 * Добавляет товар: Труба ПНД 40 мм SDR 11 (водопровод) 100 м
 * Запуск: npx tsx scripts/add-truba-pnd-40.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PRODUCT = {
  slug: 'truba-pnd-40-sdr11-voda',
  title: 'Труба ПНД 40 мм SDR 11 (водопровод) 100 м',
  area: 40,
  buildTime: 100, // длина бухты в метрах
  material: 'ПЭ-100',
  priceFrom: 38500,
  priceTo: null as number | null,
  subsectionSlug: 'truba-polyetilen-vodoprovod',
  variationGroupId: 'truba-pnd-sdr11-voda', // общая группа с 32 мм для выпадающего списка «Другие диаметры»
}

async function main() {
  const sub = await prisma.catalogSubsection.findFirst({
    where: { slug: PRODUCT.subsectionSlug },
  })
  if (!sub) {
    console.error('❌ Подраздел не найден:', PRODUCT.subsectionSlug)
    process.exit(1)
  }

  const pipeSpecs = {
    lengthOptions: [
      { label: '5 м', price: 2500, inStock: true },
      { label: '7 м', price: 3200, inStock: true },
      { label: '10 м', price: 4200, inStock: true },
      { label: '12 м', price: 4800, inStock: false },
      { label: '50 м', price: 21000, inStock: true },
      { label: '100 м (бухта)', price: 0, inStock: true },
    ],
    additionalOptions: [
      { label: 'Доставка по Москве', price: 3500 },
      { label: 'Разгрузка', price: 1200 },
    ],
  }

  const existing = await prisma.project.findUnique({ where: { slug: PRODUCT.slug } })
  if (existing) {
    const currentSpecs = (existing.specs as Record<string, unknown>) || {}
    await prisma.project.update({
      where: { id: existing.id },
      data: {
        variationGroupId: PRODUCT.variationGroupId,
        area: PRODUCT.area,
        buildTime: PRODUCT.buildTime,
        material: PRODUCT.material,
        specs: { ...currentSpecs, ...pipeSpecs },
      },
    })
    console.log('✅ Обновлён:', PRODUCT.title)
  } else {

  await prisma.project.create({
    data: {
      slug: PRODUCT.slug,
      title: PRODUCT.title,
      area: PRODUCT.area,
      buildTime: PRODUCT.buildTime,
      priceFrom: PRODUCT.priceFrom,
      priceTo: PRODUCT.priceTo,
      floors: 1,
      material: PRODUCT.material,
      completion: 'под ключ',
      region: 'Москва',
      image: '/images/1.png',
      images: [],
      tags: [],
      hasTerrasse: false,
      hasBath: false,
      hasGarage: false,
      features: [],
      description: null,
      advantages: [],
      technicalSpecs: null,
      specs: null,
      filterValues: null,
      subsectionId: sub.id,
      variationGroupId: PRODUCT.variationGroupId,
      specs: pipeSpecs,
    },
  })
  console.log('✅ Добавлен:', PRODUCT.title)
  }

  // Связываем трубу 32 мм с той же группой, характеристиками и опциями
  const pipe32 = await prisma.project.findUnique({ where: { slug: 'truba-pnd-32-sdr11-voda' } })
  if (pipe32) {
    const pipe32Specs = {
      lengthOptions: [
        { label: '5 м', price: 2000, inStock: true },
        { label: '7 м', price: 2600, inStock: true },
        { label: '10 м', price: 3400, inStock: true },
        { label: '12 м', price: 3900, inStock: true },
        { label: '50 м', price: 16500, inStock: false },
        { label: '100 м (бухта)', price: 0, inStock: true },
      ],
      additionalOptions: [
        { label: 'Доставка по Москве', price: 3500 },
        { label: 'Разгрузка', price: 1200 },
      ],
    }
    const currentSpecs = (pipe32.specs as Record<string, unknown>) || {}
    await prisma.project.update({
      where: { id: pipe32.id },
      data: {
        variationGroupId: PRODUCT.variationGroupId,
        area: 32,
        buildTime: 100,
        material: 'ПЭ-100',
        priceFrom: 28500,
        specs: { ...currentSpecs, ...pipe32Specs },
      },
    })
    console.log('✅ Труба 32 мм обновлена')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
