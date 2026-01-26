# 🔐 JWT Аутентификация - Реализация на сервере

Полная реализация JWT аутентификации на Node.js backend.

---

## ✅ Что было реализовано

### 1️⃣ Services (Бизнес-логика)

#### **PasswordService** - Работа с паролями
```typescript
// Хеширование пароля
const hashedPassword = await passwordService.hashPassword("MyPassword123!");

// Проверка пароля
const isValid = await passwordService.verifyPassword("MyPassword123!", hashedPassword);

// Валидация требований
const validation = passwordService.validatePassword("weak");
// { isValid: false, errors: ["Password must be at least 12 characters..."] }
```

#### **TokenService** - Работа с JWT токенами
```typescript
// Создание Access Token (15 минут)
const accessToken = tokenService.createAccessToken(userId, email);

// Создание Refresh Token (7 дней)
const refreshToken = tokenService.createRefreshToken(userId);

// Проверка Access Token
const decoded = tokenService.verifyAccessToken(token);

// Проверка Refresh Token
const decoded = tokenService.verifyRefreshToken(token);
```

#### **AuthService** - Основная логика аутентификации
```typescript
// Регистрация
const result = await authService.register({
  email: 'user@example.com',
  name: 'John Doe',
  password: 'MyPassword123!',
  passwordConfirm: 'MyPassword123!'
});

// Вход
const result = await authService.login({
  email: 'user@example.com',
  password: 'MyPassword123!'
});

// Обновление Access Token
const { accessToken } = await authService.refreshAccessToken(refreshToken);

// Logout (отозвать refresh token)
await authService.logout(userId);
```

---

## 🔑 API Endpoints

### 📝 POST /api/auth/register
**Регистрация нового пользователя**

**Request:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "MyPassword123!",
  "passwordConfirm": "MyPassword123!"
}
```

**Response (201):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clh7x5g8h000...",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Refresh Token:** Сохраняется в HttpOnly Cookie автоматически

**Ошибки:**
```json
{ "error": "Password must be at least 12 characters long" }
{ "error": "Passwords do not match" }
{ "error": "Email already registered" }
```

---

### 🔓 POST /api/auth/login
**Вход в систему**

**Request:**
```json
{
  "email": "user@example.com",
  "password": "MyPassword123!"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clh7x5g8h000...",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Ошибки:**
```json
{ "error": "Invalid email or password" }
```

---

### 🔄 POST /api/auth/refresh
**Обновление Access Token (когда истёк)**

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Ошибки:**
```json
{ "error": "Invalid refresh token" }
{ "error": "Refresh token not found or revoked" }
```

---

### 🔑 POST /api/auth/logout
**Выход из системы**

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{ "message": "Logged out successfully" }
```

**Ошибки:**
```json
{ "error": "No authorization header provided" }
```

---

### 👤 GET /api/auth/me
**Получить информацию о текущем пользователе**

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "id": "clh7x5g8h000...",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2026-01-26T12:00:00.000Z"
}
```

**Ошибки:**
```json
{ "error": "No authorization header provided" }
{ "error": "Invalid or expired token" }
```

---

## 🧪 Тестирование через curl

### 1. Регистрация
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "password": "TestPassword123!",
    "passwordConfirm": "TestPassword123!"
  }'
```

**Ответ:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clh7x5g8h000...",
    "email": "test@example.com",
    "name": "Test User"
  }
}
```

### 2. Вход
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

### 3. Получить информацию о себе
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### 4. Обновить Access Token
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

### 5. Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

---

## 🔒 Структура токенов

### Access Token (15 минут)
```typescript
{
  userId: "clh7x5g8h000...",
  email: "user@example.com",
  iat: 1674735600,      // Создан в
  exp: 1674736500,      // Истекает в
  iss: "utm-connect"    // Издатель
}
```

### Refresh Token (7 дней)
```typescript
{
  userId: "clh7x5g8h000...",
  type: "refresh",
  iat: 1674735600,
  exp: 1675340400,      // 7 дней
  iss: "utm-connect"
}
```

---

## 📂 Файловая структура

```
src/
├── config/
│   └── env.ts              # JWT конфиги
├── middleware/
│   └── authenticate.ts     # Проверка JWT middleware
├── services/
│   ├── AuthService.ts      # Основная логика
│   ├── PasswordService.ts  # Хеширование паролей
│   ├── TokenService.ts     # Создание/проверка JWT
│   └── index.ts
├── routes/
│   └── auth.ts             # Auth endpoints
└── types/
    └── index.ts            # Типы (LoginDTO, RegisterDTO и т.д.)

prisma/
└── schema.prisma           # RefreshToken модель
```

---

## 🔐 Требования к паролю (по умолчанию)

```
- Минимум 12 символов
- Хотя бы одна заглавная буква (A-Z)
- Хотя бы одна цифра (0-9)
- Хотя бы один специальный символ (!@#$%^&*...)
```

**Пример валидного пароля:**
```
MyPassword123!
```

**Пример невалидного пароля:**
```
password123      ❌ Нет заглавной буквы и спецсимвола
MyPassword       ❌ Нет цифры и спецсимвола
```

---

## 🛡️ Безопасность

### HttpOnly Cookie для Refresh Token
```typescript
res.cookie('refreshToken', token, {
  httpOnly: true,           // ← JavaScript не может прочитать
  secure: true,             // ← Только HTTPS
  sameSite: 'strict',       // ← Защита от CSRF
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
  path: '/',
});
```

### Bcrypt для паролей
```typescript
// Пароль хешируется с 10 раундами
const hash = await bcrypt.hash(password, 10);
// $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86AGROqqG...
```

### JWT с подписью
```typescript
// Подписывается с SECRET ключом
const token = jwt.sign(payload, config.jwtSecret, {
  expiresIn: '15m',
  issuer: 'utm-connect',
});
```

---

## 🚀 Готово!

Теперь бэкенд поддерживает:
- ✅ Регистрацию пользователей
- ✅ Вход в систему
- ✅ JWT токены (Access + Refresh)
- ✅ Refresh Token в БД
- ✅ Защиту эндпоинтов через middleware
- ✅ Logout (отозвание токенов)
- ✅ Получение информации о текущем пользователе

**Следующий шаг:** Реализовать на фронтенде (React Vercel)

