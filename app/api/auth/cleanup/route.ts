import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Cron endpoint для очистки просроченных кодов и неактивных аккаунтов
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    
    // Проверка авторизации (для безопасности в production используйте secret)
    if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'secret-key'}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    
    // Удаляем просроченные токены верификации
    const deletedTokens = await prisma.verificationToken.deleteMany({
      where: {
        expires: { lt: now }
      }
    })

    // Удаляем неактивных пользователей (опционально, можно включить позже)
    let deletedUsers = 0
    // const expiredUsers = await prisma.user.findMany({
    //   where: {
    //     isActive: false,
    //   }
    // })

    return NextResponse.json({
      message: 'Cleanup completed',
      timestamp: now.toISOString(),
      deletedTokens: deletedTokens.count,
      deletedUsers,
      activeUsers: await prisma.user.count({ where: { isActive: true } }),
      inactiveUsers: await prisma.user.count({ where: { isActive: false } }),
    })

  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}



