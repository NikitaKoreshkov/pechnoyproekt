#!/bin/bash
# Скрипт настройки Nginx с SSL для aquagazteh.ru
# Выполните на сервере: bash setup-nginx-aquagazteh.sh

set -e

DOMAIN="aquagazteh.ru"
SERVER_DIR="/var/www/aquagazteh"
SSL_DIR="/etc/nginx/ssl"

echo "🌐 Настраиваю Nginx для $DOMAIN..."

# Выбираем SSL (приоритет: Let's Encrypt → проект ssl/ → самоподписанный с keyUsage)
SSL_CERT=""
SSL_KEY=""
mkdir -p "$SSL_DIR"

LE_LIVE="/etc/letsencrypt/live/$DOMAIN"
if [ -f "$LE_LIVE/fullchain.pem" ] && [ -f "$LE_LIVE/privkey.pem" ]; then
    echo "📜 Использую Let's Encrypt: $LE_LIVE"
    SSL_CERT="$LE_LIVE/fullchain.pem"
    SSL_KEY="$LE_LIVE/privkey.pem"
elif [ -f "$SERVER_DIR/ssl/site.crt" ] && [ -f "$SERVER_DIR/ssl/site.key" ]; then
    echo "📜 Копирую SSL из проекта..."
    cp "$SERVER_DIR/ssl/site.crt" "$SSL_DIR/aquagazteh.crt"
    cp "$SERVER_DIR/ssl/site.key" "$SSL_DIR/aquagazteh.key"
    chmod 600 "$SSL_DIR/aquagazteh.key"
    chmod 644 "$SSL_DIR/aquagazteh.crt"
    SSL_CERT="$SSL_DIR/aquagazteh.crt"
    SSL_KEY="$SSL_DIR/aquagazteh.key"
else
    echo "⚠️ Создаю самоподписанный (keyUsage=serverAuth)..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$SSL_DIR/aquagazteh.key" \
        -out "$SSL_DIR/aquagazteh.crt" \
        -subj "/C=RU/ST=Moscow/L=Moscow/O=AquaGazTeh/CN=$DOMAIN" \
        -addext "keyUsage=critical,digitalSignature,keyEncipherment" \
        -addext "extendedKeyUsage=serverAuth"
    chmod 600 "$SSL_DIR/aquagazteh.key"
    SSL_CERT="$SSL_DIR/aquagazteh.crt"
    SSL_KEY="$SSL_DIR/aquagazteh.key"
fi

# Создаем конфигурацию Nginx (conf.d — AlmaLinux/RHEL; sites-available — Debian/Ubuntu)
NGINX_CONF=""
if [ -d /etc/nginx/conf.d ]; then
    NGINX_CONF="/etc/nginx/conf.d/aquagazteh.conf"
elif [ -d /etc/nginx/sites-available ]; then
    mkdir -p /etc/nginx/sites-enabled
    NGINX_CONF="/etc/nginx/sites-available/aquagazteh"
else
    mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
    NGINX_CONF="/etc/nginx/sites-available/aquagazteh"
fi
echo "📝 Создаю конфигурацию Nginx: $NGINX_CONF"
cat > "$NGINX_CONF" <<EOF
# Редирект HTTP на HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    # Редирект на HTTPS
    return 301 https://\$server_name\$request_uri;
}

# HTTPS сервер
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # SSL сертификаты (Let's Encrypt / проект / самоподписанный)
    ssl_certificate $SSL_CERT;
    ssl_certificate_key $SSL_KEY;

    # SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Логи
    access_log /var/log/nginx/aquagazteh-access.log;
    error_log /var/log/nginx/aquagazteh-error.log;

    # Максимальный размер загружаемых файлов
    client_max_body_size 50M;

    # _next/static — чанки (proxy_pass без URI = передаём URI как есть, без нормализации)
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        add_header Cache-Control "public, immutable, max-age=31536000";
    }

    # Страницы, API — всё остальное
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Файлы загрузок
    location /uploads {
        alias $SERVER_DIR/public/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Файлы изображений
    location /images {
        alias $SERVER_DIR/public/images;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Активируем (symlink для Debian-стиля; conf.d подхватывается сам)
if [[ "$NGINX_CONF" == *sites-available* ]]; then
    echo "🔗 Активирую конфигурацию (sites-enabled)..."
    ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
fi

# Проверяем конфигурацию
echo "✅ Проверяю конфигурацию Nginx..."
nginx -t

# Перезапускаем Nginx
echo "🔄 Перезапускаю Nginx..."
systemctl restart nginx
systemctl enable nginx

echo ""
echo "✅ Nginx настроен и запущен!"
echo ""
echo "📝 Проверьте:"
echo "  - HTTP редирект: http://$DOMAIN"
echo "  - HTTPS работает: https://$DOMAIN"
echo ""
echo "⚠️ Для получения валидного SSL сертификата от Let's Encrypt выполните:"
echo "  certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
