# 🔐 JWT Аутентификация - Полный гайд по безопасности

Полный гайд по реализации безопасной аутентификации с JWT токенами.

---

## 🎯 Что такое JWT?

**JWT (JSON Web Token)** — это зашифрованный токен, который содержит информацию о пользователе.

```
Пример JWT:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

Состоит из 3 частей (разделены точками):
1. Header (заголовок) - алгоритм шифрования
2. Payload (данные) - информация о пользователе
3. Signature (подпись) - проверка подлинности
```

---

## 🔒 Архитектура безопасной аутентификации

### Правильный подход (SECURE)

```
┌─────────────────────────────────────────────────────────┐
│ FRONTEND (React Vercel)                                 │
│                                                         │
│ 1. Пользователь вводит email/password                  │
│ 2. Отправляет на backend                               │
│ 3. Получает accessToken + refreshToken                │
│ 4. Сохраняет в памяти (accessToken)                   │
│ 5. Сохраняет в HttpOnly cookie (refreshToken)         │
└─────────────────────────────────────────────────────────┘
                    ↓ POST /api/auth/login
                    ↓ (email + password)
┌─────────────────────────────────────────────────────────┐
│ BACKEND (Node.js Express)                               │
│                                                         │
│ 1. Получит email + password                            │
│ 2. Найдёт пользователя в БД                            │
│ 3. Сравнит пароль (bcrypt)                            │
│ 4. Создаст ACCESS TOKEN (15 мин)                      │
│ 5. Создаст REFRESH TOKEN (7 дней)                     │
│ 6. Сохранит refresh token в БД (хешированный!)        │
│ 7. Вернёт оба токена фронту                           │
└─────────────────────────────────────────────────────────┘
                    ↓ Response:
                    ↓ { accessToken, refreshToken }
┌─────────────────────────────────────────────────────────┐
│ FRONTEND                                                │
│                                                         │
│ 1. Сохранит accessToken в переменной (state/memory)   │
│ 2. Сохранит refreshToken в HttpOnly cookie            │
│ 3. Каждый запрос отправляет accessToken в заголовок   │
│ 4. Если accessToken истёк → обновит через refreshToken │
└─────────────────────────────────────────────────────────┘
```

---

## 🛡️ Security Best Practices

### 1️⃣ Пароли: Bcrypt хеширование

```typescript
// НЕПРАВИЛЬНО ❌
const password = "123456";  // Сохранил в открытом виде!
await db.user.create({ password });

// ПРАВИЛЬНО ✅
import bcrypt from 'bcrypt';

const hashedPassword = await bcrypt.hash("123456", 10);
// 10 = количество раундов (выше = безопаснее, но медленнее)
// Результат: $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86AGR...

await db.user.create({ password: hashedPassword });

// При проверке:
const isPasswordValid = await bcrypt.compare("123456", hashedPassword);
// true или false
```

**Почему bcrypt?**
- ✅ Сложно подобрать пароль (брутфорс)
- ✅ Добавляет соль (salt) к паролю
- ✅ Замедляет вычисления намеренно
- ✅ Стандарт для production

---

### 2️⃣ Access Token: Краткосрочный (15 минут)

```typescript
const accessToken = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '15m' }  // ← Короткая жизнь!
);
```

**Почему 15 минут?**
- ✅ Если украдут токен → потерн доступ в 15 минут
- ✅ Минимум урона от кражи
- ✅ Можно автоматически обновлять через refreshToken

---

### 3️⃣ Refresh Token: Долгосрочный (7 дней), в БД

```typescript
// 1. Создаём refresh token
const refreshToken = jwt.sign(
  { userId: user.id },
  process.env.JWT_REFRESH_SECRET,
  { expiresIn: '7d' }  // ← Долгая жизнь
);

// 2. ХЕШИРУЕМ refresh token перед сохранением!
const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

// 3. Сохраняем в БД (НЕ открытый токен!)
await db.refreshToken.create({
  token: hashedRefreshToken,  // ← Хешированный!
  userId: user.id,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  isRevoked: false
});

// 4. Отправляем refresh token клиенту
return {
  accessToken,
  refreshToken  // ← Отправляем открытый токен один раз
};
```

**Почему refresh token в БД?**
- ✅ Можем отозвать токен (logout)
- ✅ Можем проверить что токен не украден
- ✅ Хеширование защищает от утечек БД

---

### 4️⃣ Передача токенов: Authorization Header

