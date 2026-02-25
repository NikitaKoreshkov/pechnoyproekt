#!/bin/bash
# Запуск всего: PostgreSQL → схема и сид → dev-сервер
# Запусти в терминале из корня проекта: ./scripts/start-all.sh

set -e
cd "$(dirname "$0")/.."

# Проверка подключения к БД через Prisma (надёжнее, чем проверка порта)
db_ready() {
  npx prisma db push --accept-data-loss 2>/dev/null
}

echo "🔧 1. PostgreSQL и база fire..."
if db_ready; then
  echo "   ✔ Подключение к БД есть."
else
  # Пробуем запустить сервис и подождать
  for svc in postgresql@14 postgresql@15 postgresql@16 postgresql; do
    if brew services list 2>/dev/null | grep -q "$svc"; then
      echo "   Запускаю $svc..."
      brew services start "$svc" 2>/dev/null || true
      break
    fi
  done
  echo "   Ждём БД (макс. 25 сек)..."
  for i in $(seq 1 5); do
    sleep 5
    if db_ready; then echo "   ✔ Подключение к БД есть."; break; fi
    if [ "$i" -eq 5 ]; then
      echo ""
      echo "   ⚠️ Не удалось подключиться к БД. Сделай:"
      echo "      ./scripts/fix-postgres.sh   # если был крах/перезагрузка"
      echo "      brew services start postgresql@14"
      echo "      createdb fire                # если базы нет"
      echo "   Потом снова: ./scripts/start-all.sh"
      exit 1
    fi
  done
fi

echo ""
echo "🗄️ 2. Сид (если нужен)..."
npx prisma db seed 2>/dev/null || echo "   (сид пропущен или уже есть данные)"

echo ""
echo "🚀 3. Запуск dev-сервера..."
exec npm run dev
