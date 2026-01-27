# 📨 API Документация - Личные сообщения

## Базовый URL
```
http://localhost:3000/api/messages
```

---

## 📋 Оглавление
1. [Получить или создать беседу](#1-получить-или-создать-беседу)
2. [Отправить сообщение](#2-отправить-сообщение)
3. [Получить сообщения беседы](#3-получить-сообщения-беседы)
4. [Получить список всех бесед](#4-получить-список-всех-бесед)
5. [Пометить сообщения как прочитанные](#5-пометить-сообщения-как-прочитанные)

---

## 🔐 Важно!

**Все эндпоинты требуют авторизации!**

Каждый запрос должен содержать JWT токен в заголовке:
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## 1. Получить или создать беседу

Создает новую беседу с пользователем или возвращает существующую.

### Запрос
```
POST /api/messages/conversation/:userId
```

### Параметры URL
- `userId` (string, обязательный) - ID пользователя, с которым хотим начать беседу

### Headers
```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

### cURL
```bash
curl -X POST http://localhost:3000/api/messages/conversation/USER_ID_HERE \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

### Ответ (200 OK)
```json
{
  "conversation": {
    "id": "conv-abc123",
    "participants": ["user-aaa", "user-bbb"],
    "lastMessage": null,
    "lastMessageAt": null,
    "createdAt": "2026-01-27T17:00:00.000Z",
    "updatedAt": "2026-01-27T17:00:00.000Z",
    "messages": []
  },
  "otherUser": {
    "id": "user-bbb",
    "name": "Иван Иванов",
    "photoUrl": "https://example.com/photo.jpg"
  }
}
```

### Ошибки
- `400` - Попытка создать беседу с самим собой
- `401` - Не авторизован
- `404` - Пользователь не найден

---

## 2. Отправить сообщение

Отправляет текстовое сообщение в существующую беседу.

### Запрос
```
POST /api/messages/:conversationId
```

### Параметры URL
- `conversationId` (string, обязательный) - ID беседы

### Headers
```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

### Body
```json
{
  "text": "Привет! Как дела?"
}
```

### cURL
```bash
curl -X POST http://localhost:3000/api/messages/conv-abc123 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Привет! Как дела?"
  }'
```

### Ответ (201 Created)
```json
{
  "message": "Message sent successfully",
  "data": {
    "id": "msg-xyz789",
    "conversationId": "conv-abc123",
    "senderId": "user-aaa",
    "text": "Привет! Как дела?",
    "isRead": false,
    "createdAt": "2026-01-27T17:05:00.000Z"
  }
}
```

### Ошибки
- `400` - Пустой текст сообщения
- `401` - Не авторизован
- `403` - Вы не участник этой беседы
- `404` - Беседа не найдена

---

## 3. Получить сообщения беседы

Возвращает список сообщений в беседе с пагинацией.

### Запрос
```
GET /api/messages/:conversationId
```

### Параметры URL
- `conversationId` (string, обязательный) - ID беседы

### Query параметры (опциональные)
- `page` (integer) - Номер страницы (по умолчанию: 1)
- `limit` (integer) - Количество сообщений на странице (по умолчанию: 50)

### Headers
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### cURL
```bash
# Простой запрос
curl -X GET http://localhost:3000/api/messages/conv-abc123 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# С пагинацией
curl -X GET "http://localhost:3000/api/messages/conv-abc123?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Ответ (200 OK)
```json
{
  "messages": [
    {
      "id": "msg-1",
      "conversationId": "conv-abc123",
      "senderId": "user-aaa",
      "text": "Привет!",
      "isRead": true,
      "createdAt": "2026-01-27T17:00:00.000Z"
    },
    {
      "id": "msg-2",
      "conversationId": "conv-abc123",
      "senderId": "user-bbb",
      "text": "Привет! Как дела?",
      "isRead": false,
      "createdAt": "2026-01-27T17:05:00.000Z"
    }
  ],
  "otherUser": {
    "id": "user-bbb",
    "name": "Иван Иванов",
    "photoUrl": "https://example.com/photo.jpg"
  },
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 50,
    "pages": 1
  }
}
```

### Ошибки
- `401` - Не авторизован
- `403` - Вы не участник этой беседы
- `404` - Беседа не найдена

---

## 4. Получить список всех бесед

Возвращает список всех бесед текущего пользователя, отсортированных по времени последнего сообщения.

### Запрос
```
GET /api/messages/conversations/list
```

### Headers
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### cURL
```bash
curl -X GET http://localhost:3000/api/messages/conversations/list \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Ответ (200 OK)
```json
{
  "conversations": [
    {
      "id": "conv-abc123",
      "participants": ["user-aaa", "user-bbb"],
      "lastMessage": "Отлично, спасибо!",
      "lastMessageAt": "2026-01-27T17:30:00.000Z",
      "createdAt": "2026-01-27T16:00:00.000Z",
      "unreadCount": 3,
      "otherUser": {
        "id": "user-bbb",
        "name": "Иван Иванов",
        "photoUrl": "https://example.com/photo.jpg"
      }
    },
    {
      "id": "conv-xyz789",
      "participants": ["user-aaa", "user-ccc"],
      "lastMessage": "Увидимся завтра!",
      "lastMessageAt": "2026-01-27T16:45:00.000Z",
      "createdAt": "2026-01-26T10:00:00.000Z",
      "unreadCount": 0,
      "otherUser": {
        "id": "user-ccc",
        "name": "Петр Петров",
        "photoUrl": null
      }
    }
  ],
  "total": 2
}
```

### Особенности
- ✅ Беседы отсортированы по `lastMessageAt` (новые сверху)
- ✅ Включает количество непрочитанных сообщений (`unreadCount`)
- ✅ Возвращает информацию о собеседнике

### Ошибки
- `401` - Не авторизован

---

## 5. Пометить сообщения как прочитанные

Помечает все непрочитанные сообщения в беседе как прочитанные.

### Запрос
```
PUT /api/messages/:conversationId/read
```

### Параметры URL
- `conversationId` (string, обязательный) - ID беседы

### Headers
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### cURL
```bash
curl -X PUT http://localhost:3000/api/messages/conv-abc123/read \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Ответ (200 OK)
```json
{
  "message": "Messages marked as read"
}
```

### Ошибки
- `401` - Не авторизован
- `403` - Вы не участник этой беседы
- `404` - Беседа не найдена

---

## 📊 Структура данных

### Conversation (Беседа)
```typescript
{
  id: string;                  // Уникальный ID беседы
  participants: string[];      // Массив ID участников [user1, user2]
  lastMessage: string | null;  // Текст последнего сообщения
  lastMessageAt: Date | null;  // Время последнего сообщения
  createdAt: Date;             // Время создания беседы
  updatedAt: Date;             // Время обновления
}
```

### Message (Сообщение)
```typescript
{
  id: string;            // Уникальный ID сообщения
  conversationId: string;// ID беседы
  senderId: string;      // ID отправителя
  text: string;          // Текст сообщения
  isRead: boolean;       // Прочитано ли сообщение
  createdAt: Date;       // Время отправки
}
```

---

## 💡 Типичный сценарий использования

### 1. Пользователь открывает профиль другого пользователя и хочет написать

```typescript
// 1. Создаем или получаем беседу
const response = await fetch(`/api/messages/conversation/${targetUserId}`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
const { conversation, otherUser } = await response.json();

// 2. Отправляем сообщение
await fetch(`/api/messages/${conversation.id}`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ text: 'Привет!' }),
});
```

### 2. Загрузка списка бесед при входе в раздел "Сообщения"

```typescript
const response = await fetch('/api/messages/conversations/list', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
const { conversations, total } = await response.json();
```

### 3. Открытие беседы и загрузка сообщений

```typescript
const response = await fetch(`/api/messages/${conversationId}?page=1&limit=50`, {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
const { messages, otherUser, pagination } = await response.json();

// Помечаем сообщения как прочитанные
await fetch(`/api/messages/${conversationId}/read`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

---

## 🎯 React/TypeScript типы

```typescript
interface User {
  id: string;
  name: string;
  photoUrl: string | null;
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  unreadCount?: number;
  otherUser?: User;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  isRead: boolean;
  createdAt: string;
}

interface ConversationResponse {
  conversation: Conversation & {
    messages: Message[];
  };
  otherUser: User | null;
}

interface MessagesResponse {
  messages: Message[];
  otherUser: User | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

interface ConversationsListResponse {
  conversations: Conversation[];
  total: number;
}
```

---

## 📝 Примеры API клиента (TypeScript)

```typescript
class MessagesAPI {
  private baseUrl = 'http://localhost:3000/api/messages';
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request(url: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }

  async getOrCreateConversation(userId: string): Promise<ConversationResponse> {
    return this.request(`/conversation/${userId}`, { method: 'POST' });
  }

  async sendMessage(conversationId: string, text: string) {
    return this.request(`/${conversationId}`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async getMessages(
    conversationId: string,
    page = 1,
    limit = 50
  ): Promise<MessagesResponse> {
    return this.request(`/${conversationId}?page=${page}&limit=${limit}`);
  }

  async getConversations(): Promise<ConversationsListResponse> {
    return this.request('/conversations/list');
  }

  async markAsRead(conversationId: string) {
    return this.request(`/${conversationId}/read`, { method: 'PUT' });
  }
}

// Использование
const api = new MessagesAPI(accessToken);

// Создать беседу
const { conversation } = await api.getOrCreateConversation('user-123');

// Отправить сообщение
await api.sendMessage(conversation.id, 'Привет!');

// Получить сообщения
const { messages } = await api.getMessages(conversation.id);

// Получить список бесед
const { conversations } = await api.getConversations();

// Пометить как прочитанное
await api.markAsRead(conversation.id);
```

---

## 🚨 Важные моменты

### 1. Порядок сообщений
- В эндпоинте `/api/messages/:conversationId` сообщения возвращаются **от старых к новым** (asc)
- В списке бесед они отсортированы **по времени последнего сообщения** (desc)

### 2. Непрочитанные сообщения
- Счетчик `unreadCount` считает только сообщения **от собеседника**
- Собственные сообщения всегда считаются прочитанными

### 3. Participants
- Массив `participants` всегда отсортирован
- Содержит ровно 2 элемента (текущий пользователь + собеседник)

### 4. Real-time обновления
- API не поддерживает WebSocket/SSE
- Для получения новых сообщений нужен polling или WebSocket (добавь отдельно)

---

## 🔧 Возможные доработки

### Что можно добавить:
1. **WebSocket для real-time** - мгновенные обновления без polling
2. **Удаление сообщений** - DELETE /api/messages/:messageId
3. **Редактирование сообщений** - PUT /api/messages/:messageId
4. **Типизация сообщений** - текст, изображение, файл
5. **Групповые чаты** - беседы с >2 участниками
6. **Поиск по сообщениям** - GET /api/messages/search?q=текст
7. **Статус "печатает"** - через WebSocket
8. **Прикрепление файлов** - загрузка изображений/документов

---

## 📊 Коды ответов

| Код | Значение |
|-----|----------|
| `200` | OK - Успешный запрос |
| `201` | Created - Сообщение отправлено |
| `400` | Bad Request - Некорректные данные |
| `401` | Unauthorized - Требуется авторизация |
| `403` | Forbidden - Нет прав доступа к беседе |
| `404` | Not Found - Беседа или пользователь не найден |
| `500` | Internal Server Error - Ошибка сервера |

---

## ✅ Готово!

Сервер полностью подготовлен для работы с личными сообщениями. Все эндпоинты протестированы и готовы к интеграции с фронтендом.

**База данных обновлена:**
- ✅ Модель `Conversation` создана
- ✅ Модель `Message` создана
- ✅ Миграция применена
- ✅ Эндпоинты добавлены и подключены

**Сервер запущен на:** `http://localhost:3000`

Удачи с фронтенд частью! 🚀
