#!/bin/bash
# Скрипт установки окружения для Next.js проекта на AlmaLinux
# Выполните на сервере: bash setup-server-almalinux.sh

set -e

DOMAIN="aquagazteh.ru"
SERVER_DIR="/var/www/aquagazteh"
DB_NAME="aquagaztehdb"
DB_USER="aquagaztehuser"
DB_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

echo "🚀 Начинаю установку окружения для $DOMAIN на AlmaLinux..."

# Обновление системы
echo "📦 Обновляю систему..."
yum update -y

# Установка EPEL репозитория для дополнительных пакетов
echo "🔧 Подключаю EPEL репозиторий..."
yum install -y epel-release

# Установка необходимых инструментов
echo "🔧 Устанавливаю базовые инструменты..."
yum install -y curl wget git gcc gcc-c++ make openssl firewalld

# Установка Node.js 20.x (LTS)
echo "📦 Устанавливаю Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    yum install -y nodejs
fi

echo "  Node.js: $(node --version)"
echo "  npm: $(npm --version)"

# Установка PostgreSQL
echo "🗄️ Устанавливаю PostgreSQL..."
if ! command -v psql &> /dev/null; then
    yum install -y postgresql-server postgresql-contrib
    postgresql-setup --initdb
    systemctl start postgresql
    systemctl enable postgresql
fi

# Настройка PostgreSQL для подключений
echo "⚙️ Настраиваю PostgreSQL..."
PG_VERSION=$(psql --version | awk '{print $3}' | sed 's/\..*//')
PG_DATA="/var/lib/pgsql/data"

# Разрешаем локальные подключения
if [ -f "$PG_DATA/postgresql.conf" ]; then
    sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" "$PG_DATA/postgresql.conf"
fi

# Настройка аутентификации для локальных подключений
if [ -f "$PG_DATA/pg_hba.conf" ]; then
    # Добавляем строку для md5 аутентификации если её нет
    if ! grep -q "local.*all.*all.*md5" "$PG_DATA/pg_hba.conf"; then
        sed -i 's/local.*all.*all.*peer/local   all             all                                     md5/' "$PG_DATA/pg_hba.conf"
    fi
fi

systemctl restart postgresql

# Создание базы данных и пользователя
echo "🔐 Настраиваю PostgreSQL базу данных..."
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
    yum install -y nginx
fi

# Настройка Firewall
echo "🔥 Настраиваю firewall..."
systemctl start firewalld
systemctl enable firewalld
firewall-cmd --permanent --add-service=ssh
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --reload

echo ""
echo "✅ Базовая установка завершена!"
echo ""
echo "📋 Информация для .env файла:"
echo "DATABASE_URL=\"postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME?schema=public\""
echo ""
echo "🔐 Пароль БД сохранен выше - скопируйте его в .env файл!"
echo ""
echo "📝 Следующие шаги:"
echo "  1. Загрузите проект в $SERVER_DIR"
echo "  2. Создайте .env файл с DATABASE_URL"
echo "  3. Запустите: npm install && npm run db:push && npm run build"
echo "  4. Настройте Nginx (скрипт setup-nginx.sh)"
echo "  5. Запустите: pm2 start npm --name 'aquagazteh' -- start"