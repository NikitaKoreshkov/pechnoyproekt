#!/bin/bash
# Быстрый деплой: залить изменения, обновить товары, пересобрать, перезапустить.
# Запускайте из корня проекта: ./scripts/deploy-push.sh
# Формат как в deploy-aquagazteh.sh: cd → rsync → ssh

set -e

SERVER_IP="89.111.152.195"
SERVER_USER="root"
SERVER_DIR="/var/www/aquagazteh"
SSH_KEY="./aquagazteh_key"
SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=no"
REMOTE="${SERVER_USER}@${SERVER_IP}"

if [ ! -f "$SSH_KEY" ]; then
  echo "❌ SSH ключ не найден: $SSH_KEY"
  exit 1
fi
if [ ! -f "package.json" ]; then
  echo "❌ Запустите из корня проекта."
  exit 1
fi

echo "📤 Загружаю изменённые файлы (rsync)..."
rsync -avz -e "ssh $SSH_OPTS" \
  lib/ \
  "${REMOTE}:${SERVER_DIR}/lib/"
rsync -avz -e "ssh $SSH_OPTS" \
  app/api/admin/projects/ \
  "${REMOTE}:${SERVER_DIR}/app/api/admin/projects/"
rsync -avz -e "ssh $SSH_OPTS" \
  app/admin/catalog/ \
  "${REMOTE}:${SERVER_DIR}/app/admin/catalog/"
rsync -avz -e "ssh $SSH_OPTS" \
  scripts/ \
  "${REMOTE}:${SERVER_DIR}/scripts/"
rsync -avz -e "ssh $SSH_OPTS" \
  components/ \
  "${REMOTE}:${SERVER_DIR}/components/"

echo "🔧 На сервере: собираю, перезапускаю, сохраняю список PM2 (БД не трогаем)..."
ssh $SSH_OPTS "$REMOTE" "cd $SERVER_DIR && rm -rf .next && npm run build && pm2 restart aquagazteh && pm2 save && echo '✅ Готово!'"

echo ""
echo "✅ Деплой завершён. Сайт: https://aquagazteh.ru"
echo "   Автозапуск после перезагрузки: ./scripts/setup-pm2-startup.sh (один раз)"
echo "   Пересоздать товары из сида: ssh ... 'cd $SERVER_DIR && npx tsx scripts/update-products-aquagazteh.ts'"
