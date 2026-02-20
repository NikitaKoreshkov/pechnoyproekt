# АкваГазТех - Сайт поставки труб ПНД и комплектующих

Полнофункциональный лендинг для компании, занимающейся поставкой качественных труб ПНД (ПЭ) и комплектующих для инженерных систем.

## 🚀 Особенности

- **Современный дизайн** с использованием Tailwind CSS
- **Интерактивный калькулятор** стоимости труб и материалов
- **Каталог проектов** с фильтрацией
- **Адаптивная верстка** для всех устройств
- **SEO оптимизация** с метаданными и структурированными данными
- **Анимации и микровзаимодействия** для улучшения UX
- **Формы обратной связи** с валидацией
- **Интеграция с CRM** (готово к подключению)

## 🛠 Технологии

- **Next.js 14** - React фреймворк
- **TypeScript** - типизация
- **Tailwind CSS** - стилизация
- **Framer Motion** - анимации (готово к подключению)
- **Next/Image** - оптимизация изображений

## 📦 Установка и запуск

### Предварительные требования

- **Node.js 18+** 
- **npm** или **yarn**
- **PostgreSQL** (база данных)
- **Git**

### Шаг 1: Установка зависимостей

```bash
# Перейдите в папку проекта
cd site

# Установите зависимости
npm install
```

### Шаг 2: Настройка базы данных PostgreSQL

