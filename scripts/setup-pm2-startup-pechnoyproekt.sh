#!/bin/bash
# Настройка автозапуска PM2 при перезагрузке сервера (печнойпроект.рф)
# Запуск ЛОКАЛЬНО: ./scripts/setup-pm2-startup-pechnoyproekt.sh
# Выполнить один раз после первой настройки сервера.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SSH_KEY="${SSH_KEY:-${PROJECT_ROOT}/pechnoyproekt_deploy_key}"
[[ "$SSH_KEY" == ~* ]] && SSH_KEY="${HOME}${SSH_KEY:1}"
SSH_HOST_ALIAS="pechnoyproekt-deploy"

run_ssh() {
    local opts="-o StrictHostKeyChecking=no -o ConnectTimeout=30"
    if [ -n "$SSH_KEY" ] && [ -f "$SSH_KEY" ]; then
        ssh -i "$SSH_KEY" $opts "${SSH_HOST_ALIAS}" "$@"
    else
        ssh $opts "${SSH_HOST_ALIAS}" "$@"
    fi
}

echo "🔧 Настройка автозапуска PM2 на сервере печнойпроект.рф..."
run_ssh 'bash -s' << 'ENDSSH'
set -e
# Сохраняем текущий список процессов PM2
pm2 save

# Создаём systemd unit для автозапуска PM2 при загрузке ОС
OUT=$(pm2 startup systemd -u root --hp /root 2>&1)
if echo "$OUT" | grep -qE 'Command successfully executed|Created symlink|already'; then
  echo "✅ PM2 startup настроен (автозапуск после перезагрузки)"
elif CMD=$(echo "$OUT" | grep -oE '(sudo|env|su) [^|]+' | head -1); [ -n "$CMD" ]; then
  eval "$CMD"
  echo "✅ PM2 startup настроен"
else
  echo "⚠️ PM2 startup:"
  echo "$OUT"
  exit 1
fi
ENDSSH

echo ""
echo "✅ Готово. После перезагрузки сервера PM2 автоматически запустит pechnoyproekt."
