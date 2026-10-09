#!/bin/bash
# Скрипт деплоя проекта на сервер
# Выполните ЛОКАЛЬНО на вашем компьютере

set -e

# Сервер задаётся окружением, чтобы адрес и путь не светились в репозитории:
#   SERVER_IP=... SERVER_DIR=... SSH_KEY=./deploy_key ./deploy.sh
SERVER_IP="${SERVER_IP:?set SERVER_IP (host of the app)}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_DIR="${SERVER_DIR:?set SERVER_DIR (project directory on the server)}"
LOCAL_DIR="."
# Приватный ключ для доступа к серверу; публичный должен быть добавлен
# в панель хостинга в раздел SSH-ключей.
SSH_KEY="${SSH_KEY:-./deploy_key}"

echo "🚀 Начинаю деплой проекта..."

# Проверка, что мы в правильной директории
if [ ! -f "package.json" ]; then
    echo "❌ Ошибка: package.json не найден. Запустите скрипт из корня проекта."
    exit 1
fi

# Сборка проекта локально (опционально, можно собрать на сервере)
echo "📦 Собираю проект..."
npm run build || echo "⚠️ Сборка не удалась, соберем на сервере"

# Подключение к серверу и загрузка файлов
# public/uploads не перезаписываем при деплое — на сервере остаются загруженные фото
RSYNC_OPTS=(--exclude 'node_modules' --exclude '.next' --exclude '.git' --exclude '.env*' --exclude '*.log' --exclude '.DS_Store' --exclude 'public/uploads')
SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"
if [ -n "$SSH_KEY" ] && [ -f "$SSH_KEY" ]; then
    echo "📤 Загружаю файлы на сервер (ключ: $SSH_KEY)..."
    ssh -i "$SSH_KEY" $SSH_OPTS "${SERVER_USER}@${SERVER_IP}" "mkdir -p ${SERVER_DIR} ${SERVER_DIR}/public/uploads && chmod 755 ${SERVER_DIR}/public/uploads"
    rsync -avz --progress -e "ssh -i $SSH_KEY $SSH_OPTS" "${RSYNC_OPTS[@]}" "${LOCAL_DIR}/" "${SERVER_USER}@${SERVER_IP}:${SERVER_DIR}/"
else
    echo "📤 Загружаю файлы на сервер..."
    if [ -n "$SSH_KEY" ]; then
        echo "⚠️ Ключ не найден: $SSH_KEY (использую ssh по умолчанию)"
    fi
    ssh $SSH_OPTS "${SERVER_USER}@${SERVER_IP}" "mkdir -p ${SERVER_DIR} ${SERVER_DIR}/public/uploads && chmod 755 ${SERVER_DIR}/public/uploads"
    rsync -avz --progress -e "ssh $SSH_OPTS" "${RSYNC_OPTS[@]}" "${LOCAL_DIR}/" "${SERVER_USER}@${SERVER_IP}:${SERVER_DIR}/"
fi

echo "✅ Файлы загружены!"

echo "🔧 Устанавливаю зависимости и перезапускаю на сервере..."
if [ -n "$SSH_KEY" ] && [ -f "$SSH_KEY" ]; then
  ssh -i "$SSH_KEY" $SSH_OPTS "${SERVER_USER}@${SERVER_IP}" "cd ${SERVER_DIR} && npm install && npx prisma generate && npm run build && (pm2 restart site || pm2 start npm --name site -- start) && pm2 save"
else
  ssh $SSH_OPTS "${SERVER_USER}@${SERVER_IP}" "cd ${SERVER_DIR} && npm install && npx prisma generate && npm run build && (pm2 restart site || pm2 start npm --name site -- start) && pm2 save"
fi

echo "✅ Деплой завершён!"

