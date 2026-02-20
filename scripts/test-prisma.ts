import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testPrisma() {
  try {
    console.log('🔍 Тестирую Prisma подключение...')
    
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        slug: true,
        title: true
      },
      take: 3
    })
    
    console.log('\n📋 Результат из Prisma:')
    projects.forEach((project, index) => {
      console.log(`${index + 1}. ${project.title}`)
      console.log(`   ID: ${project.id}`)
      console.log(`   Slug: ${project.slug}`)
      console.log('')
    })
    
    console.log('✅ Тест Prisma завершен!')
    
  } catch (error) {
    console.error('❌ Ошибка:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testPrisma().catch(console.error)