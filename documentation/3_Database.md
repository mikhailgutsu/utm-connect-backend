# 🗄️ База данных - Полное руководство

Полное руководство по работе с PostgreSQL базой данных UTM Connect.

---

## 📍 Быстрый доступ к БД

| Способ | URL / Команда | Для чего |
|--------|---------------|----------|
| **PgAdmin (GUI)** | http://localhost:5050 | Просмотр данных в браузере |
| **PostgreSQL CLI** | `make db-shell` | SQL запросы в терминале |
| **API** | http://localhost:3000 | Тестирование эндпоинтов |

---

## 🐘 PgAdmin - Веб интерфейс

### ✅ Подключение PostgreSQL к PgAdmin

**Логин:**
```
Email: admin@example.com
Password: admin
URL: http://localhost:5050
```

### 📍 Регистрация сервера (первый раз)

**Шаг 1:** Кликни правой кнопкой на **"Servers"** в левой панели

**Шаг 2:** Выбери **"Register"** → **"Server..."**

**Шаг 3:** Вкладка **"General"** - заполни:
```
Name: utm_connect
```

**Шаг 4:** Вкладка **"Connection"** - заполни:
```
Host name/address: postgres
Port: 5432
Username: postgres
Password: postgres
Database: utm_connect
```

**⚠️ ВАЖНО:** Host должен быть `postgres` (имя контейнера Docker), не `localhost`!

**Шаг 5:** Кликни **"Save"**

### 🎯 Структура папок в PgAdmin

После подключения видишь:

```
Servers (1)
└── utm_connect
    ├── Databases (2)
    │   ├── postgres
    │   └── utm_connect
    │       └── Schemas (1)
    │           └── public
    │               └── Tables (5)
    │                   ├── Campaign
    │                   ├── Link
    │                   ├── LinkAnalytic
    │                   ├── User
    │                   └── _prisma_migrations
    │
    ├── Login/Group Roles (15)
    └── Tablespaces (2)
```

### 📊 Как просмотреть данные таблицы

**Вариант 1: Через меню**
1. Перейди в: `utm_connect` → `Schemas` → `public` → `Tables`
2. Кликни на нужную таблицу (например **User**)
3. Right click → **"View/Edit Data"** → **"All Rows"**
4. Видишь все данные в таблице! 📊

**Вариант 2: Быстро**
1. Кликни на таблицу один раз
2. В меню вверху → **Object** → **View Data** → **All Rows**

### 🔍 Что видишь в каждой таблице

#### **User** (2 записи)
```
id                  | email              | name       | password
clh7x5g8h000...   | john@example.com   | John Doe   | hashed_password_123
clh7x5g8h001...   | jane@example.com   | Jane Smith | hashed_password_456
```

#### **Campaign** (3 записи)
```
id                  | name               | description                    | userId
clh7x5g8h002...   | Summer Sale 2026   | Marketing for summer products | clh7x5g8h000...
clh7x5g8h003...   | Product Launch     | New feature announcement      | clh7x5g8h000...
clh7x5g8h004...   | Black Friday 2026  | Black Friday special offers    | clh7x5g8h001...
```

#### **Link** (4 записи)
```
id                  | originalUrl                                      | shortCode | clicks
clh7x5g8h005...   | https://example.com/products/summer-...         | sum2026   | 0
clh7x5g8h006...   | https://example.com/new-feature?utm_...         | newft     | 0
clh7x5g8h007...   | https://example.com/black-friday?utm_...        | bf2026    | 0
clh7x5g8h008...   | https://example.com/promo?utm_source=facebook   | promo99   | 0
```

#### **LinkAnalytic** (3 записи)
```
id                  | linkId            | userAgent              | referer           | ipAddress
clh7x5g8h009...   | clh7x5g8h005...  | Mozilla/5.0 (Mac...)   | example.com      | 192.168.1.1
clh7x5g8h010...   | clh7x5g8h005...  | Mozilla/5.0 (iPhone)   | twitter.com      | 192.168.1.2
clh7x5g8h011...   | clh7x5g8h006...  | Mozilla/5.0 (Windows)  | facebook.com     | 192.168.1.3
```

#### **_prisma_migrations** (1 запись)
```
id                  | checksum           | finished_at         | migration_name
20260126100000...  | abc123def456...    | 2026-01-26 10:00:00 | init
```

---

## 💻 PostgreSQL CLI - Терминал

### 🚀 Открыть консоль PostgreSQL

```bash
# Вариант 1: Через Makefile (рекомендуется)
make db-shell

# Вариант 2: Напрямую через Docker
docker-compose exec postgres psql -U postgres -d utm_connect
```

**Результат:**
```
psql (16.1)
Type "help" for help.

utm_connect=#
```

### 🔍 Полезные PostgreSQL команды

