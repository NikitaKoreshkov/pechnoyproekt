#!/bin/bash
# Простая команда для обновления администратора
# Запустите ЛОКАЛЬНО: ./scripts/update-admin-simple.sh

cd "$(dirname "$0")/.."
SSH_KEY="./aquagazteh_key"
SERVER="root@89.111.152.195"
REMOTE="/var/www/aquagazteh"

echo "🔐 Обновляю данные главного администратора..."

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER" "cd $REMOTE && node -e \"
const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');
const prisma = new PrismaClient();

(async () => {
  try {
    const email = 'admin@example.com';
    const password = 'REDACTED-IN-HISTORY';
    const passwordHash = await argon2.hash(password);
    
    const user = await prisma.user.upsert({
      where: { email: email.toLowerCase() },
      update: { role: 'SUPER_ADMIN', isActive: true, passwordHash },
      create: { email: email.toLowerCase(), passwordHash, isActive: true, role: 'SUPER_ADMIN', name: 'admin' }
    });
    
    console.log('✅ Администратор обновлен:', user.email);
    
    await prisma.user.deleteMany({ where: { email: 'a@gmail.com' } });
    console.log('✅ Старые тестовые админы удалены');
    
    await prisma.\$disconnect();
  } catch (e) {
    console.error('Ошибка:', e);
    process.exit(1);
  }
})();
\""

echo ""
echo "✅ Готово! Данные администратора обновлены."
echo "📝 Email: admin@example.com"
echo "📝 Пароль: REDACTED-IN-HISTORY"
