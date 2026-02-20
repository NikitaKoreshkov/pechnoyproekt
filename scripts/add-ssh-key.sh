#!/bin/bash
# Скрипт для добавления SSH ключа на сервер
# Использование: ./scripts/add-ssh-key.sh [password]

set -e

SERVER_IP="89.111.152.195"
SERVER_USER="root"
SSH_KEY="./site"
SSH_PUB_KEY="./site.pub"

if [ ! -f "$SSH_PUB_KEY" ]; then
    echo "❌ Публичный ключ не найден: $SSH_PUB_KEY"
    exit 1
fi

echo "🔑 Добавляю SSH ключ на сервер..."

# Пробуем через ssh-copy-id
if command -v ssh-copy-id &> /dev/null; then
    if [ -n "$1" ]; then
        # Если передан пароль, используем sshpass
        if command -v sshpass &> /dev/null; then
            sshpass -p "$1" ssh-copy-id -i "$SSH_PUB_KEY" -o StrictHostKeyChecking=no "${SERVER_USER}@${SERVER_IP}"
        else
            echo "⚠️ sshpass не установлен. Установите: brew install sshpass"
            echo "Или добавьте ключ вручную:"
            echo "  ssh ${SERVER_USER}@${SERVER_IP}"
            echo "  echo '$(cat $SSH_PUB_KEY)' >> ~/.ssh/authorized_keys"
        fi
    else
        ssh-copy-id -i "$SSH_PUB_KEY" -o StrictHostKeyChecking=no "${SERVER_USER}@${SERVER_IP}"
    fi
else
    echo "⚠️ ssh-copy-id не найден. Добавьте ключ вручную:"
    echo ""
    echo "1. Подключитесь к серверу:"
    echo "   ssh ${SERVER_USER}@${SERVER_IP}"
    echo ""
    echo "2. Выполните на сервере:"
    echo "   mkdir -p ~/.ssh"
    echo "   chmod 700 ~/.ssh"
    echo "   echo '$(cat $SSH_PUB_KEY)' >> ~/.ssh/authorized_keys"
    echo "   chmod 600 ~/.ssh/authorized_keys"
    echo ""
    echo "Или скопируйте этот ключ:"
    cat "$SSH_PUB_KEY"
fi

echo ""
echo "✅ Ключ добавлен (или инструкции показаны выше)"
