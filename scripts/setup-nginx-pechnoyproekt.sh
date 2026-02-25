#!/bin/bash
# Nginx для печнойпроект.рф
# Выполните НА СЕРВЕРЕ: bash setup-nginx-pechnoyproekt.sh

set -e

DOMAIN="печнойпроект.рф"
DOMAIN_PUNYCODE="xn--e1aalfmgbdekz5c.xn--p1ai"
SERVER_DIR="/var/www/pechnoyproekt"
SSL_DIR="/etc/nginx/ssl"

echo "🌐 Nginx для $DOMAIN ($DOMAIN_PUNYCODE)..."

mkdir -p "$SSL_DIR"

# SSL
SSL_CERT=""
SSL_KEY=""
LE_LIVE="/etc/letsencrypt/live/$DOMAIN_PUNYCODE"
if [ -f "$LE_LIVE/fullchain.pem" ] && [ -f "$LE_LIVE/privkey.pem" ]; then
    echo "📜 Let's Encrypt: $LE_LIVE"
    SSL_CERT="$LE_LIVE/fullchain.pem"
    SSL_KEY="$LE_LIVE/privkey.pem"
else
    echo "⚠️ Создаю самоподписанный сертификат (для продакшена: certbot --nginx -d $DOMAIN_PUNYCODE)"
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$SSL_DIR/pechnoyproekt.key" \
        -out "$SSL_DIR/pechnoyproekt.crt" \
        -subj "/CN=$DOMAIN_PUNYCODE" \
        -addext "keyUsage=critical,digitalSignature,keyEncipherment" \
        -addext "extendedKeyUsage=serverAuth"
    chmod 600 "$SSL_DIR/pechnoyproekt.key"
    SSL_CERT="$SSL_DIR/pechnoyproekt.crt"
    SSL_KEY="$SSL_DIR/pechnoyproekt.key"
fi

# Конфиг Nginx
if [ -d /etc/nginx/conf.d ]; then
    NGINX_CONF="/etc/nginx/conf.d/pechnoyproekt.conf"
else
    mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
    NGINX_CONF="/etc/nginx/sites-available/pechnoyproekt"
fi

cat > "$NGINX_CONF" <<EOF
# Редирект HTTP -> HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN_PUNYCODE $DOMAIN;
    return 301 https://\$host\$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN_PUNYCODE $DOMAIN;

    ssl_certificate $SSL_CERT;
    ssl_certificate_key $SSL_KEY;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    client_max_body_size 50M;

    access_log /var/log/nginx/pechnoyproekt-access.log;
    error_log /var/log/nginx/pechnoyproekt-error.log;

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        add_header Cache-Control "public, immutable, max-age=31536000";
    }

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
    }

    location /uploads/ {
        alias $SERVER_DIR/public/uploads/;
        expires 30d;
    }

    location /images/ {
        alias $SERVER_DIR/public/images/;
        expires 30d;
    }
}
EOF

# Symlink для sites-enabled
if [[ "$NGINX_CONF" == *sites-available* ]]; then
    ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/
fi

nginx -t
systemctl restart nginx
systemctl enable nginx

echo "✅ Nginx настроен. Для Let's Encrypt: certbot --nginx -d $DOMAIN_PUNYCODE"
