#!/bin/bash
# Скрипт установки окружения для Next.js проекта на сервере aquagazteh.ru
# Выполните на сервере: bash setup-server-aquagazteh.sh

set -e

DOMAIN="aquagazteh.ru"
SERVER_DIR="/var/www/aquagazteh"
DB_NAME="aquagaztehdb"
DB_USER="aquagaztehuser"
DB_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

echo "🚀 Начинаю установку окружения для $DOMAIN..."

# Обновление системы
echo "📦 Обновляю систему..."
apt update && apt upgrade -y

# Установка необходимых инструментов
echo "🔧 Устанавливаю базовые инструменты..."
apt install -y curl wget git build-essential ufw

# Установка Node.js 20.x (LTS)
echo "📦 Устанавливаю Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

echo "  Node.js: $(node --version)"
echo "  npm: $(npm --version)"

# Установка PostgreSQL
echo "🗄️ Устанавливаю PostgreSQL..."
if ! command -v psql &> /dev/null; then
    apt install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
fi

# Создание базы данных и пользователя
echo "🔐 Настраиваю PostgreSQL..."
sudo -u postgres psql <<EOF
-- Удаляем пользователя и БД если существуют
DROP DATABASE IF EXISTS $DB_NAME;
DROP USER IF EXISTS $DB_USER;

-- Создаем пользователя
CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';

-- Создаем базу данных
CREATE DATABASE $DB_NAME OWNER $DB_USER;

-- Даем права
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Подключаемся к БД и даем права на схему
\c $DB_NAME
GRANT ALL ON SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;

\q
EOF

# Настройка PostgreSQL
echo "⚙️ Настраиваю PostgreSQL конфигурацию..."
PG_VERSION=$(psql --version | awk '{print $3}' | cut -d. -f1,2)
PG_CONF="/etc/postgresql/${PG_VERSION}/main/postgresql.conf"
PG_HBA="/etc/postgresql/${PG_VERSION}/main/pg_hba.conf"

# Разрешаем локальные подключения
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" "$PG_CONF" 2>/dev/null || true

systemctl restart postgresql

# Установка PM2
echo "📦 Устанавливаю PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# Создание директории для сайта
echo "📁 Создаю директорию для сайта..."
mkdir -p "$SERVER_DIR"
chown -R $USER:$USER "$SERVER_DIR" 2>/dev/null || true

# Установка Nginx
echo "🌐 Устанавливаю Nginx..."
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
fi

# Установка Certbot для SSL
echo "🔒 Устанавливаю Certbot для SSL..."
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx
fi

# Настройка Firewall
echo "🔥 Настраиваю firewall..."
ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3000/tcp  # Node.js (временно)

echo ""
echo "✅ Базовая установка завершена!"
echo ""
echo "📋 Информация для .env файла:"
echo "  DATABASE_URL=\"postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME?schema=public\""
echo ""
echo "🔐 Пароль БД сохранен выше - скопируйте его в .env файл!"
echo ""
echo "📝 Следующие шаги:"
echo "  1. Загрузите проект в $SERVER_DIR"
echo "  2. Создайте .env файл с DATABASE_URL"
echo "  3. Запустите: npm install && npm run db:push && npm run build"
echo "  4. Настройте Nginx (скрипт setup-nginx.sh)"
echo "  5. Запустите: pm2 start npm --name 'aquagazteh' -- start"
