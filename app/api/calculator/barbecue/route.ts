import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAllCalcOptions } from '@/lib/calc-data'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    let options = await prisma.calcBarbecueOption.findMany({
      orderBy: [{ variant: 'asc' }, { optionType: 'asc' }, { sortOrder: 'asc' }],
    })

    // Fallback: если БД пуста — читаем из файлов парсера
    if (options.length === 0) {
      const fromFiles = await getAllCalcOptions()
      const standardMain = fromFiles.standard.main.map((o, i) => ({ ...o, id: `std-main-${i}` }))
      const standardExtra = fromFiles.standard.extra.map((o, i) => ({ ...o, id: `std-extra-${i}` }))
      const vipMain = fromFiles.vip.main.map((o, i) => ({ ...o, id: `vip-main-${i}` }))
      const vipExtra = fromFiles.vip.extra.map((o, i) => ({ ...o, id: `vip-extra-${i}` }))
      return NextResponse.json({
        standard: { main: standardMain, extra: standardExtra },
        vip: { main: vipMain, extra: vipExtra },
      })
    }

    const standardMain = options.filter((o) => o.variant === 'standard' && o.optionType === 'main')
    const standardExtra = options.filter((o) => o.variant === 'standard' && o.optionType === 'extra')
    const vipMain = options.filter((o) => o.variant === 'vip' && o.optionType === 'main')
    const vipExtra = options.filter((o) => o.variant === 'vip' && o.optionType === 'extra')

    return NextResponse.json({
      standard: { main: standardMain, extra: standardExtra },
      vip: { main: vipMain, extra: vipExtra },
    })
  } catch (e) {
    console.error('[API calculator/barbecue]', e)
    return NextResponse.json(
      { error: 'Failed to load' },
      { status: 500 }
    )
  }
}
