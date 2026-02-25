import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')
  const userCount = await prisma.user.count()
  console.log(`   Users: ${userCount}`)
  const projectCount = await prisma.project.count()
  console.log(`   Projects: ${projectCount}`)

  // HeroConfig: обновить heroImage на main.png если есть запись
  const hero = await prisma.heroConfig.findFirst()
  if (hero) {
    await prisma.heroConfig.update({
      where: { id: hero.id },
      data: { heroImage: '/images/main.png' }
    })
    console.log('   HeroConfig: heroImage → /images/main.png')
  }

  // HeaderConfig: ProektMangal вместо АкваГазТех/Сайт
  const headers = await prisma.headerConfig.findMany()
  for (const h of headers) {
    if (h.logoText !== 'ProektMangal') {
      await prisma.headerConfig.update({
        where: { id: h.id },
        data: { logoText: 'ProektMangal', updatedAt: new Date() }
      })
      console.log(`   HeaderConfig: logoText → ProektMangal (was: ${h.logoText})`)
    }
  }

  // FooterConfig: ProektMangal
  const footers = await prisma.footerConfig.findMany()
  for (const f of footers) {
    const updates: Record<string, unknown> = {}
    if (f.companyName && f.companyName !== 'ProektMangal') {
      updates.companyName = 'ProektMangal'
    }
    if (f.copyright && f.copyright.includes('АкваГазТех')) {
      updates.copyright = '© 2025 ProektMangal. Все права защищены.'
    }
    if (Object.keys(updates).length > 0) {
      await prisma.footerConfig.update({
        where: { id: f.id },
        data: { ...updates, updatedAt: new Date() }
      })
      console.log(`   FooterConfig: updated → ProektMangal`)
    }
  }

  // SiteMetadataConfig: ProektMangal
  const metas = await prisma.siteMetadataConfig.findMany()
  for (const m of metas) {
    const updates: Record<string, unknown> = {}
    if (m.siteTitle && m.siteTitle !== 'Печные комплексы и мангалы | ProektMangal') {
      updates.siteTitle = 'Печные комплексы и мангалы | ProektMangal'
    }
    if (Object.keys(updates).length > 0) {
      await prisma.siteMetadataConfig.update({
        where: { id: m.id },
        data: { ...updates, updatedAt: new Date() }
      })
      console.log(`   SiteMetadataConfig: updated → ProektMangal`)
    }
  }

  // ProcessStepsConfig
  const steps = await prisma.processStepsConfig.findMany()
  for (const s of steps) {
    if (s.title?.includes('АкваГазТех')) {
      await prisma.processStepsConfig.update({
        where: { id: s.id },
        data: { title: 'ProektMangal — ваш надёжный партнёр', updatedAt: new Date() }
      })
      console.log(`   ProcessStepsConfig: title → ProektMangal`)
    }
  }

  console.log('✅ Done')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
