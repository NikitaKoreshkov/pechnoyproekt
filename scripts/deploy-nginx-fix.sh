#!/bin/bash
# Применить фикс Nginx (400 на _next/static) на сервере aquagazteh.ru
# Запустите ЛОКАЛЬНО: ./scripts/deploy-nginx-fix.sh

set -e
cd "$(dirname "$0")/.."
SSH_KEY="./aquagazteh_key"
SERVER="root@89.111.152.195"
REMOTE="/var/www/aquagazteh"

echo "📤 Загружаю setup-nginx-aquagazteh.sh..."
rsync -avz -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
  scripts/setup-nginx-aquagazteh.sh "$SERVER:$REMOTE/scripts/"

echo "🔧 Применяю конфиг Nginx на сервере..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER" \
  "cd $REMOTE && bash scripts/setup-nginx-aquagazteh.sh"

echo "✅ Готово. Проверьте: https://aquagazteh.ru/project/пнд-32мм-sdr11-100м-67dd2c28"