1. **Установите PostgreSQL** (если ещё не установлен):
   - Windows/Mac: [Скачать с официального сайта](https://www.postgresql.org/download/)
   - Linux: `sudo apt-get install postgresql`

2. **Создайте базу данных**:
   ```bash
   # Подключитесь к PostgreSQL
   psql -U postgres
   
   # Создайте базу данных
   CREATE DATABASE mydb;
   
   # Выйдите
   \q
   ```

3. **Настройте переменные окружения**:
   Создайте файл `.env` в корне проекта:
   ```env
   # База данных
   DATABASE_URL="postgresql://postgres:password@localhost:5432/mydb?schema=public"
   
   # NextAuth (сгенерируйте свой секретный ключ)
   NEXTAUTH_SECRET="your-secret-key-here-minimum-32-characters-long"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Email для отправки (опционально, для восстановления пароля)
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASSWORD="your-app-password"
   ```

   **Важно:** Замените:
   - `postgres:password` на ваши данные для подключения к PostgreSQL
   - `mydb` на имя вашей базы данных
   - `your-secret-key-here...` на случайную строку (минимум 32 символа)
   - Email настройки при необходимости

### Шаг 3: Настройка базы данных (Prisma)

```bash
# Применить схему базы данных
npm run db:push

# Сгенерировать Prisma Client
npm run db:generate

# Заполнить базу начальными данными (создаст первого админа)
npm run db:seed
```

**После выполнения seed будет создан первый администратор:**
- Email: `a@gmail.com`
- Пароль: `123` (рекомендуется сменить после первого входа)

### Шаг 4: Запуск проекта

```bash
# Режим разработки
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

### Шаг 5: Вход в админ-панель

1. Перейдите на [http://localhost:3000/auth/signin](http://localhost:3000/auth/signin)
2. Войдите под админом:
   - **Email:** `a@gmail.com`
   - **Пароль:** `123`
3. После входа вы будете автоматически перенаправлены в админ-панель: [http://localhost:3000/admin](http://localhost:3000/admin)

**⚠️ Важно:** После первого входа рекомендуется сменить пароль в разделе "Мой профиль" → "Сменить пароль"

### Сборка для продакшена

```bash
# Сборка проекта
npm run build

# Запуск в продакшене
npm start
```

**Для продакшена также нужно:**
1. Настроить переменные окружения на сервере
2. Использовать реальный `NEXTAUTH_SECRET`
3. Настроить `NEXTAUTH_URL` на ваш домен
4. Настроить подключение к базе данных на сервере

## 📁 Структура проекта

```
site/
├── app/                    # Next.js App Router
│   ├── globals.css        # Глобальные стили
│   ├── layout.tsx         # Основной layout с SEO
│   └── page.tsx           # Главная страница
├── components/            # React компоненты
│   ├── Header.tsx         # Шапка сайта
│   ├── Hero.tsx           # Главный баннер
│   ├── ProjectsCatalog.tsx # Каталог товаров
│   ├── Calculator.tsx     # Калькулятор стоимости
│   ├── ProcessSteps.tsx   # Как мы работаем
│   ├── Advantages.tsx     # Преимущества
│   ├── ReviewsGallery.tsx # Отзывы и галерея
│   ├── FAQ.tsx           # Часто задаваемые вопросы
│   ├── ContactsCTA.tsx   # Контакты и форма
│   ├── Footer.tsx        # Подвал сайта
│   └── ProjectCard.tsx   # Карточка товара
├── public/               # Статические файлы
│   ├── images/          # Изображения
│   ├── sitemap.xml      # Карта сайта
│   └── robots.txt       # Robots.txt
└── lib/                 # Утилиты
    └── utils.ts         # Вспомогательные функции
```

## 🎨 Компоненты

### Hero
- Анимированный заголовок
- CTA кнопки с плавными переходами
- Параллакс эффект фона
- Адаптивная типографика

### Калькулятор
- Многошаговая форма расчета стоимости труб
- Валидация данных
- Анимированные переходы
- Интеграция с аналитикой

### Каталог товаров
- Сетка товаров с фильтрацией
- Lazy loading изображений
- Hover эффекты
- Модальные окна

### FAQ
- Аккордеон интерфейс
- Фильтрация по категориям
- Плавные анимации
- SEO оптимизация

## 🔧 Настройка

### Переменные окружения (полный список)

Создайте файл `.env` в корне проекта:

```env
# Обязательные переменные
DATABASE_URL="postgresql://postgres:password@localhost:5432/mydb?schema=public"
NEXTAUTH_SECRET="your-secret-key-minimum-32-characters"
NEXTAUTH_URL="http://localhost:3000"

# Email настройки (для отправки писем, опционально)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="your-email@gmail.com"

# Публичные переменные (опционально)
NEXT_PUBLIC_SITE_URL=https://aquagazteh.ru
```

**Как сгенерировать NEXTAUTH_SECRET:**
```bash
# В терминале (Linux/Mac)
openssl rand -base64 32

# Или онлайн: https://generate-secret.vercel.app/32
```

### Интеграция с CRM

Для подключения к CRM (amoCRM, Bitrix24) обновите webhook URL в компонентах:

```typescript
// В Calculator.tsx и ContactsCTA.tsx
const CRM_WEBHOOK_URL = process.env.CRM_WEBHOOK_URL
```

## 🚀 Деплой

### Vercel (рекомендуется)

1. Подключите репозиторий к Vercel
2. Настройте переменные окружения
3. Деплой автоматически при push в main

### Netlify

1. Подключите репозиторий к Netlify
2. Настройте build команду: `npm run build`
3. Настройте publish directory: `.next`

### VPS

```bash
# Установка PM2
npm install -g pm2

# Сборка проекта
npm run build

# Запуск
pm2 start npm --name "аквагазтех" -- start
```

## 📊 SEO и производительность

- ✅ Метаданные для всех страниц
- ✅ Структурированные данные (JSON-LD)
- ✅ Open Graph и Twitter Cards
- ✅ Sitemap.xml и robots.txt
- ✅ Оптимизация изображений
- ✅ Lazy loading
- ✅ Минификация CSS/JS

## 🔒 Безопасность

- Валидация всех форм
- Защита от XSS атак
- HTTPS в продакшене
- Безопасные заголовки

## 📱 Поддержка браузеров

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для фичи (`git checkout -b feature/amazing-feature`)
3. Зафиксируйте изменения (`git commit -m 'Add amazing feature'`)
4. Отправьте в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект лицензирован под MIT License.

## 📞 Поддержка

Для вопросов и поддержки обращайтесь:
- Email: agtspb@inbox.ru
- Телефон: +7 (931) 302-30-08

---

**АкваГазТех** - Качественные трубы ПНД и комплектующие! 🔧✨