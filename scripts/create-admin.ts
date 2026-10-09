/**
 * Скрипт для создания администратора (ADMIN)
 * Запуск: npx tsx scripts/create-admin.ts
 */

import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL
    const password = process.env.ADMIN_PASSWORD
    if (!email || !password) {
      console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD before running this script.')
      process.exit(1)
    }
    const name = process.env.ADMIN_NAME || 'Администратор'

    console.log('🔄 Создаю администратора...')
    console.log('   Email:', email)

    const passwordHash = await argon2.hash(password)

    const user = await prisma.user.upsert({
      where: { email: email.toLowerCase() },
      update: {
        role: 'ADMIN',
        isActive: true,
        passwordHash,
        name,
        updatedAt: new Date()
      },
      create: {
        id: crypto.randomUUID(),
        email: email.toLowerCase(),
        passwordHash,
        isActive: true,
        role: 'ADMIN',
        name,
        updatedAt: new Date()
      }
    })

    console.log('✅ Администратор создан/обновлён:')
    console.log('   ID:', user.id)
    console.log('   Email:', user.email)
    console.log('   Имя:', user.name)
    console.log('   Роль:', user.role)
    console.log('\n🎉 Готово! Вход: /auth/signin')

  } catch (error) {
    console.error('❌ Ошибка:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
