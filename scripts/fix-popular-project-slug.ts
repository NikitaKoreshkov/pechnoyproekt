import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Соответствие slug популярного товара → projectSlug (Project.slug)
const SLUG_TO_PROJECT: Record<string, string> = {
  'popular-pnd-32-sdr11': 'truba-pnd-32-sdr11',
  'popular-pnd-63-sdr17': 'truba-pnd-63-sdr17',
  'popular-fitingi-32': 'fitingi-kompressionnye-32',
  'popular-komplekt-dom': 'komplekt-vodosnabzheniya-doma',
  'popular-kanalizacia-110': 'truba-kanalizacionnaya-110',
  'popular-gaz-63': 'gazovaya-truba-pnd-63'
}

async function fix() {
  const items = await prisma.popularItem.findMany()
  for (const item of items) {
    const projectSlug = item.slug ? SLUG_TO_PROJECT[item.slug] : undefined
    if (projectSlug) {
      await prisma.popularItem.update({
        where: { id: item.id },
        data: { projectSlug }
      })
      console.log(`✅ ${item.title} (${item.slug}) → projectSlug: ${projectSlug}`)
    }
  }
  await prisma.$disconnect()
}

fix().catch((e) => { console.error(e); process.exit(1) })
