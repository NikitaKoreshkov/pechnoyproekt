# ⚡ Быстрый деплой на aquagazteh.ru

## 🎯 Что нужно сделать

### 1. Добавить SSH ключ на сервер

```bash
# Скопируйте публичный ключ на сервер
ssh-copy-id -i ./site.pub root@89.111.152.195
```

Или вручную добавьте в `~/.ssh/authorized_keys` на сервере:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIItXWtyPLabIA1liTz8pJydriAf/QZBp5xPP7rJ5IGyc trybi-key
```

### 2. Настройка сервера (выполнить на сервере)

```bash
# Загрузите скрипт
scp -i ./site scripts/setup-server-aquagazteh.sh root@89.111.152.195:/root/

# Подключитесь
ssh -i ./site root@89.111.152.195

# Выполните настройку
bash /root/setup-server-aquagazteh.sh
```

**⚠️ Сохраните DATABASE_URL из вывода!**

### 3. Экспорт БД (если есть данные)

```bash
./scripts/export-database.sh
```

### 4. Деплой проекта

```bash
./deploy-aquagazteh.sh
```

### 5. Настройка .env на сервере

```bash
ssh -i ./site root@89.111.152.195
cd /var/www/aquagazteh
nano .env
```

Вставьте (используйте DATABASE_URL из шага 2):
```env
DATABASE_URL="postgresql://aquagaztehuser:ПАРОЛЬ@localhost:5432/aquagaztehdb?schema=public"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="https://aquagazteh.ru"
NEXT_PUBLIC_SITE_URL="https://aquagazteh.ru"
```

### 6. Настройка Nginx

```bash
# На сервере
scp -i ./site scripts/setup-nginx-aquagazteh.sh root@89.111.152.195:/root/
ssh -i ./site root@89.111.152.195
bash /root/setup-nginx-aquagazteh.sh
```

### 7. Импорт данных (если есть дамп)

```bash
# На сервере
cd /var/www/aquagazteh
DB_PASS=$(grep DATABASE_URL .env | cut -d: -f3 | cut -d@ -f1)
LATEST_DUMP=$(ls -t backups/database_*.sql.gz | head -1)
gunzip -c "$LATEST_DUMP" | PGPASSWORD="$DB_PASS" psql -h localhost -U aquagaztehuser -d aquagaztehdb
```

### 8. Запуск

```bash
# На сервере
cd /var/www/aquagazteh
pm2 start npm --name "aquagazteh" -- start
pm2 save
pm2 startup
```

### 9. SSL от Let's Encrypt (после настройки DNS)

```bash
ssh -i ./site root@89.111.152.195
certbot --nginx -d aquagazteh.ru -d www.aquagazteh.ru
```

---

## ✅ Проверка

- http://aquagazteh.ru → должен редиректить на HTTPS
- https://aquagazteh.ru → должен открыться сайт
- https://aquagazteh.ru/admin → админ-панель

---

Подробная инструкция: [DEPLOY_AQUAGAZTEH.md](./DEPLOY_AQUAGAZTEH.md)
