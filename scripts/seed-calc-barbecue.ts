#!/usr/bin/env npx tsx
/**
 * Seed CalcBarbecueOption from парсер/калькулятор folder
 */
import { PrismaClient } from '@prisma/client'
import { getAllCalcOptions } from '../lib/calc-data'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding CalcBarbecueOption from parser files...')
  const { standard, vip } = await getAllCalcOptions()

  await prisma.calcBarbecueOption.deleteMany({})

  const toCreate: { variant: string; optionType: string; name: string; price: number; image: string; sortOrder: number }[] = []

  for (const o of standard.main) {
    toCreate.push({ variant: 'standard', optionType: 'main', name: o.name, price: o.price, image: o.image, sortOrder: o.sortOrder })
  }
  for (const o of standard.extra) {
    toCreate.push({ variant: 'standard', optionType: 'extra', name: o.name, price: o.price, image: o.image, sortOrder: o.sortOrder })
  }
  for (const o of vip.main) {
    toCreate.push({ variant: 'vip', optionType: 'main', name: o.name, price: o.price, image: o.image, sortOrder: o.sortOrder })
  }
  for (const o of vip.extra) {
    toCreate.push({ variant: 'vip', optionType: 'extra', name: o.name, price: o.price, image: o.image, sortOrder: o.sortOrder })
  }

  for (const o of toCreate) {
    await prisma.calcBarbecueOption.create({ data: o })
  }

  console.log(`Created ${toCreate.length} CalcBarbecueOption records`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
