#!/bin/bash
# Первоначальная настройка сервера для печнойпроект.рф
# Выполните НА СЕРВЕРЕ: bash setup-server-pechnoyproekt.sh
# Или: ssh root@[2a03:6f00:a::72f5] 'bash -s' < scripts/setup-server-pechnoyproekt.sh

set -e

DOMAIN="печнойпроект.рф"
DOMAIN_PUNYCODE="xn--e1aalfmgbdekz5c.xn--p1ai"
SERVER_DIR="/var/www/pechnoyproekt"
DB_NAME="pechnoyproekt"
DB_USER="pechnoyproekt"
DB_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

echo "🚀 Настройка сервера для $DOMAIN..."

# Определяем менеджер пакетов
if command -v apt &>/dev/null; then
    PKG_UPDATE="apt update"
    PKG_INSTALL="apt install -y"
    PKG_UPGRADE="apt upgrade -y"
elif command -v yum &>/dev/null; then
    PKG_UPDATE="yum check-update || true"
    PKG_INSTALL="yum install -y"
    PKG_UPGRADE="yum update -y"
    yum install -y epel-release 2>/dev/null || true
else
    echo "❌ Неизвестная система. Нужен apt или yum."
    exit 1
fi

echo "📦 Обновление системы..."
$PKG_UPDATE && $PKG_UPGRADE

echo "🔧 Базовые пакеты..."
$PKG_INSTALL curl wget git build-essential 2>/dev/null || $PKG_INSTALL curl wget git gcc gcc-c++ make

# Node.js 20
echo "📦 Node.js 20..."
if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x 2>/dev/null | bash - 2>/dev/null || \
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    $PKG_INSTALL nodejs
fi
echo "   Node: $(node --version), npm: $(npm --version)"

# PostgreSQL
echo "🗄️ PostgreSQL..."
if ! command -v psql &>/dev/null; then
    $PKG_INSTALL postgresql postgresql-contrib 2>/dev/null || $PKG_INSTALL postgresql-server postgresql-contrib
    if command -v postgresql-setup &>/dev/null; then
        postgresql-setup --initdb
    fi
    systemctl start postgresql
    systemctl enable postgresql
fi

# Создание БД
echo "🔐 Создание БД $DB_NAME..."
sudo -u postgres psql <<EOF
DROP DATABASE IF EXISTS $DB_NAME;
DROP USER IF EXISTS $DB_USER;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\c $DB_NAME
GRANT ALL ON SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
\q
EOF

# PM2
echo "📦 PM2..."
npm install -g pm2 2>/dev/null || true

# Директория сайта
mkdir -p "$SERVER_DIR"
chown -R $USER:$USER "$SERVER_DIR" 2>/dev/null || true

# Nginx
echo "🌐 Nginx..."
if ! command -v nginx &>/dev/null; then
    $PKG_INSTALL nginx
fi

# Certbot для SSL
echo "🔒 Certbot..."
if ! command -v certbot &>/dev/null; then
    $PKG_INSTALL certbot python3-certbot-nginx 2>/dev/null || $PKG_INSTALL certbot python3-certbot-nginx 2>/dev/null || echo "⚠️ Certbot не установился — получите SSL вручную"
fi

echo ""
echo "✅ Установка завершена!"
echo ""
echo "📋 DATABASE_URL для .env:"
echo "   postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME?schema=public"
echo ""
echo "📝 Следующие шаги:"
echo "   1. Загрузите проект: ./deploy-pechnoyproekt.sh (с локальной машины)"
echo "   2. Создайте .env на сервере в $SERVER_DIR"
echo "   3. npm run db:push && npm run db:seed-full"
echo "   4. Запустите setup-nginx-pechnoyproekt.sh на сервере"
echo "   5. certbot --nginx -d $DOMAIN_PUNYCODE (для SSL)"
echo ""
