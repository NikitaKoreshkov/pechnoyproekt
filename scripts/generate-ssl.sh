#!/bin/bash

# 🔒 Скрипт для генерации SSL ключа и самоподписанного сертификата
# Использование: ./scripts/generate-ssl.sh [domain]

set -e

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Параметры
DOMAIN="${1:-localhost}"
DAYS="${2:-365}"
KEY_SIZE="${3:-2048}"

# Директория для SSL файлов
SSL_DIR="./ssl"
if [ "$EUID" -eq 0 ]; then
    # Если запущено от root, используем системную директорию
    SSL_DIR="/etc/nginx/ssl"
fi

echo -e "${GREEN}🔒 Генерация SSL ключа и сертификата${NC}"
echo "Домен: $DOMAIN"
echo "Срок действия: $DAYS дней"
echo "Размер ключа: $KEY_SIZE бит"
echo "Директория: $SSL_DIR"
echo ""

# Создаем директорию если её нет
mkdir -p "$SSL_DIR"

# Генерируем приватный ключ
echo -e "${YELLOW}📝 Генерация приватного ключа...${NC}"
openssl genrsa -out "$SSL_DIR/site.key" "$KEY_SIZE"
chmod 600 "$SSL_DIR/site.key"
echo -e "${GREEN}✅ Ключ создан: $SSL_DIR/site.key${NC}"

# Генерируем запрос на сертификат (CSR)
echo -e "${YELLOW}📝 Генерация запроса на сертификат...${NC}"
openssl req -new -key "$SSL_DIR/site.key" -out "$SSL_DIR/site.csr" \
    -subj "/C=RU/ST=Moscow/L=Moscow/O=Development/CN=$DOMAIN"

# Генерируем самоподписанный сертификат
echo -e "${YELLOW}📝 Генерация самоподписанного сертификата...${NC}"
openssl x509 -req -days "$DAYS" -in "$SSL_DIR/site.csr" \
    -signkey "$SSL_DIR/site.key" -out "$SSL_DIR/site.crt" \
    -extensions v3_req -extfile <(
        echo "[v3_req]"
        echo "keyUsage = keyEncipherment, dataEncipherment"
        echo "extendedKeyUsage = serverAuth"
        echo "subjectAltName = @alt_names"
        echo "[alt_names]"
        echo "DNS.1 = $DOMAIN"
        echo "DNS.2 = www.$DOMAIN"
        echo "DNS.3 = localhost"
        echo "IP.1 = 127.0.0.1"
    )

chmod 644 "$SSL_DIR/site.crt"
echo -e "${GREEN}✅ Сертификат создан: $SSL_DIR/site.crt${NC}"

# Удаляем CSR файл (он больше не нужен)
rm -f "$SSL_DIR/site.csr"

echo ""
echo -e "${GREEN}✅ SSL ключ и сертификат успешно созданы!${NC}"
echo ""
echo "Файлы:"
echo "  🔑 Приватный ключ: $SSL_DIR/site.key"
echo "  📜 Сертификат:     $SSL_DIR/site.crt"
echo ""
echo "Для использования в Nginx добавьте в конфигурацию:"
echo ""
echo "  ssl_certificate     $SSL_DIR/site.crt;"
echo "  ssl_certificate_key $SSL_DIR/site.key;"
echo ""
echo -e "${YELLOW}⚠️  Это самоподписанный сертификат. Браузеры будут показывать предупреждение.${NC}"
echo "Для продакшена используйте Let's Encrypt или другой доверенный CA."
