#!/bin/bash
# Скрипт для диагностики и исправления проблем с подключением

SERVER_IP="89.111.152.195"
SSH_KEY="./site"

echo "🔍 Диагностика подключения к серверу $SERVER_IP"
echo ""

# Проверка 1: Доступность сервера через ping
echo "1️⃣ Проверяю ping..."
if ping -c 2 -W 2 "$SERVER_IP" 2>&1 | grep -q "bytes from"; then
    echo "   ✅ Сервер отвечает на ping"
else
    echo "   ❌ Сервер не отвечает на ping"
    echo "   💡 Возможные причины:"
    echo "      - Сервер выключен"
    echo "      - Firewall блокирует ICMP"
    echo "      - Проблемы с сетью"
fi
echo ""

# Проверка 2: SSH порт
echo "2️⃣ Проверяю SSH порт (22)..."
if command -v nc &> /dev/null; then
    if timeout 3 nc -zv "$SERVER_IP" 22 2>&1 | grep -q "succeeded"; then
        echo "   ✅ Порт 22 открыт"
    else
        echo "   ❌ Порт 22 недоступен"
        echo "   💡 Возможные причины:"
        echo "      - SSH сервис не запущен на сервере"
        echo "      - Firewall блокирует порт 22"
        echo "      - macOS блокирует подключение (настройки безопасности)"
    fi
else
    echo "   ⚠️ nc не установлен, пропускаю проверку порта"
fi
echo ""

# Проверка 3: SSH ключ
echo "3️⃣ Проверяю SSH ключ..."
if [ -f "$SSH_KEY" ]; then
    echo "   ✅ SSH ключ существует: $SSH_KEY"
    if [ -f "$SSH_KEY.pub" ]; then
        echo "   ✅ Публичный ключ существует: $SSH_KEY.pub"
        echo ""
        echo "   📋 Публичный ключ для добавления на сервер:"
        echo "   $(cat $SSH_KEY.pub)"
    else
        echo "   ❌ Публичный ключ не найден"
    fi
else
    echo "   ❌ SSH ключ не найден"
fi
echo ""

# Проверка 4: Попытка подключения
echo "4️⃣ Пробую подключиться..."
if ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=5 -o BatchMode=yes "${SERVER_USER:-root}@${SERVER_IP}" "echo 'OK'" 2>/dev/null; then
    echo "   ✅ Подключение успешно!"
    exit 0
else
    ERROR=$(ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=5 "${SERVER_USER:-root}@${SERVER_IP}" "echo 'OK'" 2>&1 | tail -1)
    echo "   ❌ Подключение не удалось"
    echo "   Ошибка: $ERROR"
    echo ""
    
    if echo "$ERROR" | grep -q "Operation not permitted"; then
        echo "   🔧 Решение для 'Operation not permitted':"
        echo "      1. Проверьте настройки Firewall в macOS:"
        echo "         Системные настройки → Защита и безопасность → Firewall"
        echo ""
        echo "      2. Попробуйте отключить VPN/прокси временно"
        echo ""
        echo "      3. Добавьте SSH ключ через веб-консоль провайдера:"
        echo "         - Войдите в панель управления сервером"
        echo "         - Откройте веб-консоль (VNC/Console)"
        echo "         - Выполните на сервере:"
        echo "           mkdir -p ~/.ssh"
        echo "           echo '$(cat $SSH_KEY.pub)' >> ~/.ssh/authorized_keys"
        echo "           chmod 600 ~/.ssh/authorized_keys"
    elif echo "$ERROR" | grep -q "Permission denied"; then
        echo "   🔧 Решение для 'Permission denied':"
        echo "      SSH ключ не добавлен на сервер или неверный"
        echo "      Добавьте ключ через веб-консоль провайдера"
    elif echo "$ERROR" | grep -q "Connection refused"; then
        echo "   🔧 Решение для 'Connection refused':"
        echo "      SSH сервис не запущен на сервере"
        echo "      Запустите через веб-консоль: systemctl start sshd"
    fi
fi
echo ""

# Рекомендации
echo "📝 Рекомендации:"
echo ""
echo "1. Если у вас есть доступ к панели управления провайдера:"
echo "   - Используйте веб-консоль (VNC/Console) для доступа к серверу"
echo "   - Добавьте SSH ключ вручную на сервере"
echo ""
echo "2. Если есть пароль root:"
echo "   ssh root@$SERVER_IP"
echo "   (затем добавьте ключ)"
echo ""
echo "3. Проверьте настройки безопасности macOS:"
echo "   Системные настройки → Защита и безопасность → Firewall"
echo ""
