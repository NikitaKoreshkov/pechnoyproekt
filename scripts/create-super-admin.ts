/**
 * Скрипт для создания главного администратора (SUPER_ADMIN)
 * Запуск: npx tsx scripts/create-super-admin.ts
 */

import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'

const prisma = new PrismaClient()

async function createSuperAdmin() {
  try {
    const email = 'admin@example.com'
    const password = 'REDACTED-IN-HISTORY'
    const name = 'Главный администратор'

    console.log('🔄 Создаю главного администратора...')
    console.log('   Email:', email)

    // Хешируем пароль
    const passwordHash = await argon2.hash(password)

    // Создаем или обновляем пользователя
    const user = await prisma.user.upsert({
      where: { email: email.toLowerCase() },
      update: {
        role: 'SUPER_ADMIN',
        isActive: true,
        passwordHash,
        name
      },
      create: {
        email: email.toLowerCase(),
        passwordHash,
        isActive: true,
        role: 'SUPER_ADMIN',
        name
      }
    })

    console.log('✅ Главный администратор создан/обновлен:')
    console.log('   ID:', user.id)
    console.log('   Email:', user.email)
    console.log('   Имя:', user.name)
    console.log('   Роль:', user.role)
    console.log('   Активен:', user.isActive)
    console.log('\n🎉 Готово! Теперь можно войти в админ-панель с этими данными.')

  } catch (error) {
    console.error('❌ Ошибка при создании администратора:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createSuperAdmin()
  .then(() => {
    console.log('✅ Скрипт выполнен успешно')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Критическая ошибка:', error)
    process.exit(1)
  })
