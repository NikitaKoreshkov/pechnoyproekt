#!/bin/bash
# 🚀 ОДНА КОМАНДА ДЛЯ ПОЛНОГО ДЕПЛОЯ
# Просто запустите: ./GO.sh

set -e

echo "🚀 Запускаю автоматический деплой..."
echo ""

# Проверяем доступность сервера
if ./scripts/try-connect.sh 2>&1 | grep -q "✅ Подключение успешно"; then
    echo "✅ Сервер доступен, запускаю деплой..."
    ./deploy-full-auto.sh
else
    echo "⚠️ Сервер недоступен сейчас"
    echo ""
    echo "📋 Что нужно сделать:"
    echo ""
    echo "1. Убедитесь, что сервер 89.111.152.195 запущен и доступен"
    echo ""
    echo "2. Добавьте SSH ключ на сервер:"
    echo "   ssh-copy-id -i ./aquagazteh_key.pub root@89.111.152.195"
    echo ""
    echo "   Или вручную на сервере выполните:"
    echo "   mkdir -p ~/.ssh"
    echo "   echo '$(cat ./aquagazteh_key.pub)' >> ~/.ssh/authorized_keys"
    echo "   chmod 600 ~/.ssh/authorized_keys"
    echo ""
    echo "3. Проверьте подключение:"
    echo "   ssh -i ./aquagazteh_key root@89.111.152.195"
    echo ""
    echo "4. Когда подключение будет работать, запустите снова:"
    echo "   ./GO.sh"
    echo ""
    echo "📝 Или запустите вручную:"
    echo "   ./deploy-full-auto.sh"
    exit 1
fi
