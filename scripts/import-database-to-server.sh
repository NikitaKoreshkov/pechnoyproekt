#!/bin/bash
# Импорт локальной БД на сервер печнойпроект.рф
# Запуск: ./scripts/import-database-to-server.sh [путь_к_дампу.sql.gz]
# Сначала: ./scripts/export-database.sh

set -e

# Используем алиас из ~/.ssh/config
SSH_HOST_ALIAS="pechnoyproekt-deploy"
SERVER_IP="103.88.241.196"
ensure_ssh_config() {
    local cfg="$HOME/.ssh/config"
    mkdir -p "$(dirname "$cfg")"
    if [ ! -f "$cfg" ] || ! grep -q "Host ${SSH_HOST_ALIAS}" "$cfg" 2>/dev/null; then
        touch "$cfg"
        _script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
        SSH_KEY_DEFAULT="${SSH_KEY:-${_script_dir}/pechnoyproekt_deploy_key}"
        echo "" >> "$cfg"
        echo "# Печнойпроект.рф" >> "$cfg"
        echo "Host ${SSH_HOST_ALIAS}" >> "$cfg"
        echo "    HostName ${SERVER_IP}" >> "$cfg"
        echo "    User root" >> "$cfg"
        [ -f "$SSH_KEY_DEFAULT" ] && echo "    IdentityFile $SSH_KEY_DEFAULT" >> "$cfg"
        echo "   ✓ Добавлен хост ${SSH_HOST_ALIAS} в ~/.ssh/config"
    elif grep -A2 "Host ${SSH_HOST_ALIAS}" "$cfg" 2>/dev/null | grep -q "2a03:6f00:a::72f5"; then
        sed -i.bak "s/HostName 2a03:6f00:a::72f5/HostName ${SERVER_IP}/" "$cfg"
        echo "   ✓ Обновлён HostName на ${SERVER_IP} в ~/.ssh/config"
    fi
}
ensure_ssh_config
SERVER_HOST="${SERVER_HOST:-${SSH_HOST_ALIAS}}"
SERVER_USER="root"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SSH_KEY="${SSH_KEY:-${SCRIPT_DIR}/pechnoyproekt_deploy_key}"
SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"

DUMP="${1:-}"
if [ -z "$DUMP" ]; then
    LATEST=$(ls -t backups/database_*.sql.gz 2>/dev/null | head -1)
    if [ -n "$LATEST" ]; then
        DUMP="$LATEST"
        echo "📦 Использую последний дамп: $DUMP"
    else
        echo "❌ Сначала выполните: ./scripts/export-database.sh"
        echo "   Или укажите путь: $0 backups/database_YYYYMMDD_HHMMSS.sql.gz"
        exit 1
    fi
fi

if [ ! -f "$DUMP" ]; then
    echo "❌ Файл не найден: $DUMP"
    exit 1
fi
if [[ "$DUMP" != *.gz ]]; then
    echo "⚠️ Ожидается файл .sql.gz (результат export-database.sh)"
    exit 1
fi

REMOTE_PATH="/tmp/dump_import.sql.gz"
echo "📤 Копирую дамп на сервер..."
if [ -n "$SSH_KEY" ] && [ -f "$SSH_KEY" ]; then
    scp -i "$SSH_KEY" $SSH_OPTS "$DUMP" "${SERVER_USER}@${SERVER_HOST}:${REMOTE_PATH}"
else
    scp $SSH_OPTS "$DUMP" "${SERVER_USER}@${SERVER_HOST}:${REMOTE_PATH}"
fi

echo "📥 Импорт на сервере..."
RUN="gunzip -c ${REMOTE_PATH} | sudo -u postgres psql -d pechnoyproekt -q -f - 2>/dev/null || gunzip -c ${REMOTE_PATH} | psql -U pechnoyproekt -d pechnoyproekt -q -f -; rm -f ${REMOTE_PATH}"
if [ -n "$SSH_KEY" ] && [ -f "$SSH_KEY" ]; then
    ssh -i "$SSH_KEY" $SSH_OPTS "${SERVER_USER}@${SERVER_HOST}" "$RUN"
else
    ssh $SSH_OPTS "${SERVER_USER}@${SERVER_HOST}" "$RUN"
fi

echo "✅ Импорт завершён"