```sql
-- ============ ИНФОРМАЦИОННЫЕ КОМАНДЫ ============

-- Список всех таблиц
\dt

-- Структура таблицы User
\d "User"

-- Список всех команд
\?

-- Выход из консоли
\q


-- ============ SELECT ЗАПРОСЫ ============

-- Все пользователи
SELECT * FROM "User";

-- Только ID и email
SELECT id, email FROM "User";

-- Все кампании
SELECT * FROM "Campaign";

-- Все ссылки
SELECT * FROM "Link";

-- Вся аналитика
SELECT * FROM "LinkAnalytic";


-- ============ ФИЛЬТРАЦИЯ ============

-- Найти пользователя по email
SELECT * FROM "User" WHERE email = 'john@example.com';

-- Все кампании пользователя
SELECT * FROM "Campaign" WHERE "userId" = 'YOUR_USER_ID';

-- Все ссылки без кампании
SELECT * FROM "Link" WHERE "campaignId" IS NULL;

-- Ссылки с больше чем 0 кликов
SELECT * FROM "Link" WHERE clicks > 0;


-- ============ ОБЪЕДИНЕНИЕ ТАБЛИЦ ============

-- Ссылки с их кампаниями
SELECT 
  l."shortCode",
  l.clicks,
  c.name as campaign_name
FROM "Link" l
LEFT JOIN "Campaign" c ON l."campaignId" = c.id;

-- Все ссылки пользователя с кампаниями
SELECT 
  u.email,
  l."shortCode",
  c.name,
  l.clicks
FROM "User" u
LEFT JOIN "Link" l ON u.id = l."userId"
LEFT JOIN "Campaign" c ON l."campaignId" = c.id
WHERE u.email = 'john@example.com';


-- ============ АГРЕГИРОВАНИЕ ============

-- Количество ссылок
SELECT COUNT(*) FROM "Link";

-- Количество кликов на все ссылки
SELECT SUM(clicks) FROM "Link";

-- Ссылки и количество кликов
SELECT "shortCode", clicks FROM "Link" ORDER BY clicks DESC;

-- Аналитика по ссылке
SELECT 
  l."shortCode",
  COUNT(la.id) as total_clicks,
  COUNT(DISTINCT la."ipAddress") as unique_visitors
FROM "Link" l
LEFT JOIN "LinkAnalytic" la ON l.id = la."linkId"
GROUP BY l.id, l."shortCode";


-- ============ ОБНОВЛЕНИЕ ДАННЫХ ============

-- Обновить имя кампании
UPDATE "Campaign" SET name = 'New Name' WHERE id = 'YOUR_CAMPAIGN_ID';

-- Увеличить количество кликов
UPDATE "Link" SET clicks = clicks + 1 WHERE "shortCode" = 'sum2026';


-- ============ УДАЛЕНИЕ ДАННЫХ ============

-- Удалить кампанию (осторожно!)
DELETE FROM "Campaign" WHERE id = 'YOUR_CAMPAIGN_ID';

-- Удалить все ссылки (очень осторожно!)
DELETE FROM "Link";
```

### 📝 Примеры реальных запросов

**Пример 1: Найти все ссылки кампании "Summer Sale 2026"**
```sql
SELECT l.* 
FROM "Link" l
JOIN "Campaign" c ON l."campaignId" = c.id
WHERE c.name = 'Summer Sale 2026';
```

**Пример 2: Сколько уникальных посетителей кликнули на каждую ссылку?**
```sql
SELECT 
  l."shortCode",
  COUNT(DISTINCT la."ipAddress") as unique_visitors
FROM "Link" l
LEFT JOIN "LinkAnalytic" la ON l.id = la."linkId"
GROUP BY l.id, l."shortCode"
ORDER BY unique_visitors DESC;
```

**Пример 3: Статистика по браузерам (из userAgent)**
```sql
SELECT 
  SUBSTRING(la."userAgent" FROM 1 FOR 50) as browser,
  COUNT(*) as clicks
FROM "LinkAnalytic" la
GROUP BY browser
ORDER BY clicks DESC;
```

---

## 🛠️ Makefile команды для БД

```bash
# Создать и применить миграции
make db-migrate

# Просто применить существующие миграции
make db-push

# Сгенерировать Prisma Client
make db-generate

# Заполнить БД тестовыми данными
make db-seed

# Открыть PostgreSQL консоль
make db-shell

# Создать backup БД
make db-backup

# Сбросить БД (WARNING: удалит все данные!)
make db-reset
```

---

## 📊 Структура таблиц (схема)

### **User** (Пользователи)
```
id          STRING  PRIMARY KEY (CUID)
email       STRING  UNIQUE NOT NULL
name        STRING  NOT NULL
password    STRING  NOT NULL
createdAt   DATETIME DEFAULT NOW()
updatedAt   DATETIME UPDATED AT
```

**Связи:**
- 1 User → многие Campaign
- 1 User → многие Link

---

### **Campaign** (Кампании)
```
id          STRING  PRIMARY KEY (CUID)
name        STRING  NOT NULL
description STRING  NULLABLE
userId      STRING  FOREIGN KEY (User.id)
createdAt   DATETIME DEFAULT NOW()
updatedAt   DATETIME UPDATED AT
```

