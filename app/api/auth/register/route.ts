import { NextResponse } from 'next/server'
import argon2 from 'argon2'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    // Валидация данных
    const { name, email, password } = registerSchema.parse(body)
    // Проверка, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 400 }
      )
    }
    // Хеширование пароля с помощью Argon2
    const passwordHash = await argon2.hash(password)
    // Создание пользователя (сразу активный, БЕЗ email)
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
      }
    })
    return NextResponse.json({
      message: 'User created successfully',
      userId: user.id
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Validation error' },
        { status: 400 }
      )
    }
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