```typescript
// НЕПРАВИЛЬНО ❌
// Отправляет токен в Body или URL
fetch('/api/protected', {
  body: { token: 'eyJ...' }
});

// ПРАВИЛЬНО ✅
// Отправляет в Authorization заголовок
fetch('/api/protected', {
  headers: {
    'Authorization': 'Bearer eyJ...'
  }
});
```

**Почему Authorization Header?**
- ✅ Браузер не сохраняет в логах
- ✅ HTTPS шифрует трафик
- ✅ Стандарт для REST API

---

### 5️⃣ Хранение токенов на фронте

```typescript
// НЕПРАВИЛЬНО ❌
// localStorage уязвима для XSS атак
localStorage.setItem('token', token);  // Любой script может украсть!

// ПРАВИЛЬНО ✅ - двойной подход
// 1. Access Token → RAM (переменная/state)
const [accessToken, setAccessToken] = useState(null);

// 2. Refresh Token → HttpOnly Cookie (недоступен для JavaScript)
// Backend устанавливает:
// Set-Cookie: refreshToken=eyJ...; HttpOnly; Secure; SameSite=Strict
```

**Почему RAM + HttpOnly Cookie?**
- ✅ AccessToken в RAM — не сохраняется, быстро теряется при перезагрузке
- ✅ RefreshToken в HttpOnly — браузер сам отправляет, JavaScript не может украсть
- ✅ HttpOnly защищает от XSS (JavaScript не может прочитать)
- ✅ Secure флаг — отправляется только через HTTPS
- ✅ SameSite — защита от CSRF

---

### 6️⃣ Проверка токена на backend

```typescript
// Middleware для проверки JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];  // "Bearer TOKEN"
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    
    req.user = user;  // Сохраняем информацию о пользователе
    next();  // Идём дальше
  });
}

// Использование:
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: `Hello ${req.user.email}` });
});
```

---

### 7️⃣ Обновление Access Token через Refresh Token

```typescript
// На фронте: когда accessToken истёк
// 1. Браузер автоматически отправит refreshToken в cookie
// 2. Отправляем запрос на /api/auth/refresh

POST /api/auth/refresh
// Браузер автоматически добавит cookie

// На backend:
app.post('/api/auth/refresh', (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  
  // 1. Проверяем подпись токена
  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }
    
    // 2. Проверяем что токен в БД и не отозван
    const storedToken = await db.refreshToken.findUnique({
      where: { userId: user.userId }
    });
    
    if (!storedToken || storedToken.isRevoked || new Date() > storedToken.expiresAt) {
      return res.status(403).json({ error: 'Refresh token expired or revoked' });
    }
    
    // 3. Создаём новый access token
    const newAccessToken = jwt.sign(
      { userId: user.userId },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    res.json({ accessToken: newAccessToken });
  });
});
```

---

### 8️⃣ Logout: Отозвать токен

```typescript
// На backend:
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  // Отозвал refresh token в БД
  await db.refreshToken.update({
    where: { userId: req.user.userId },
    data: { isRevoked: true }
  });
  
  res.json({ message: 'Logged out' });
});

// На фронте:
// 1. Удалить accessToken из памяти
setAccessToken(null);

// 2. Браузер автоматически удалит cookie при перезагрузке
```

---

## 🛠️ Полная таблица: Правильно vs Неправильно

| Что | ❌ НЕПРАВИЛЬНО | ✅ ПРАВИЛЬНО |
|-----|-------------|------------|
| **Пароль** | Сохранить открытый текст | Bcrypt хеш ($2b$10$...) |
| **Access Token** | Долгосрочный (30 дней) | Краткосрочный (15 мин) |
| **Refresh Token** | В памяти | В HttpOnly Cookie + В БД |
| **Access Token хранилище** | localStorage | RAM/State |
| **Передача** | В Body или URL | Authorization Header |
| **Проверка** | Нет проверки | JWT verify + DB проверка |
| **Logout** | Просто удалить токен | Отозвать в БД |
| **HTTPS** | Необязательно | ОБЯЗАТЕЛЬНО! |
| **Refresh Token в БД** | Открытый токен | Хешированный токен |

---

## 🔐 Защита от основных атак

### 1. XSS (Cross-Site Scripting)
**Атака:** Вредоносный JavaScript крадёт токен из localStorage

**Защита:**
```typescript
// ❌ Уязвимо
localStorage.setItem('token', token);  // JavaScript может украсть!

// ✅ Защищено
// HttpOnly Cookie — JavaScript НЕ может прочитать
Set-Cookie: token=eyJ...; HttpOnly; Secure; SameSite=Strict;
```

