# 📚 Общая структура проекта UTM Connect Backend

Полное объяснение архитектуры, слоёв и потока данных в приложении.

## 🔄 Поток данных в приложении

```
HTTP Request
    ↓
[Express Route Handler] ← Принимает запрос, валидирует входные данные
    ↓
[Service Layer] ← Бизнес-логика, проверки, обработка данных
    ↓
[Repository Layer] ← Работа с базой данных
    ↓
[Prisma ORM] ← Преобразование в SQL запросы
    ↓
[PostgreSQL] ← Сохранение/получение данных
    ↓
HTTP Response ← Ответ клиенту
```

---

## 📁 Пошаговое объяснение каждого слоя

### 1️⃣ **Routes** (`src/routes/`) - API эндпоинты

**Назначение:**
- Принимает HTTP запросы от фронтенда
- Валидирует входные данные с помощью Zod
- Преобразует JSON в TypeScript объекты
- Отправляет результат обратно клиенту

**Файл:** `src/routes/users.ts`

```typescript
import express from 'express';
import { UserService } from '@/services';
import { UserRepository } from '@/repositories';
import { z } from 'zod';

const router = express.Router();
const userRepository = new UserRepository();
const userService = new UserService(userRepository);

// Схема валидации (Zod)
const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6),
});

router.post('/', async (req, res) => {
  try {
    const data = CreateUserSchema.parse(req.body);  // ← Валидация
    const user = await userService.createUser(data); // ← Service
    res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
    } else {
      res.status(400).json({ error: (error as Error).message });
    }
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json(user);
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
});

export default router;
```

**Пример HTTP запроса:**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user@example.com",
    "name":"John Doe",
    "password":"123456"
  }'
```

**Что происходит:**
1. Express получает POST запрос на `/api/users`
2. Zod проверяет, что email валидный, name не пустой, password >= 6 символов
3. Если валидация успешна → передаём объект в Service
4. Если нет → отправляем 400 ошибку с деталями

**Важно:** Route НЕ содержит бизнес-логику. Если нужна проверка, что email уникален — это дело Service!

---

### 2️⃣ **Services** (`src/services/`) - Бизнес-логика

**Назначение:**
- **Бизнес-логика**: проверки, валидация правил
- Решает ЧТО делать с данными
- НЕ работает напрямую с БД (использует Repository)
- Всегда возвращает правильный результат или ошибку

**Файл:** `src/services/UserService.ts`

```typescript
import type { IUserRepository, UserEntity, CreateUserDTO } from '@/types';

export class UserService {
  constructor(private userRepository: IUserRepository) {}

  async createUser(data: CreateUserDTO): Promise<UserEntity> {
    // Проверка: email уже существует?
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    
    // TODO: hash password before saving
    // const hashedPassword = await bcrypt.hash(data.password, 10);
    
    // Всё ОК, передаём в Repository
    return this.userRepository.create(data);
  }

  async getUserById(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async getUserByEmail(email: string): Promise<UserEntity> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async updateUser(id: string, data: Partial<UserEntity>): Promise<UserEntity> {
    return this.userRepository.update(id, data);
  }

  async deleteUser(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }
}
```

**Ключевая идея:**
Service не знает, как именно сохраняются данные в БД. Это дело Repository. Service только говорит:
- "Найди пользователя по email"
- "Создай нового пользователя"
- "Обнови пользователя"

Repository отвечает на эти запросы, а Service занимается логикой.

**Пример бизнес-логики:**
```typescript
// ✅ ПРАВИЛЬНО - в Service
if (existingUser) {
  throw new Error('Email already exists');
}

// ❌ НЕПРАВИЛЬНО - в Route
if (existingUser) {
  throw new Error('Email already exists');
}
```

---

### 3️⃣ **Repositories** (`src/repositories/`) - Работа с БД

**Назначение:**
- **ТОЛЬКО операции с базой данных**
- Создание, чтение, обновление, удаление (CRUD)
- Не содержит бизнес-логику
- Может быть заменён на другую реализацию (тесты, другая БД)

**Файл:** `src/repositories/UserRepository.ts`

```typescript
import { prisma } from '@/prisma/client';
import type { IUserRepository, UserEntity, CreateUserDTO } from '@/types';

export class UserRepository implements IUserRepository {
  async create(data: CreateUserDTO): Promise<UserEntity> {
    return prisma.user.create({
      data,
    });
  }

