#!/bin/bash
# Полностью автоматический деплой на aquagazteh.ru
# Выполните: ./deploy-full-auto.sh

set -e

SERVER_IP="89.111.152.195"
SERVER_USER="root"
SERVER_DIR="/var/www/aquagazteh"
DOMAIN="aquagazteh.ru"
SSH_KEY="./aquagazteh_key"
SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=no -o ConnectTimeout=10"

# Цвета
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Полностью автоматический деплой на ${DOMAIN}${NC}"
echo ""

# Проверка SSH ключа
if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}❌ SSH ключ не найден: $SSH_KEY${NC}"
    exit 1
fi

# Проверка доступности сервера
echo -e "${YELLOW}🔍 Проверяю доступность сервера...${NC}"
if ! ssh $SSH_OPTS "${SERVER_USER}@${SERVER_IP}" "echo 'OK'" &>/dev/null; then
    echo -e "${RED}❌ Сервер недоступен или SSH ключ не добавлен${NC}"
    echo ""
    echo "Добавьте публичный ключ на сервер:"
    echo "  ssh-copy-id -i $SSH_KEY.pub ${SERVER_USER}@${SERVER_IP}"
    echo ""
    echo "Или вручную добавьте в ~/.ssh/authorized_keys на сервере:"
    cat "$SSH_KEY.pub"
    exit 1
fi

echo -e "${GREEN}✅ Сервер доступен${NC}"
echo ""

# Шаг 1: Настройка сервера
echo -e "${YELLOW}📦 Шаг 1: Настройка сервера...${NC}"
scp $SSH_OPTS scripts/setup-server-aquagazteh.sh "${SERVER_USER}@${SERVER_IP}:/tmp/"
ssh $SSH_OPTS "${SERVER_USER}@${SERVER_IP}" "bash /tmp/setup-server-aquagazteh.sh" | tee /tmp/setup-output.log

# Извлекаем DATABASE_URL из вывода
DB_URL=$(grep "DATABASE_URL=" /tmp/setup-output.log | head -1 | sed 's/.*DATABASE_URL="\(.*\)"/\1/')
if [ -z "$DB_URL" ]; then
    echo -e "${RED}❌ Не удалось получить DATABASE_URL${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Сервер настроен${NC}"
echo "  DATABASE_URL: $DB_URL"
echo ""

# Шаг 2: Экспорт БД (если возможно)
echo -e "${YELLOW}📦 Шаг 2: Экспорт базы данных...${NC}"
if [ -f ".env" ] && command -v pg_dump &> /dev/null; then
    ./scripts/export-database.sh 2>/dev/null || echo "⚠️ Экспорт БД пропущен"
else
    echo "⚠️ Экспорт БД пропущен (БД не настроена локально)"
fi
echo ""

# Шаг 3: Загрузка файлов
echo -e "${YELLOW}📤 Шаг 3: Загрузка файлов на сервер...${NC}"
rsync -avz --progress -e "ssh $SSH_OPTS" \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '.git' \
    --exclude '.env*' \
    --exclude '*.log' \
    --exclude '.DS_Store' \
    --exclude 'backups' \
    ./ "${SERVER_USER}@${SERVER_IP}:${SERVER_DIR}/"

echo -e "${GREEN}✅ Файлы загружены${NC}"
echo ""

# Шаг 4: Создание .env на сервере
echo -e "${YELLOW}⚙️ Шаг 4: Настройка .env файла...${NC}"
NEXTAUTH_SECRET=$(openssl rand -base64 32 | tr -d "=+/")
ssh $SSH_OPTS "${SERVER_USER}@${SERVER_IP}" <<ENDSSH
cd ${SERVER_DIR}

cat > .env <<EOF
DATABASE_URL="${DB_URL}"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"
NEXTAUTH_URL="https://${DOMAIN}"
NEXT_PUBLIC_SITE_URL="https://${DOMAIN}"

