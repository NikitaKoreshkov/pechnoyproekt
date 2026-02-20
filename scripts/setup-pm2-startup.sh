#!/bin/bash
# Настраивает автозапуск PM2 после перезагрузки сервера.
# Запускайте из корня проекта: ./scripts/setup-pm2-startup.sh
# Достаточно выполнить один раз (или после смены ОС/пользователя).

set -e

SERVER_IP="89.111.152.195"
SERVER_USER="root"
SSH_KEY="./aquagazteh_key"
SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=no"
REMOTE="${SERVER_USER}@${SERVER_IP}"

if [ ! -f "$SSH_KEY" ]; then
  echo "❌ SSH ключ не найден: $SSH_KEY"
  exit 1
fi

echo "🔧 Настраиваю автозапуск PM2 на сервере..."
ssh $SSH_OPTS "$REMOTE" 'bash -s' << 'ENDSSH'
set -e
# Сохраняем текущий список процессов PM2
pm2 save

# Настраиваем startup (новые версии PM2 делают это сами, без отдельной команды)
OUT=$(pm2 startup systemd -u root --hp /root 2>&1)
if echo "$OUT" | grep -qE 'Command successfully executed|Created symlink.*pm2-root'; then
  echo "✅ PM2 startup настроен (автозапуск после перезагрузки)"
elif CMD=$(echo "$OUT" | grep -E '^\s*(sudo|env|su )' | tail -n1 | sed 's/^\s*//'); [ -n "$CMD" ]; then
  eval "$CMD"
  echo "✅ PM2 startup настроен"
else
  echo "⚠️ Не удалось подтвердить настройку. Вывод pm2 startup:"
  echo "$OUT"
  exit 1
fi
ENDSSH

echo ""
echo "✅ Готово. После перезагрузки сервера PM2 автоматически поднимет приложение."
