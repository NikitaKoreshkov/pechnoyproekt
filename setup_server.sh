#!/bin/bash
# Скрипт установки окружения для Next.js проекта на Ubuntu 24.04
# Выполните на сервере: bash setup_server.sh

set -e

echo "🚀 Начинаю установку окружения..."

# Обновление системы
echo "📦 Обновляю систему..."
apt update && apt upgrade -y

# Установка необходимых инструментов
echo "🔧 Устанавливаю базовые инструменты..."
apt install -y curl wget git build-essential

# Установка Node.js 20.x (LTS)
echo "📦 Устанавливаю Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Проверка версии
node --version
npm --version

# Установка PostgreSQL
echo "🗄️ Устанавливаю PostgreSQL..."
apt install -y postgresql postgresql-contrib

# Запуск и автозапуск PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Создание базы данных и пользователя
echo "🔐 Настраиваю PostgreSQL..."
sudo -u postgres psql <<EOF
-- Создаем пользователя
CREATE USER siteuser WITH PASSWORD 'site_password_change_me';
-- Создаем базу данных
CREATE DATABASE sitedb OWNER siteuser;
-- Даем права
GRANT ALL PRIVILEGES ON DATABASE sitedb TO siteuser;
\q
EOF

# Настройка PostgreSQL для подключений
echo "⚙️ Настраиваю PostgreSQL конфигурацию..."
PG_VERSION=$(psql --version | awk '{print $3}' | cut -d. -f1,2)
PG_CONF="/etc/postgresql/${PG_VERSION}/main/postgresql.conf"
PG_HBA="/etc/postgresql/${PG_VERSION}/main/pg_hba.conf"

# Разрешаем подключения (для локального использования)
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" "$PG_CONF"

# Перезапускаем PostgreSQL
systemctl restart postgresql

# Установка PM2 для управления процессом Node.js
echo "📦 Устанавливаю PM2..."
npm install -g pm2

# Создание директории для сайта
echo "📁 Создаю директорию для сайта..."
mkdir -p /home/u192427/www
chown -R u192427:u192427 /home/u192427/www 2>/dev/null || mkdir -p /var/www/site
chown -R $USER:$USER /var/www/site 2>/dev/null || echo "Directory created"

# Установка UFW (Firewall) - опционально
echo "🔥 Настраиваю firewall..."
ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3000/tcp  # Node.js (временно, потом через nginx)

# Установка Nginx (опционально, для reverse proxy)
echo "🌐 Устанавливаю Nginx..."
apt install -y nginx

# Создание базовой конфигурации Nginx (будет настроена позже)
echo "✅ Базовая установка завершена!"

echo ""
echo "📋 Резюме установки:"
echo "  Node.js: $(node --version)"
echo "  npm: $(npm --version)"
echo "  PostgreSQL: $(psql --version)"
echo "  PM2: $(pm2 --version 2>/dev/null || echo 'установлен')"
echo ""
echo "📝 Важно:"
echo "  - Измените пароль PostgreSQL: site_password_change_me"
echo "  - Создайте .env файл с настройками DATABASE_URL"
echo "  - Загрузите проект в /var/www/site или /home/u192427/www"
echo ""
echo "🔗 DATABASE_URL для .env:"
echo "  postgresql://siteuser:site_password_change_me@localhost:5432/sitedb?schema=public"
echo ""

