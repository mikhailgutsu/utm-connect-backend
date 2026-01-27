# 📝 API Документация - Эндпоинты для работы с постами

## Базовый URL
```
http://localhost:3000/api/posts
```

---

## 📋 Оглавление
1. [Создать пост](#1-создать-пост)
2. [Получить пост по ID](#2-получить-пост-по-id)
3. [Получить все посты](#3-получить-все-посты-с-пагинацией)
4. [Лайкнуть пост](#4-лайкнуть-пост)
5. [Убрать лайк](#5-убрать-лайк)
6. [Добавить комментарий](#6-добавить-комментарий)
7. [Обновить пост](#7-обновить-пост)
8. [Удалить пост](#8-удалить-пост)

---

## 1. Создать пост

### Запрос
```bash
POST /api/posts/create
```

### Headers
```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

### Body
```json
{
  "description": "Мой первый пост!",
  "photoUrls": ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"]
}
```

### cURL
```bash
curl -X POST http://localhost:3000/api/posts/create \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Мой первый пост!",
    "photoUrls": ["https://example.com/photo1.jpg"]
  }'
```

### Ответ (200 OK)
```json
{
  "message": "Post created successfully",
  "post": {
    "id": "clyd1abc123xyz",
    "userId": "user-aaa",
    "description": "Мой первый пост!",
    "photoUrls": ["https://example.com/photo1.jpg"],
    "likes": [],
    "comments": [],
    "createdAt": "2026-01-27T16:30:00.000Z",
    "updatedAt": "2026-01-27T16:30:00.000Z"
  }
}
```

### Ошибки
- `400` - Некорректные данные (отсутствует description)
- `401` - Не авторизирован
- `500` - Ошибка сервера

---

## 2. Получить пост по ID

### Запрос
```bash
GET /api/posts/:id
```

### Параметры
- `id` (string, обязательный) - ID поста

### cURL
```bash
curl -X GET http://localhost:3000/api/posts/clyd1abc123xyz \
  -H "Content-Type: application/json"
```

### Ответ (200 OK)
```json
{
  "id": "clyd1abc123xyz",
  "userId": "user-aaa",
  "description": "Мой первый пост!",
  "photoUrls": ["https://example.com/photo1.jpg"],
  "likes": ["user-bbb", "user-ccc"],
  "comments": [
    {
      "id": "comment-1",
      "postId": "clyd1abc123xyz",
      "userId": "user-bbb",
      "text": "Отличный пост!",
      "createdAt": "2026-01-27T16:35:00.000Z"
    }
  ],
  "createdAt": "2026-01-27T16:30:00.000Z",
  "updatedAt": "2026-01-27T16:30:00.000Z"
}
```

### Ошибки
- `404` - Пост не найден

---

## 3. Получить все посты (с пагинацией)

### Запрос
```bash
GET /api/posts
```

### Query параметры
- `page` (integer, опциональный) - Номер страницы (по умолчанию: 1)
- `limit` (integer, опциональный) - Количество постов на странице (по умолчанию: 10)

### cURL
```bash
# Первая страница
curl -X GET "http://localhost:3000/api/posts?page=1&limit=10" \
  -H "Content-Type: application/json"

# Вторая страница
curl -X GET "http://localhost:3000/api/posts?page=2&limit=5" \
  -H "Content-Type: application/json"
```

### Ответ (200 OK)
```json
{
  "posts": [
    {
      "id": "clyd1abc123xyz",
      "userId": "user-aaa",
      "description": "Мой первый пост!",
      "photoUrls": ["https://example.com/photo1.jpg"],
      "likes": ["user-bbb"],
      "comments": [],
      "createdAt": "2026-01-27T16:30:00.000Z",
      "updatedAt": "2026-01-27T16:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

---

## 4. Лайкнуть пост

### Запрос
```bash
POST /api/posts/:id/like
```

### Headers
```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

### Параметры
- `id` (string, обязательный) - ID поста

### cURL
```bash
curl -X POST http://localhost:3000/api/posts/clyd1abc123xyz/like \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

### Ответ (200 OK)
```json
{
  "message": "Post liked successfully",
  "post": {
    "id": "clyd1abc123xyz",
    "userId": "user-aaa",
    "description": "Мой первый пост!",
    "photoUrls": ["https://example.com/photo1.jpg"],
    "likes": ["user-aaa", "user-bbb"],
    "comments": [],
    "createdAt": "2026-01-27T16:30:00.000Z",
    "updatedAt": "2026-01-27T16:35:00.000Z"
  }
}
```

### Ошибки
- `400` - Пост уже лайкнут
- `401` - Не авторизирован
- `404` - Пост не найден

---

## 5. Убрать лайк

### Запрос
```bash
POST /api/posts/:id/unlike
```

### Headers
```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

### Параметры
- `id` (string, обязательный) - ID поста

### cURL
```bash
curl -X POST http://localhost:3000/api/posts/clyd1abc123xyz/unlike \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

### Альтернативный способ (DELETE)
```bash
curl -X DELETE http://localhost:3000/api/posts/clyd1abc123xyz/likes/user-id \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Ответ (200 OK)
```json
{
  "message": "Like removed successfully",
  "post": {
    "id": "clyd1abc123xyz",
    "userId": "user-aaa",
    "description": "Мой первый пост!",
    "photoUrls": ["https://example.com/photo1.jpg"],
    "likes": ["user-bbb"],
    "comments": [],
    "createdAt": "2026-01-27T16:30:00.000Z",
    "updatedAt": "2026-01-27T16:40:00.000Z"
  }
}
```

### Ошибки
- `400` - Вы не лайкали этот пост
- `401` - Не авторизирован
- `404` - Пост не найден

---

## 6. Добавить комментарий

### Запрос
```bash
POST /api/posts/:id/comment
```

### Headers
```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

### Параметры
- `id` (string, обязательный) - ID поста

### Body
```json
{
  "text": "Отличный пост! Очень нравится!"
}
```

### cURL
```bash
curl -X POST http://localhost:3000/api/posts/clyd1abc123xyz/comment \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Отличный пост!"
  }'
```

### Ответ (201 Created)
```json
{
  "message": "Comment added successfully",
  "post": {
    "id": "clyd1abc123xyz",
    "userId": "user-aaa",
    "description": "Мой первый пост!",
    "photoUrls": ["https://example.com/photo1.jpg"],
    "likes": ["user-bbb"],
    "comments": [
      {
        "id": "comment-1",
        "postId": "clyd1abc123xyz",
        "userId": "user-ccc",
        "text": "Отличный пост!",
        "createdAt": "2026-01-27T16:45:00.000Z"
      }
    ],
    "createdAt": "2026-01-27T16:30:00.000Z",
    "updatedAt": "2026-01-27T16:45:00.000Z"
  }
}
```

### Ошибки
- `400` - Пустой текст комментария
- `401` - Не авторизирован
- `404` - Пост не найден

---

## 7. Обновить пост

### Запрос
```bash
PUT /api/posts/:id
```

### Headers
```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

### Параметры
- `id` (string, обязательный) - ID поста

### Body
```json
{
  "description": "Обновленное описание",
  "photoUrls": ["https://example.com/new-photo.jpg"]
}
```

### cURL
```bash
curl -X PUT http://localhost:3000/api/posts/clyd1abc123xyz \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Обновленное описание поста",
    "photoUrls": ["https://example.com/new-photo.jpg"]
  }'
```

### Ответ (200 OK)
```json
{
  "message": "Post updated successfully",
  "post": {
    "id": "clyd1abc123xyz",
    "userId": "user-aaa",
    "description": "Обновленное описание поста",
    "photoUrls": ["https://example.com/new-photo.jpg"],
    "likes": ["user-bbb"],
    "comments": [],
    "createdAt": "2026-01-27T16:30:00.000Z",
    "updatedAt": "2026-01-27T16:50:00.000Z"
  }
}
```

### Ошибки
- `400` - Некорректные данные
- `401` - Не авторизирован
- `403` - Вы можете редактировать только свои посты
- `404` - Пост не найден

---

## 8. Удалить пост

### Запрос
```bash
DELETE /api/posts/:id
```

### Headers
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Параметры
- `id` (string, обязательный) - ID поста

### cURL
```bash
curl -X DELETE http://localhost:3000/api/posts/clyd1abc123xyz \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Ответ (200 OK)
```json
{
  "message": "Post deleted successfully"
}
```

### Ошибки
- `401` - Не авторизирован
- `403` - Вы можете удалять только свои посты
- `404` - Пост не найден

---

## 🔐 Аутентификация

Все эндпоинты, кроме GET, требуют авторизацию.

### Как получить токен?

1. **Зарегистрировать пользователя:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "User Name",
    "password": "password123",
    "group": "МИ"
  }'
```

2. **Залогиниться:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

3. **Используй полученный `accessToken`:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## 📊 Коды ответов

| Код | Значение |
|-----|----------|
| `200` | OK - Успешный запрос |
| `201` | Created - Ресурс успешно создан |
| `400` | Bad Request - Некорректные данные |
| `401` | Unauthorized - Требуется авторизация |
| `403` | Forbidden - Нет прав доступа |
| `404` | Not Found - Ресурс не найден |
| `500` | Internal Server Error - Ошибка сервера |

---

## 💡 Полный пример

```bash
#!/bin/bash

# 1. Регистрация
echo "1. Регистрация пользователя..."
REGISTER=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user1@example.com",
    "name": "User One",
    "password": "password123",
    "group": "МИ"
  }')

echo "✓ Регистрация завершена"

# 2. Логин
echo "2. Вход в систему..."
LOGIN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user1@example.com",
    "password": "password123"
  }')

TOKEN=$(echo $LOGIN | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
echo "✓ Токен получен"

# 3. Создание поста
echo "3. Создание поста..."
POST=$(curl -s -X POST http://localhost:3000/api/posts/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Мой классный пост!",
    "photoUrls": ["https://example.com/photo.jpg"]
  }')

POST_ID=$(echo $POST | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "✓ Пост создан: $POST_ID"

# 4. Лайк на пост
echo "4. Лайк на пост..."
curl -s -X POST "http://localhost:3000/api/posts/$POST_ID/like" \
  -H "Authorization: Bearer $TOKEN" | jq
echo "✓ Лайк добавлен"

# 5. Комментарий
echo "5. Добавление комментария..."
curl -s -X POST "http://localhost:3000/api/posts/$POST_ID/comment" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Классный пост!"}' | jq
echo "✓ Комментарий добавлен"

# 6. Получение поста
echo "6. Получение информации о посте..."
curl -s -X GET "http://localhost:3000/api/posts/$POST_ID" | jq
echo "✓ Информация получена"

# 7. Все посты
echo "7. Получение всех постов..."
curl -s -X GET "http://localhost:3000/api/posts?page=1&limit=5" | jq
echo "✓ Все посты получены"
```

Сохрани как `test-posts.sh` и запусти:
```bash
bash test-posts.sh
```

---

## 🎯 Используемые значения

### Заменяй эти значения на свои:
- `YOUR_ACCESS_TOKEN` - Токен из ответа /auth/login
- `POST_ID` - ID поста (например: `clyd1abc123xyz`)
- `USER_ID` - Твой ID пользователя
- `user@example.com` - Твой email
- `password123` - Твой пароль
