import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import argon2 from 'argon2'

export async function POST(req: Request) {
  try {
    const { email, oldPassword, newPassword } = await req.json()
    if (!email || !oldPassword || !newPassword) {
      return NextResponse.json({ error: 'Поля обязательны' }, { status: 400 })
    }
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 400 })
    }
    const isValid = await argon2.verify(user.passwordHash, oldPassword)
    if (!isValid) {
      return NextResponse.json({ error: 'Старый пароль неверный' }, { status: 400 })
    }
    const passwordHash = await argon2.hash(newPassword)
    await prisma.user.update({ where: { email: email.toLowerCase() }, data: { passwordHash } })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