  async findById(id: string): Promise<UserEntity | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, data: Partial<UserEntity>): Promise<UserEntity> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }
}
```

**Интерфейс Repository:**
```typescript
export interface IUserRepository {
  create(data: CreateUserDTO): Promise<UserEntity>;
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  update(id: string, data: Partial<UserEntity>): Promise<UserEntity>;
  delete(id: string): Promise<void>;
}
```

**Зачем интерфейс?**

Если завтра ты захочешь заменить PostgreSQL на MongoDB, тебе не нужно менять Service — просто создаёшь новую реализацию:

```typescript
// Новая реализация для MongoDB
export class MongoUserRepository implements IUserRepository {
  async create(data: CreateUserDTO): Promise<UserEntity> {
    const doc = await userCollection.insertOne(data);
    return { id: doc._id, ...data };
  }
  
  // ... остальные методы
}

// Service работает с обеими реализациями!
const mongoRepo = new MongoUserRepository();
const service = new UserService(mongoRepo);
```

**Repository не знает про бизнес-логику.** Он просто выполняет запросы:
- "Найди юзера по ID"
- "Найди юзера по email"
- "Создай нового юзера"

---

### 4️⃣ **Prisma** (`prisma/schema.prisma`) - ORM

**Назначение:**
- Описание структуры БД (таблицы и колонки)
- Отношения между таблицами
- Автоматическое создание SQL запросов
- Генерация типов для TypeScript

**Файл:** `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  campaigns Campaign[]  // ← Связь: User → Campaign (1 к многим)
  links     Link[]      // ← Связь: User → Link (1 к многим)
}

model Campaign {
  id          String   @id @default(cuid())
  name        String
  description String?
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  links Link[]

  @@index([userId])
}

model Link {
  id          String   @id @default(cuid())
  originalUrl String
  shortCode   String   @unique
  campaignId  String?
  campaign    Campaign? @relation(fields: [campaignId], references: [id], onDelete: SetNull)
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  clicks      Int      @default(0)

  analytics LinkAnalytic[]

  @@index([userId])
  @@index([campaignId])
  @@index([shortCode])
}

model LinkAnalytic {
  id        String   @id @default(cuid())
  linkId    String
  link      Link     @relation(fields: [linkId], references: [id], onDelete: Cascade)
  userAgent String?
  referer   String?
  ipAddress String?
  timestamp DateTime @default(now())

  @@index([linkId])
  @@index([timestamp])
}
```

**Структура связей:**
```
User (1)
  ├─ (много) → Campaign
  │            └─ (много) → Link
  │                         └─ (много) → LinkAnalytic
  └─ (много) → Link
               └─ (много) → LinkAnalytic
```

**Что значат аннотации:**

| Аннотация | Значение |
|-----------|----------|
| `@id` | Первичный ключ |
| `@unique` | Уникальное значение (не может повторяться) |
| `@default(cuid())` | Автогенерируемый ID |
| `@default(now())` | Текущее время |
| `@updatedAt` | Автоматически обновляется при изменении |
| `@relation(...)` | Связь с другой таблицей |
| `onDelete: Cascade` | Если User удалён → удали все его Campaign |
| `onDelete: SetNull` | Если Campaign удалён → Link.campaignId = null |
| `@@index([userId])` | Индекс для быстрого поиска |

**Как Prisma генерирует SQL:**

```typescript
// TypeScript код в Service
await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John',
    password: 'hashedpass'
  }
});
```

↓ **Prisma преобразует в SQL:**

```sql
INSERT INTO "User" (id, email, name, password, createdAt, updatedAt)
VALUES ('clh123abc...', 'user@example.com', 'John', 'hashedpass', NOW(), NOW());
```

**Миграции:**
```bash
# Создать миграцию после изменения schema.prisma
npm run prisma:migrate

