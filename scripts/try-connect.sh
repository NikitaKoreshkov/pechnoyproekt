#!/bin/bash
# Скрипт для попытки подключения к серверу разными способами

SERVER_IP="89.111.152.195"
SERVER_USER="root"
SSH_KEY="./site"

echo "🔍 Пробую подключиться к серверу разными способами..."
echo ""

# Способ 1: Стандартный SSH с ключом
echo "1️⃣ Пробую SSH с ключом..."
if ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=5 "${SERVER_USER}@${SERVER_IP}" "echo 'OK'" 2>/dev/null; then
    echo "✅ Подключение успешно через SSH с ключом!"
    exit 0
fi
echo "❌ Не удалось"

# Способ 2: SSH без ключа (с паролем)
echo ""
echo "2️⃣ Пробую SSH без ключа (требует пароль)..."
if ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 "${SERVER_USER}@${SERVER_IP}" "echo 'OK'" 2>/dev/null; then
    echo "✅ Подключение возможно, но нужен пароль"
    exit 0
fi
echo "❌ Не удалось"

# Способ 3: Проверка доступности порта
echo ""
echo "3️⃣ Проверяю доступность порта 22..."
if command -v nc &> /dev/null; then
    if nc -zv -w 2 "$SERVER_IP" 22 2>&1 | grep -q "succeeded"; then
        echo "✅ Порт 22 открыт, но SSH не отвечает"
    else
        echo "❌ Порт 22 недоступен"
    fi
else
    echo "⚠️ nc (netcat) не установлен, пропускаю проверку порта"
fi

# Способ 4: Ping
echo ""
echo "4️⃣ Пробую ping..."
if ping -c 2 -W 2 "$SERVER_IP" 2>&1 | grep -q "bytes from"; then
    echo "✅ Сервер отвечает на ping"
else
    echo "❌ Сервер не отвечает на ping"
fi

echo ""
echo "📝 Выводы:"
echo "  - Сервер может быть недоступен в сети"
echo "  - Или SSH ключ не добавлен на сервер"
echo "  - Или требуется пароль для подключения"
echo ""
echo "💡 Попробуйте:"
echo "  1. Проверить, что сервер запущен"
echo "  2. Добавить SSH ключ: ssh-copy-id -i $SSH_KEY.pub ${SERVER_USER}@${SERVER_IP}"
echo "  3. Или подключиться с паролем: ssh ${SERVER_USER}@${SERVER_IP}"