**Связи:**
- 1 Campaign ← многие Link
- 1 Campaign → 1 User

**Индексы:**
- userId (быстрый поиск кампаний пользователя)

---

### **Link** (Ссылки)
```
id          STRING  PRIMARY KEY (CUID)
originalUrl STRING  NOT NULL
shortCode   STRING  UNIQUE NOT NULL
campaignId  STRING  FOREIGN KEY (Campaign.id) NULLABLE
userId      STRING  FOREIGN KEY (User.id)
createdAt   DATETIME DEFAULT NOW()
clicks      INT     DEFAULT 0
```

**Связи:**
- 1 Link → многие LinkAnalytic
- 1 Link ← 1 Campaign (NULLABLE)
- 1 Link ← 1 User

**Индексы:**
- userId (быстрый поиск ссылок пользователя)
- campaignId (быстрый поиск ссылок кампании)
- shortCode (быстрый поиск по коду)

---

### **LinkAnalytic** (Аналитика кликов)
```
id        STRING  PRIMARY KEY (CUID)
linkId    STRING  FOREIGN KEY (Link.id)
userAgent STRING  NULLABLE
referer   STRING  NULLABLE
ipAddress STRING  NULLABLE
timestamp DATETIME DEFAULT NOW()
```

**Связи:**
- многие LinkAnalytic ← 1 Link

**Индексы:**
- linkId (быстрый поиск аналитики по ссылке)
- timestamp (быстрый поиск по времени)

---

## 💾 Backup и восстановление

### Создать backup

```bash
# Через Makefile
make db-backup

# Результат: backups/backup_20260126_123456.sql
```

### Восстановить из backup

```bash
# Вариант 1: Через Docker
docker-compose exec -T postgres psql -U postgres utm_connect < backups/backup_20260126_123456.sql

# Вариант 2: Через psql консоль
psql -U postgres -d utm_connect < backups/backup_20260126_123456.sql
```

### Экспортировать БД как SQL

```bash
# Вывести всю БД в stdout
docker-compose exec -T postgres pg_dump -U postgres utm_connect

# Сохранить в файл
docker-compose exec -T postgres pg_dump -U postgres utm_connect > my_database.sql
```

---

## 🔄 Миграции Prisma

### Что такое миграция?

Миграция — это файл с SQL командами, которые меняют структуру БД.

### История миграций

```bash
# Посмотреть историю
ls -la prisma/migrations/

# Результат:
# 20260126100000_init/migration.sql
```

### Создать новую миграцию

```bash
# Если изменил prisma/schema.prisma
make db-migrate

# Введи название: add_user_age

# Создаст: prisma/migrations/20260126100001_add_user_age/migration.sql
```

### Просмотреть SQL миграции

```bash
cat prisma/migrations/20260126100000_init/migration.sql
```

---

## ⚠️ Опасные операции

### Сбросить БД (удалит ВСЕ данные)

```bash
# Через Makefile
make db-reset

# ⚠️ Это удалит всё и создаст заново с тестовыми данными
```

### Удалить контейнер с БД

```bash
# Это удалит PostgreSQL контейнер (ВСЕ данные потеряны!)
docker-compose down -v

# Потом создай заново
docker-compose up -d
```

---

## 🐛 Troubleshooting

### Не могу подключиться к PostgreSQL

```bash
# Проверь что контейнер запущен
docker-compose ps

# Если контейнер не запущен
make docker-up

# Проверь логи
make docker-logs-db
```

### Ошибка "Host not found"

**Проблема:** В PgAdmin использовал `localhost` вместо `postgres`

**Решение:**
1. Удали подключение (right click на сервер → Delete)
2. Создай заново с Host: `postgres` (не localhost!)

### БД не синхронизирована со schema.prisma

```bash
# Примени все миграции
make db-migrate

# ИЛИ просто пуши изменения
make db-push
```

### Потерял данные

```bash
# Если есть backup
docker-compose exec -T postgres psql -U postgres utm_connect < backup.sql

# Если нет - пересоздай с seed
make db-reset
```

---

## 📚 Дополнительные ресурсы

- [PostgreSQL документация](https://www.postgresql.org/docs/)
- [Prisma миграции](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [PgAdmin документация](https://www.pgadmin.org/docs/)
- [SQL tutorial](https://www.w3schools.com/sql/)

---

## 🎯 Типичный workflow

### День 1: Первая настройка
```bash
make setup        # Всё готово!
```

### Разработка: Изменение схемы БД
```bash
# 1. Отредактируй prisma/schema.prisma
# 2. Примени изменения
make db-migrate   # Введи название миграции

# 3. Проверь данные
make db-shell
SELECT * FROM "NewTable";
```

### Разработка: Просмотр данных
```bash
# Вариант 1: GUI (рекомендуется)
# Открой http://localhost:5050

# Вариант 2: Терминал
make db-shell
SELECT * FROM "User";
```

### Перед деплоем: Backup
```bash
make db-backup
# Сохранил: backups/backup_20260126_123456.sql
```

