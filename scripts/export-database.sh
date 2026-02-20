#!/bin/bash
# Скрипт для экспорта базы данных PostgreSQL
# Использование: ./scripts/export-database.sh

set -e

# Читаем DATABASE_URL из .env
if [ ! -f ".env" ]; then
    echo "❌ Файл .env не найден!"
    exit 1
fi

source .env
export DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL не найден в .env!"
    exit 1
fi

# Парсим DATABASE_URL
# Формат: postgresql://user:password@host:port/database или postgresql://user@host:port/database
AUTH_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*://\([^/]*\)/.*|\1|p')
DB_USER=$(echo "$AUTH_HOST" | sed -n 's/^\([^:]*\):.*@.*/\1/p')
if [ -z "$DB_USER" ]; then
  DB_USER=$(echo "$AUTH_HOST" | sed -n 's/^\([^@]*\)@.*/\1/p')
fi
DB_PASS=$(echo "$AUTH_HOST" | sed -n 's/^[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo "$AUTH_HOST" | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo "📦 Экспорт базы данных..."
echo "  База: $DB_NAME"
echo "  Хост: $DB_HOST:$DB_PORT"
echo ""

# Создаем директорию для дампов
mkdir -p ./backups
DUMP_FILE="./backups/database_$(date +%Y%m%d_%H%M%S).sql"

# Экспорт с паролем через переменную окружения
export PGPASSWORD="$DB_PASS"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" --clean --if-exists > "$DUMP_FILE"

echo "✅ База данных экспортирована: $DUMP_FILE"

# Также создаем дамп только данных (без схемы)
DUMP_DATA_FILE="./backups/database_data_$(date +%Y%m%d_%H%M%S).sql"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" --data-only --inserts > "$DUMP_DATA_FILE"

echo "✅ Данные экспортированы: $DUMP_DATA_FILE"

# Создаем сжатую версию
gzip -f "$DUMP_FILE"
echo "✅ Создан сжатый дамп: ${DUMP_FILE}.gz"