# Это создаст файл: prisma/migrations/2026_01_26_add_user_table/migration.sql
# И применит изменения к БД
```

---

### 5️⃣ **Types** (`src/types/index.ts`) - TypeScript интерфейсы

**Назначение:**
- Определяет типы данных для всего приложения
- Ensure type safety (безопасность типов)
- DTO (Data Transfer Objects) для валидации входа
- Entity для представления в коде

**Файл:** `src/types/index.ts`

```typescript
// ============ Repository интерфейсы ============

export interface IUserRepository {
  create(data: CreateUserDTO): Promise<UserEntity>;
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  update(id: string, data: Partial<UserEntity>): Promise<UserEntity>;
  delete(id: string): Promise<void>;
}

export interface ICampaignRepository {
  create(data: CreateCampaignDTO): Promise<CampaignEntity>;
  findById(id: string): Promise<CampaignEntity | null>;
  findByUserId(userId: string): Promise<CampaignEntity[]>;
  update(id: string, data: Partial<CampaignEntity>): Promise<CampaignEntity>;
  delete(id: string): Promise<void>;
}

export interface ILinkRepository {
  create(data: CreateLinkDTO): Promise<LinkEntity>;
  findById(id: string): Promise<LinkEntity | null>;
  findByShortCode(shortCode: string): Promise<LinkEntity | null>;
  findByUserId(userId: string): Promise<LinkEntity[]>;
  incrementClicks(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}

// ============ Entities (модели данных в БД) ============

export interface UserEntity {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignEntity {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LinkEntity {
  id: string;
  originalUrl: string;
  shortCode: string;
  campaignId: string | null;
  userId: string;
  createdAt: Date;
  clicks: number;
}

// ============ DTOs (для создания объектов) ============

export interface CreateUserDTO {
  email: string;
  name: string;
  password: string;
}

export interface CreateCampaignDTO {
  name: string;
  description?: string;
  userId: string;
}

export interface CreateLinkDTO {
  originalUrl: string;
  shortCode: string;
  campaignId?: string;
  userId: string;
}
```

**Entity vs DTO:**

| Entity | DTO |
|--------|-----|
| Полное представление в БД | Только нужные поля для создания |
| Содержит `id`, `createdAt`, `updatedAt` | БЕЗ `id`, `createdAt`, `updatedAt` |
| Уникален (один на таблицу) | Может быть несколько (Create, Update, Delete) |
| `UserEntity` | `CreateUserDTO`, `UpdateUserDTO` |

```typescript
// ❌ НЕПРАВИЛЬНО
async createUser(data: UserEntity): Promise<UserEntity> {
  // UserEntity требует id, createdAt, updatedAt
  // но при создании их ещё нет!
}

// ✅ ПРАВИЛЬНО
async createUser(data: CreateUserDTO): Promise<UserEntity> {
  // CreateUserDTO только: email, name, password
  // Service/Repository добавят id, createdAt
  return prisma.user.create({ data });
}
```

---

### 6️⃣ **Config** (`src/config/env.ts`) - Конфигурация

**Назначение:**
- Централизованное управление переменными окружения
- Различные настройки для dev/prod
- Безопасное хранение секретов

**Файл:** `src/config/env.ts`

```typescript
export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/utm_connect',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-here',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
};

export const isDevelopment = config.nodeEnv === 'development';
export const isProduction = config.nodeEnv === 'production';
```

**`.env` файл:**
```
DATABASE_URL="postgresql://user:password@localhost:5432/utm_connect"
JWT_SECRET="super-secret-key-change-in-production"
PORT=3000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"
```

**Как использовать:**
```typescript
import { config, isDevelopment } from '@/config/env';

// В индексе приложения
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  if (isDevelopment) {
    console.log('Running in development mode');
  }
});
```

---

## 📊 Полный пример: Как создаётся пользователь

### 1. React Vercel отправляет запрос:
```javascript
// frontend/pages/signup.tsx (React Vercel)
const handleSignup = async (email, name, password) => {
  const response = await fetch('http://localhost:3000/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, password })
  });
  
  const user = await response.json();
  console.log('User created:', user);
};
```

### 2. Route обрабатывает запрос (валидация):
```typescript
// backend/src/routes/users.ts
router.post('/', async (req, res) => {
  try {
    // Zod валидирует входные данные
    const data = CreateUserSchema.parse(req.body);
    // { email: "user@example.com", name: "John Doe", password: "password123" }
    
    // Передаём в Service
    const user = await userService.createUser(data);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

### 3. Service проверяет бизнес-логику:
```typescript
// backend/src/services/UserService.ts
async createUser(data: CreateUserDTO): Promise<UserEntity> {
  // Проверка: email уже существует?
  const existing = await this.userRepository.findByEmail(data.email);
  if (existing) {
    throw new Error('User with this email already exists'); // ← Бизнес-правило!
  }
  
  // Проверка: пароль достаточно сильный?
  if (data.password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
  
  // TODO: Hash password
  // const hashedPassword = await bcrypt.hash(data.password, 10);
  // data.password = hashedPassword;
  
  // Всё ОК, передаём в Repository
  return this.userRepository.create(data);
}
```

### 4. Repository сохраняет в БД:
```typescript
// backend/src/repositories/UserRepository.ts
async create(data: CreateUserDTO): Promise<UserEntity> {
  // Prisma сохраняет в БД
  return prisma.user.create({
    data: data
  });
}
```

### 5. Prisma генерирует SQL запрос:
```sql
INSERT INTO "User" (id, email, name, password, createdAt, updatedAt)
VALUES (
  'clh7x5g8h0000qd0g0g0g0g0g', 
  'user@example.com', 
  'John Doe', 
  'password123', 
  '2026-01-26T10:00:00Z',
  '2026-01-26T10:00:00Z'
);
```

### 6. PostgreSQL сохраняет и возвращает результат:
```json
{
  "id": "clh7x5g8h0000qd0g0g0g0g0g",
  "email": "user@example.com",
  "name": "John Doe",
  "password": "password123",
  "createdAt": "2026-01-26T10:00:00Z",
  "updatedAt": "2026-01-26T10:00:00Z"
}
```

### 7. Ответ возвращается клиенту:
```typescript
// HTTP 201 Created
{
  "id": "clh7x5g8h0000qd0g0g0g0g0g",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2026-01-26T10:00:00Z",
  "updatedAt": "2026-01-26T10:00:00Z"
}
```

### 8. React обновляет UI:
```javascript
setUser(user); // Сохраняем в state
navigate('/dashboard'); // Переходим на dashboard
```

---

## 🎯 Зачем нужна такая архитектура?

### ❌ Без архитектуры (НЕПРАВИЛЬНО):

```typescript
app.post('/users', async (req, res) => {
  // ВСЁ в одном маршруте!
  
  // Валидация
  if (!req.body.email) {
    return res.status(400).json({ error: 'Email required' });
  }
  
  // Бизнес-логика
  const existing = await prisma.user.findUnique({
    where: { email: req.body.email }
  });
  if (existing) {
    return res.status(400).json({ error: 'Email exists' });
  }
  
  // Работа с БД
  const user = await prisma.user.create({
    data: req.body
  });
  
  res.status(201).json(user);
});
```

**Проблемы:**
- ❌ Смешана валидация, логика, работа с БД
- ❌ Нельзя переиспользовать логику в других маршрутах
- ❌ Сложно тестировать (нужна реальная БД)
- ❌ Сложно менять БД (нужно менять весь маршрут)
- ❌ При добавлении нового маршрута копируешь код → дублирование

### ✅ С SOLID архитектурой (ПРАВИЛЬНО):

```
HTTP Request
    ↓
Route (валидация только) ← Зod schema
    ↓
Service (бизнес-логика) ← Проверки правил
    ↓
Repository (работа с БД) ← CRUD операции
    ↓
Prisma (SQL генерация) ← ORM
    ↓
PostgreSQL (хранилище) ← БД
```

**Преимущества:**
- ✅ Каждый слой отвечает за одно
- ✅ Легко тестировать (подменяем Repository)
- ✅ Легко расширять (добавляем новый функционал)
- ✅ Легко менять БД (создаём новый Repository)
- ✅ Понятный, читаемый код
- ✅ Переиспользование кода

---

## 🧪 Пример: Тестирование с SOLID архитектурой

**Service можно тестировать БЕЗ доступа к реальной БД!**

```typescript
// test/services/UserService.test.ts
import { UserService } from '@/services';
import type { IUserRepository, UserEntity, CreateUserDTO } from '@/types';

// Mock Repository (подделка для тестов)
class MockUserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<UserEntity | null> {
    if (email === 'existing@example.com') {
      return { 
        id: '1', 
        email, 
        name: 'John',
        password: 'hash',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    return null;
  }
  
  async create(data: CreateUserDTO): Promise<UserEntity> {
    return {
      id: '2',
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  
  async findById(id: string) { return null; }
  async update(id: string, data: any) { return {} as UserEntity; }
  async delete(id: string) { }
}

// Тест
describe('UserService.createUser', () => {
  it('should throw error if email already exists', async () => {
    const mockRepo = new MockUserRepository();
    const service = new UserService(mockRepo);
    
    // Тест без БД! ✨
    await expect(
      service.createUser({
        email: 'existing@example.com',
        name: 'Jane',
        password: '123456'
      })
    ).rejects.toThrow('User with this email already exists');
  });
  
  it('should create user if email is unique', async () => {
    const mockRepo = new MockUserRepository();
    const service = new UserService(mockRepo);
    
    const result = await service.createUser({
      email: 'new@example.com',
      name: 'Jane',
      password: '123456'
    });
    
    expect(result.email).toBe('new@example.com');
    expect(result.id).toBe('2');
  });
});
```

**Зачем это нужно:**
- ✅ Тесты работают быстро (нет обращения к БД)
- ✅ Тесты не зависят от состояния БД
- ✅ Тесты легко изолировать (Mock repository)
- ✅ Легко тестировать граничные случаи (ошибки)

---

## 📝 Итоговая таблица слоёв

| Слой | Файлы | Что делает | Пример | Ошибка БЕЗ SOLID |
|------|-------|-----------|--------|------------------|
| **Routes** | `src/routes/*.ts` | HTTP эндпоинты, валидация входа | `POST /api/users` | Бизнес-логика в маршруте |
| **Services** | `src/services/*.ts` | Бизнес-логика, правила, проверки | "Email должен быть уникален" | Дублирование логики |
| **Repositories** | `src/repositories/*.ts` | CRUD операции с БД | `create()`, `findById()`, `delete()` | Работа с БД в Service |
| **Prisma** | `prisma/schema.prisma` | Схема БД, миграции, SQL генерация | Структура таблиц User, Campaign | Ручное написание SQL |
| **Types** | `src/types/index.ts` | TypeScript интерфейсы и Entity | `UserEntity`, `IUserRepository` | Отсутствие типов |
| **Config** | `src/config/env.ts` | Настройки окружения | DATABASE_URL, PORT, JWT_SECRET | Hardcode значений |

---

## 🚀 Следующие шаги

1. **Запусти сервер:**
   ```bash
   npm run dev
   ```

2. **Добавь API документацию** (Swagger):
   - Установи `@nestjs/swagger` или `swagger-jsdoc`

3. **Добавь аутентификацию:**
   - JWT токены
   - Refresh tokens
   - Password hashing (bcrypt)

4. **Добавь тесты:**
   - Unit тесты для Services
   - Integration тесты для Routes
   - E2E тесты

5. **Добавь логирование:**
   - Winston или Pino для структурированных логов
   - Различные уровни (debug, info, warn, error)

---

## 📚 Дополнительные ресурсы

- [SOLID принципы](https://en.wikipedia.org/wiki/SOLID)
- [Prisma документация](https://www.prisma.io/docs/)
- [Express.js гайд](https://expressjs.com/)
- [TypeScript handbook](https://www.typescriptlang.org/docs/)
- [Zod валидация](https://zod.dev/)

