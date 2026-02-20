import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

function ensureAdmin(session: any) {
  return session?.user && ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!ensureAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Принудительно перегенерируем главную страницу
    revalidatePath('/')
    console.log('[REVALIDATE] Homepage revalidated')
    
    return NextResponse.json({ success: true, message: 'Homepage revalidated' })
  } catch (error: any) {
    console.error('[REVALIDATE] Error:', error)
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 })
  }
}