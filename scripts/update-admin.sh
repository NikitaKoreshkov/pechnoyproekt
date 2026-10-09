#!/bin/bash
# Скрипт для обновления данных главного администратора на сервере
# Запустите ЛОКАЛЬНО: ./scripts/update-admin.sh

set -e
cd "$(dirname "$0")/.."
SSH_KEY="./aquagazteh_key"
SERVER="root@89.111.152.195"
REMOTE="/var/www/aquagazteh"

echo "🔐 Обновляю данные главного администратора на сервере..."

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER" << 'ENDSSH'
cd /var/www/aquagazteh

# Создаем временный скрипт для обновления админа в правильной директории
cat > update_admin_temp.ts << 'EOF'
import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD before running this script.')
    process.exit(1)
  }
  
  console.log('Обновляю администратора:', email)
  
  const passwordHash = await argon2.hash(password)
  
  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { 
      role: 'SUPER_ADMIN', 
      isActive: true, 
      passwordHash: passwordHash 
    },
    create: { 
      email: email.toLowerCase(), 
      passwordHash: passwordHash, 
      isActive: true, 
      role: 'SUPER_ADMIN',
      name: 'admin'
    }
  })
  
  console.log('✅ Администратор обновлен:', user.email)
  
  // Удаляем старых тестовых админов
  await prisma.user.deleteMany({ where: { email: 'a@gmail.com' } })
  console.log('✅ Старые тестовые админы удалены')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
EOF

# Запускаем скрипт через tsx (который уже установлен)
npx tsx update_admin_temp.ts

# Удаляем временный файл
rm update_admin_temp.ts

echo "✅ Готово!"
ENDSSH

echo ""
echo "✅ Данные администратора обновлены!"
