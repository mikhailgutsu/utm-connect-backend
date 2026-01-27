# 👤 User Info Endpoint - Полная информация о пользователе

## 📊 Структура базы данных

Добавлены новые модели и расширена User модель:

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  
  // Профиль пользователя
  role      Int      @default(0)  // 0=студент, 1=преподаватель, 2=админ
  group     String?  // Группа (CR-211)
  
  // Отношения к другим данным
  friendOf       Friend[]  @relation("UserFriends")
  friends        Friend[]  @relation("FriendOf")
  groupMemberships GroupMember[]
  profilePhotos  Photo[] @relation("ProfilePhotos")
  wallPosts      Post[]  @relation("WallPosts")
}

// Дружба между пользователями
model Friend {
  id        String   @id @default(cuid())
  userId    String
  friendId  String
  user      User     @relation("UserFriends", fields: [userId], references: [id], onDelete: Cascade)
  friend    User     @relation("FriendOf", fields: [friendId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  @@unique([userId, friendId])
}

// Группы/Классы
model Group {
  id        String   @id @default(cuid())
  name      String   // CR-211
  description String?
  members   GroupMember[]
  @@unique([name])
}

// Членство в группе
model GroupMember {
  id        String   @id @default(cuid())
  userId    String
  groupId   String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  group     Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)
  joinedAt  DateTime @default(now())
  @@unique([userId, groupId])
}

// Фотографии профиля
model Photo {
  id        String   @id @default(cuid())
  userId    String
  url       String
  caption   String?
  isPrimary Boolean  @default(false)
  user      User     @relation("ProfilePhotos", fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}

// Посты на стене
model Post {
  id        String   @id @default(cuid())
  userId    String
  content   String
  user      User     @relation("WallPosts", fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}
```

---

## 🔑 API Endpoints

### 1️⃣ GET /api/users/info/:id
**Получить полную информацию о пользователе по ID**

**URL:**
```
GET http://localhost:3000/api/users/info/cmkv5lnl60000n16fyykpxxh0
```

**Response (200):**
```json
{
  "id": "cmkv5lnl60000n16fyykpxxh0",
  "email": "newuser@example.com",
  "name": "New User",
  "role": 0,
  "group": "CR-211",
  "friends": [
    "cmkv5lnl60000n16fyykpzzz1",
    "cmkv5lnl60000n16fyykpzzz2"
  ],
  "groupIds": [
    "grp_001",
    "grp_002",
    "grp_003"
  ],
  "photoIds": [
    "photo_1",
    "photo_2",
    "photo_3"
  ],
  "postIds": [
    "post_1",
    "post_2",
    "post_5"
  ]
}
```

---

### 2️⃣ GET /api/users/me/info
**Получить полную информацию о текущем авторизованном пользователе (требует токен)**

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**URL:**
```
GET http://localhost:3000/api/users/me/info
```

**Response (200):**
```json
{
  "id": "cmkv5lnl60000n16fyykpxxh0",
  "email": "newuser@example.com",
  "name": "New User",
  "role": 0,
  "group": "CR-211",
  "friends": [
    "cmkv5lnl60000n16fyykpzzz1",
    "cmkv5lnl60000n16fyykpzzz2"
  ],
  "groupIds": [
    "grp_001",
    "grp_002"
  ],
  "photoIds": [
    "photo_1",
    "photo_2"
  ],
  "postIds": [
    "post_1",
    "post_2"
  ]
}
```

---

## 🧪 Тестирование через curl

### ✅ Результаты тестирования (27 января 2026)

#### Шаг 1: Успешный логин
```bash
$ curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mikhail.gutsu.2002@gmail.com","password":"Qwerty123!@#"}' | jq .
```

**Ответ (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWt3ZnEydmowMDAwOXBiZnIwZDE5ZHh5IiwiZW1haWwiOiJtaWtoYWlsLmd1dHN1LjIwMDJAZ21haWwuY29tIiwiaWF0IjoxNzY5NTExNTYwLCJleHAiOjE3Njk1MTI0NjAsImlzcyI6InV0bS1jb25uZWN0In0.EYuJTNB4lGBL2-cmfsal1y_WA8n_jZOpMMxKDrRPgSk",
  "user": {
    "id": "cmkwfq2vj00009pbfr0d19dxy",
    "email": "mikhail.gutsu.2002@gmail.com",
    "name": "Mihai Gutu "
  }
}
```

---

#### Шаг 2: Получить информацию о себе (с токеном)
```bash
$ TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWt3ZnEydmowMDAwOXBiZnIwZDE5ZHh5IiwiZW1haWwiOiJtaWtoYWlsLmd1dHN1LjIwMDJAZ21haWwuY29tIiwiaWF0IjoxNzY5NTExNTYwLCJleHAiOjE3Njk1MTI0NjAsImlzcyI6InV0bS1jb25uZWN0In0.EYuJTNB4lGBL2-cmfsal1y_WA8n_jZOpMMxKDrRPgSk"

$ curl -s -X GET http://localhost:3000/api/users/me/info \
  -H "Authorization: Bearer $TOKEN" | jq .
```

**Ответ (200 OK) - ПОЛНАЯ ИНФОРМАЦИЯ О ПОЛЬЗОВАТЕЛЕ:**
```json
{
  "id": "cmkwfq2vj00009pbfr0d19dxy",
  "email": "mikhail.gutsu.2002@gmail.com",
  "name": "Mihai Gutu ",
  "role": 0,
  "group": null,
  "friends": [],
  "groupIds": [],
  "photoIds": [],
  "postIds": []
}
```

✅ **Эндпоинт работает корректно!**

---

## 📋 Полная информация

**Что возвращает эндпоинт getUserInfo():**

| Поле | Тип | Описание |
|------|-----|---------|
| `id` | `string` | Уникальный ID пользователя (cuid) |
| `email` | `string` | Email пользователя |
| `name` | `string` | Имя пользователя |
| `role` | `number` | 0=студент, 1=преподаватель, 2=админ |
| `group` | `string \| null` | Группа (CR-211) или null |
| `friends` | `string[]` | Массив ID друзей пользователя |
| `groupIds` | `string[]` | Массив ID групп, в которых участвует |
| `photoIds` | `string[]` | Массив ID фотографий профиля |
| `postIds` | `string[]` | Массив ID постов на стене |

---

## 🛠️ Миграция БД

Создана миграция: `20260127105403_add_user_profile_models`

Добавлены таблицы:
- `Friend` - дружба между пользователями
- `Group` - группы/классы
- `GroupMember` - членство в группах
- `Photo` - фотографии профиля
- `Post` - посты на стене

Расширена таблица `User`:
- Поле `role` (INT, default=0)
- Поле `group` (VARCHAR, nullable)
- Отношения к новым таблицам

---

## ✅ Готовые сценарии

### Сценарий 1: Получить полный профиль авторизованного пользователя
```bash
# 1. Залогиниться
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"MyPassword123!"}' | jq -r '.accessToken')

# 2. Получить полный профиль
curl -s -X GET http://localhost:3000/api/users/me/info \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

### Сценарий 2: Получить информацию о конкретном пользователе
```bash
curl -s -X GET http://localhost:3000/api/users/info/cmkv5lnl60000n16fyykpxxh0 | jq .
```

---

## 📝 Примеры использования на React

### Получить информацию о текущем пользователе
```typescript
const response = await fetch('http://localhost:3000/api/users/me/info', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const userInfo = await response.json();
console.log(userInfo);
// {
//   id: "...",
//   email: "...",
//   name: "...",
//   role: 0,
//   group: "CR-211",
//   friends: [...],
//   groupIds: [...],
//   photoIds: [...],
//   postIds: [...]
// }
```

---

## 🔍 Детали реализации

### UserService.getUserInfo()
```typescript
async getUserInfo(userId: string): Promise<UserInfoDTO> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      group: true,
      friends: { select: { friendId: true } },
      groupMemberships: { select: { groupId: true } },
      profilePhotos: { select: { id: true } },
      wallPosts: { select: { id: true } },
    },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    group: user.group,
    friends: user.friends.map((f) => f.friendId),
    groupIds: user.groupMemberships.map((gm) => gm.groupId),
    photoIds: user.profilePhotos.map((p) => p.id),
    postIds: user.wallPosts.map((p) => p.id),
  };
}
```

**Оптимизация:**
- ✅ Используется `select` вместо полного fetch (меньше данных)
- ✅ Не включаем пароль в ответ
- ✅ Возвращаем только ID связанных объектов (компактнее)
- ✅ Быстрая работа с индексами БД

---

## ✨ Готово!

Теперь у тебя есть полный эндпоинт для получения информации о пользователе с:
- ✅ ID (0..1..2...)
- ✅ Email и имя
- ✅ Ролью (студент/преподаватель/админ)
- ✅ Группой (CR-211)
- ✅ Списком друзей
- ✅ Группами участия
- ✅ Фотографиями профиля
- ✅ Постами на стене

Всё в одном JSON запросе! 🚀
