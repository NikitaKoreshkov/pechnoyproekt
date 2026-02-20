import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixSlugs() {
  try {
    console.log('🔧 Исправляю slugs товаров...')
    
    const projects = await prisma.project.findMany()
    
    for (const project of projects) {
      if (!project.slug && project.id) {
        await prisma.project.update({
          where: { id: project.id },
          data: { slug: project.id }
        })
        console.log(`✅ Slug исправлен для: ${project.title} -> ${project.id}`)
      }
    }
    
    console.log('🎉 Все slugs исправлены!')
    console.log('\n📋 Проверяю результат:')
    
    const updatedProjects = await prisma.project.findMany({
      select: { id: true, slug: true, title: true }
    })
    
    updatedProjects.forEach(project => {
      console.log(`✅ ${project.title}: slug = "${project.slug}"`)
    })
    
  } catch (error) {
    console.error('❌ Ошибка при исправлении slugs:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixSlugs().catch(console.error)