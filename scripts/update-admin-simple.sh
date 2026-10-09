#!/bin/bash
# Обновляет SUPER_ADMIN на боевом сервере.
# Запустите ЛОКАЛЬНО: ADMIN_EMAIL=... ADMIN_PASSWORD=... ./scripts/update-admin-simple.sh
#
# Все параметры окружения обязательны: скрипт больше не хранит ни чужой IP,
# ни путь, ни логин с паролем.

set -euo pipefail

cd "$(dirname "$0")/.."

: "${SSH_KEY:?set SSH_KEY (path to the deploy key)}"
: "${SERVER:?set SERVER (user@host)}"
: "${REMOTE:?set REMOTE (project directory on the server)}"
: "${ADMIN_EMAIL:?set ADMIN_EMAIL}"
: "${ADMIN_PASSWORD:?set ADMIN_PASSWORD}"

echo "Обновляю данные главного администратора..."

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER" "cd $REMOTE && ADMIN_EMAIL=\"$ADMIN_EMAIL\" ADMIN_PASSWORD=\"$ADMIN_PASSWORD\" node -e \"
const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');
const prisma = new PrismaClient();

(async () => {
  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const passwordHash = await argon2.hash(password);

    const user = await prisma.user.upsert({
      where: { email: email.toLowerCase() },
      update: { role: 'SUPER_ADMIN', isActive: true, passwordHash },
      create: { email: email.toLowerCase(), passwordHash, isActive: true, role: 'SUPER_ADMIN', name: 'admin' }
    });

    console.log('Администратор обновлён:', user.email);

    await prisma.\$disconnect();
  } catch (e) {
    console.error('Ошибка:', e);
    process.exit(1);
  }
})();
\""

echo "Готово."
