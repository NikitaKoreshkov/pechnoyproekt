import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testApiProjects() {
  try {
    console.log('🔍 Тестирую логику API проектов...')
    
    const projectsData = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' }
    })

    console.log(`\n📋 Найдено проектов: ${projectsData.length}`)
    
    // Берем первый проект для тестирования
    const firstProject = projectsData[0]
    if (!firstProject) {
      console.log('❌ Нет проектов в базе данных')
      return
    }
    
    console.log('\n🔍 Тестирую первый проект:')
    console.log('Raw project data:', {
      id: firstProject.id,
      slug: firstProject.slug,
      title: firstProject.title
    })
    
    // Тестируем деструктуризацию как в API
    const { 
      slug,
      title, 
      area, 
      priceFrom, 
      priceTo, 
      floors, 
      material, 
      buildTime, 
      completion, 
      region, 
      image,
      images, 
      tags,
      hasTerrasse,
      hasBath,
      hasGarage,
      features,
      filterValues,
      specs
    } = firstProject
    
    console.log('\nПосле деструктуризации:')
    console.log('slug:', slug)
    console.log('title:', title)
    
    const resultObject = {
      id: slug, // Используем slug как ID для совместимости с роутингом
      slug: slug, // Добавляем отдельное поле slug для явного доступа
      title,
      area,
      priceFrom,
      priceTo,
      floors,
      material,
      buildTime,
      completion,
      region,
      image: image, // Используем главное изображение напрямую
      images: images || [], // Возвращаем также массив дополнительных изображений
      tags,
      hasTerrasse,
      hasBath,
      hasGarage,
      features,
      filterValues: filterValues || null, // Значения для динамических фильтров (null если нет значений)
      specs: specs || null // Дополнительные опции для вычисления цены бытовок
    }
    
    console.log('\n🎯 Финальный объект:')
    console.log('id:', resultObject.id)
    console.log('slug:', resultObject.slug)
    console.log('title:', resultObject.title)
    
  } catch (error) {
    console.error('❌ Ошибка:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testApiProjects().catch(console.error)