# Email (настройте под ваши нужды)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@${DOMAIN}

# Поисковые системы
GOOGLE_SITE_VERIFICATION=
YANDEX_VERIFICATION=
EOF

chmod 600 .env
echo "✅ .env файл создан"
ENDSSH

echo -e "${GREEN}✅ .env файл настроен${NC}"
echo ""

# Шаг 5: Установка зависимостей и настройка БД
echo -e "${YELLOW}📦 Шаг 5: Установка зависимостей и настройка БД...${NC}"
ssh $SSH_OPTS "${SERVER_USER}@${SERVER_IP}" <<ENDSSH
set -e
cd ${SERVER_DIR}

echo "📦 Устанавливаю зависимости..."
npm install --production

echo "🗄️ Настраиваю базу данных..."
npm run db:push || echo "⚠️ db:push завершился с предупреждением"
npm run db:generate

# Если есть дамп, импортируем
if ls backups/database_*.sql.gz 1> /dev/null 2>&1; then
    echo "📥 Импортирую данные из дампа..."
    LATEST_DUMP=\$(ls -t backups/database_*.sql.gz | head -1)
    DB_PASS=\$(grep DATABASE_URL .env | sed 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/')
    gunzip -c "\$LATEST_DUMP" | PGPASSWORD="\$DB_PASS" psql -h localhost -U aquagaztehuser -d aquagaztehdb 2>/dev/null || echo "⚠️ Импорт данных пропущен"
else
    echo "🌱 Заполняю базу начальными данными..."
    npm run db:seed || echo "⚠️ db:seed завершился с предупреждением"
fi

echo "🏗️ Собираю проект..."
npm run build

echo "✅ Зависимости установлены и БД настроена"
ENDSSH

echo -e "${GREEN}✅ Зависимости установлены${NC}"
echo ""

# Шаг 6: Настройка Nginx
echo -e "${YELLOW}🌐 Шаг 6: Настройка Nginx...${NC}"
scp $SSH_OPTS scripts/setup-nginx-aquagazteh.sh "${SERVER_USER}@${SERVER_IP}:/tmp/"
ssh $SSH_OPTS "${SERVER_USER}@${SERVER_IP}" "bash /tmp/setup-nginx-aquagazteh.sh"

echo -e "${GREEN}✅ Nginx настроен${NC}"
echo ""

# Шаг 7: Запуск приложения
echo -e "${YELLOW}🚀 Шаг 7: Запуск приложения...${NC}"
ssh $SSH_OPTS "${SERVER_USER}@${SERVER_IP}" <<ENDSSH
cd ${SERVER_DIR}

# Останавливаем если уже запущено
pm2 delete aquagazteh 2>/dev/null || true

# Запускаем
pm2 start npm --name "aquagazteh" -- start
pm2 save
pm2 startup | grep -v "PM2" | bash || true

echo "✅ Приложение запущено"
ENDSSH

echo -e "${GREEN}✅ Приложение запущено${NC}"
echo ""

# Финальная проверка
echo -e "${YELLOW}🔍 Проверка статуса...${NC}"
ssh $SSH_OPTS "${SERVER_USER}@${SERVER_IP}" <<ENDSSH
echo "=== PM2 Status ==="
pm2 status

echo ""
echo "=== Nginx Status ==="
systemctl status nginx --no-pager | head -5

echo ""
echo "=== PostgreSQL Status ==="
systemctl status postgresql --no-pager | head -5
ENDSSH

echo ""
echo -e "${GREEN}✅ Деплой завершен успешно!${NC}"
echo ""
echo "📝 Проверьте сайт:"
echo "  - HTTP: http://${DOMAIN} (должен редиректить на HTTPS)"
echo "  - HTTPS: https://${DOMAIN}"
echo ""
echo "🔒 Для получения валидного SSL сертификата:"
echo "  ssh -i $SSH_KEY ${SERVER_USER}@${SERVER_IP}"
echo "  certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
echo ""
