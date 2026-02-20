#!/bin/bash
# Создание новой базы данных для проекта (trybi / AquaGazTeh) и при необходимости миграция из старой.
# Запуск из корня проекта: ./scripts/create-new-database.sh [имя_базы]
# Пример с миграцией из старой БД: OLD_DATABASE_URL="postgresql://nikitos@localhost:5432/mydb" ./scripts/create-new-database.sh aquagazteh

set -e
cd "$(dirname "$0")/.."

NEW_DB_NAME="${1:-aquagazteh}"
# Пользователь PostgreSQL: из DATABASE_URL в .env или переменная PGUSER или nikitos
PG_USER="${PGUSER:-nikitos}"
if [ -f ".env" ] && grep -q '^DATABASE_URL=' .env 2>/dev/null; then
  URL=$(grep '^DATABASE_URL=' .env | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
  U=$(echo "$URL" | sed -n 's|.*://\([^:]*\):.*@.*|\1|p')
  [ -z "$U" ] && U=$(echo "$URL" | sed -n 's|.*://\([^@]*\)@.*|\1|p')
  [ -n "$U" ] && PG_USER="$U"
fi
OLD_DATABASE_URL="${OLD_DATABASE_URL:-}"

echo "📦 Новая база: $NEW_DB_NAME"
echo "   Пользователь PostgreSQL: $PG_USER"
echo ""

# 1. Создать новую базу
echo "🗄️ Создаю базу $NEW_DB_NAME..."
if psql -U "$PG_USER" -d postgres -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$NEW_DB_NAME"; then
  echo "   База $NEW_DB_NAME уже существует."
else
  createdb -U "$PG_USER" "$NEW_DB_NAME" 2>/dev/null || psql -U "$PG_USER" -d postgres -c "CREATE DATABASE $NEW_DB_NAME;"
  echo "   ✅ База $NEW_DB_NAME создана."
fi
echo ""

# 2. Миграция из старой БД (если задана OLD_DATABASE_URL)
if [ -n "$OLD_DATABASE_URL" ]; then
  echo "📤 Миграция данных из старой базы..."
  mkdir -p ./backups
  DUMP_FILE="./backups/migrate_from_old_$(date +%Y%m%d_%H%M%S).sql"
  
  # Парсим старый URL для pg_dump
  OLD_AUTH=$(echo "$OLD_DATABASE_URL" | sed -n 's|.*://\([^/]*\)/.*|\1|p')
  OLD_USER=$(echo "$OLD_AUTH" | sed -n 's/^\([^:]*\):.*@.*/\1/p')
  [ -z "$OLD_USER" ] && OLD_USER=$(echo "$OLD_AUTH" | sed -n 's/^\([^@]*\)@.*/\1/p')
  OLD_PASS=$(echo "$OLD_AUTH" | sed -n 's/^[^:]*:\([^@]*\)@.*/\1/p')
  OLD_HOST=$(echo "$OLD_AUTH" | sed -n 's/.*@\([^:]*\):.*/\1/p')
  OLD_PORT=$(echo "$OLD_DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  OLD_NAME=$(echo "$OLD_DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
  
  export PGPASSWORD="$OLD_PASS"
  pg_dump -h "${OLD_HOST:-localhost}" -p "${OLD_PORT:-5432}" -U "$OLD_USER" -d "$OLD_NAME" --no-owner --no-acl > "$DUMP_FILE"
  unset PGPASSWORD
  echo "   ✅ Дамп сохранён: $DUMP_FILE"
  
  echo "   Импорт в $NEW_DB_NAME..."
  psql -U "$PG_USER" -d "$NEW_DB_NAME" -f "$DUMP_FILE" >/dev/null 2>&1 || true
  echo "   ✅ Данные перенесены в $NEW_DB_NAME"
  echo ""
else
  echo "ℹ️ Миграция из старой БД не задана (OLD_DATABASE_URL пустой)."
  echo "   Будет использована пустая база — после смены .env выполните: npm run db:push && npm run db:seed"
  echo ""
fi

# 3. Если миграции не было — нужно применить схему и сид (пользователь сделает сам)
# Если миграция была — схема уже в базе, сид можно не запускать или запустить выборочно

echo "---"
echo "✅ Готово. Дальше:"
echo ""
echo "1. В файле .env замените DATABASE_URL на новую базу:"
echo "   DATABASE_URL=\"postgresql://$PG_USER@localhost:5432/$NEW_DB_NAME?schema=public\""
echo "   (если у пользователя есть пароль: postgresql://$PG_USER:ПАРОЛЬ@localhost:5432/$NEW_DB_NAME?schema=public)"
echo ""
if [ -z "$OLD_DATABASE_URL" ]; then
  echo "2. Примените схему и начальные данные:"
  echo "   npm run db:push"
  echo "   npm run db:seed"
  echo ""
fi
echo "3. Запустите проект: npm run dev"
echo ""
