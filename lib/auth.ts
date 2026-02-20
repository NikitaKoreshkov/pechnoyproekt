import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import argon2 from 'argon2'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          })
        ]
      : []),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          console.log('[AUTHORIZE] Starting authorization for:', credentials?.email)
          if (!credentials?.email || !credentials?.password) {
            console.log('[AUTHORIZE] Missing credentials')
            return null
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() }
          })

          if (!user || !user.passwordHash) {
            console.log('[AUTHORIZE] User not found or no password hash')
            await new Promise(resolve => setTimeout(resolve, 500))
            return null
          }

          // Проверка активности аккаунта
          if (!user.isActive) {
            console.log('[AUTHORIZE] User not active')
            throw new Error('Аккаунт не активирован. Проверьте email для подтверждения регистрации.')
          }

          const isValid = await argon2.verify(user.passwordHash, credentials.password)

          if (!isValid) {
            console.warn(`[AUTHORIZE] Failed login attempt for email: ${credentials.email}`)
            return null
          }

          console.log('[AUTHORIZE] User authorized successfully:', user.email)
          const authUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
          console.log('[AUTHORIZE] Returning user:', authUser)
          return authUser
        } catch (error) {
          console.error('[AUTHORIZE] Auth error:', error)
          return null
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 дней
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 дней
  },
  useSecureCookies: process.env.NEXTAUTH_URL?.startsWith('https://') ?? true,
  trustHost: true,
  debug: false,
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        console.log('[JWT Callback] Creating token for user:', user.email)
        token.id = (user as any).id
        token.role = (user as any).role
        token.email = (user as any).email
        token.name = (user as any).name
      } else if (token?.id) {
        // ensure role stays fresh
        try {
          const dbUser = await prisma.user.findUnique({ where: { id: token.id as string }, select: { role: true, email: true, name: true } })
          if (dbUser) {
            token.role = dbUser.role
            token.email = dbUser.email
            token.name = dbUser.name
          }
        } catch {}
      }
      return token
    },
    async session({ session, token }) {
      console.log('[Session Callback] Creating session, token:', { id: token?.id, email: token?.email, hasToken: !!token })
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as any
        session.user.email = token.email as string
        session.user.name = token.name as string
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
}
