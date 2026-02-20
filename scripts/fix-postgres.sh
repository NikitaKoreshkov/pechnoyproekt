#!/bin/bash
# Удаляет устаревший postmaster.pid и запускает PostgreSQL.
# Запусти из корня проекта: ./scripts/fix-postgres.sh

PIDFILE="/opt/homebrew/var/postgresql@14/postmaster.pid"

if [ -f "$PIDFILE" ]; then
  PID=$(head -1 "$PIDFILE")
  if ! ps -p "$PID" >/dev/null 2>&1; then
    echo "Удаляю устаревший postmaster.pid (процесс $PID не запущен)..."
    rm -f "$PIDFILE"
  else
    echo "PostgreSQL уже запущен (PID $PID)."
    exit 0
  fi
fi

echo "Запускаю postgresql@14..."
brew services start postgresql@14

echo ""
echo "Проверка через 3 сек..."
sleep 3
if brew services list | grep -q "postgresql@14.*started"; then
  echo "✔ Сервис postgresql@14 запущен."
  echo "Дальше: ./scripts/start-all.sh"
else
  echo "Статус: brew services list | grep postgres"
  brew services list | grep postgres || true
fi