### 2. CSRF (Cross-Site Request Forgery)
**Атака:** Вредоносный сайт отправляет запрос от твоего имени

**Защита:**
```typescript
// ✅ SameSite cookie
Set-Cookie: token=eyJ...; SameSite=Strict;
// Браузер отправит cookie только на твой домен!
```

### 3. Token Theft (Кража токена)
**Атака:** Злоумышленник перехватывает токен по сети

**Защита:**
```typescript
// ✅ HTTPS (шифрование трафика)
// ✅ Краткосрочный access token (15 мин)
// ✅ Refresh token в БД (можем отозвать)
```

### 4. Brute Force (подбор пароля)
**Атака:** Перебирает пароли (123456, password, admin и т.д.)

**Защита:**
```typescript
// ✅ Bcrypt — замедляет вычисления (10-12 раундов)
// ✅ Rate limiting — максимум 5 попыток в минуту
// ✅ Требование сильного пароля (12+ символов)
```

### 5. Token Replay (повтор старого токена)
**Атака:** Использует перехваченный старый токен

**Защита:**
```typescript
// ✅ Проверяем expiresAt (токен истёк)
// ✅ Проверяем в БД (refresh token отозван)
// ✅ IP адрес (если сильно отличается)
```

---

## 🔑 Обязательные секреты (Environment Variables)

```bash
# .env
JWT_SECRET="super-secret-key-min-32-characters-long"
JWT_REFRESH_SECRET="different-secret-key-min-32-characters-long"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# Пароль требования
PASSWORD_MIN_LENGTH=12
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_NUMBER=true
PASSWORD_REQUIRE_SPECIAL=true
```

**Как генерировать секреты:**
```bash
# macOS/Linux
openssl rand -base64 32

# Результат
GZ3q8kL9xM2pN5jL7vX1qW4eR8tY2uI5pK7nM3sO9dF1gH...
```

---

## 📋 Структура БД для аутентификации

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String   // ← Bcrypt хеш!
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  campaigns       Campaign[]
  links           Link[]
  refreshTokens   RefreshToken[]
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique  // ← Хешированный refresh token!
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  expiresAt DateTime
  isRevoked Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([userId])
}
```

---

## 🚀 Этапы реализации

### Этап 1: Подготовка (что установить)
```bash
npm install bcrypt jsonwebtoken
npm install -D @types/bcrypt @types/jsonwebtoken
```

### Этап 2: Обновить schema.prisma
- Добавить RefreshToken модель
- Запустить миграцию

### Этап 3: Создать Services для аутентификации
- AuthService (логика)
- PasswordService (хеширование)
- TokenService (JWT создание/проверка)

### Этап 4: Создать Routes
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout
- GET /api/auth/me

### Этап 5: Создать Middleware
- authenticateToken (проверка JWT)
- validatePassword (требования)

### Этап 6: Документирование (как использовать)

### Этап 7: На фронте (потом)
- Сохранение tokens
- Отправка Authorization header
- Обновление accessToken
- Logout

---

## ✅ Чек-лист безопасности

Перед production убедитесь:

- [ ] Пароли хешируются bcrypt ($2b$10$...)
- [ ] Access token = 15 минут
- [ ] Refresh token = 7 дней
- [ ] Refresh token сохранён в БД (хешированный)
- [ ] JWT проверяется на backend
- [ ] Используется HTTPS (в production)
- [ ] CORS правильно настроен
- [ ] Rate limiting установлен
- [ ] Логируются попытки входа
- [ ] Пароль требует 12+ символов
- [ ] Нет default паролей/токенов
- [ ] Secrets в .env файле (не в коде)
- [ ] Refresh token в HttpOnly cookie
- [ ] SameSite cookie флаг установлен
- [ ] Нет чувствительной информации в JWT payload
- [ ] Logout отозывает refresh token в БД

---

## 📚 Дополнительные ресурсы

- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Bcrypt vs PBKDF2 vs Argon2](https://medium.com/@mpreziuso/password-hashing-pbkdf2-bcrypt-scrypt-argon2-e3c4720a7f77)
- [JWT.io - Decoder & Generator](https://jwt.io/)

---

## 🎯 Следующие шаги

1. **Прочитай этот гайд полностью** (очень важно)
2. **Понимай каждое решение** (почему так, а не иначе)
3. **Следуй best practices** (без сокращений)
4. **Тестируй безопасность** (попробуй украсть токен)

Готов к реализации? 🚀

