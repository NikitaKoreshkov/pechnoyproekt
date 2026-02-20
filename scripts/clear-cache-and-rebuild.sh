#!/bin/bash
# Скрипт для очистки кэша Next.js и пересборки на сервере
# Запустите ЛОКАЛЬНО: ./scripts/clear-cache-and-rebuild.sh

set -e
cd "$(dirname "$0")/.."
SSH_KEY="./aquagazteh_key"
SERVER="root@89.111.152.195"
REMOTE="/var/www/aquagazteh"

echo "🧹 Очищаю кэш Next.js на сервере..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER" \
  "cd $REMOTE && rm -rf .next"

echo "🏗️ Собираю проект..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER" \
  "cd $REMOTE && npm run build"

echo "🔄 Перезапускаю PM2..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER" \
  "cd $REMOTE && pm2 restart aquagazteh"

echo "✅ Готово! Кэш очищен, проект пересобран и перезапущен."
echo "📝 Обновите страницу в браузере (Ctrl+Shift+R или Cmd+Shift+R для hard refresh)"
