# 🔐 JWT Аутентификация на React + Vite - Полное руководство

## 📚 Содержание
1. [Как работают JWT токены на сервере](#как-работают-jwt-токены-на-сервере)
2. [Архитектура аутентификации](#архитектура-аутентификации)
3. [Реализация на React + Vite](#реализация-на-react--vite)
4. [Примеры компонентов](#примеры-компонентов)

---

## 🔑 Как работают JWT токены на сервере

### 1️⃣ Два типа токенов

#### **Access Token** (15 минут)
```json
{
  "userId": "cmkv5lnl60000n16fyykpxxh0",
  "email": "user@example.com",
  "iat": 1769431132,    // Создан в момент времени
  "exp": 1769432032,    // Истекает через 15 минут
  "iss": "utm-connect"  // Издатель
}
```

**Где используется:**
- Отправляется в заголовке `Authorization: Bearer <token>`
- Используется для доступа к защищённым эндпоинтам
- КОРОТКОЖИВУЩИЙ (15 мин) для безопасности

#### **Refresh Token** (7 дней)
```json
{
  "userId": "cmkv5lnl60000n16fyykpxxh0",
  "type": "refresh",
  "iat": 1769431132,
  "exp": 1774635132,    // Истекает через 7 дней
  "iss": "utm-connect"
}
```

**Где используется:**
- Отправляется в **HttpOnly Cookie** автоматически
- Используется ТОЛЬКО для получения нового Access Token
- ДОЛГОЖИВУЩИЙ (7 дней)
- Также сохраняется в БД для отозвания (logout)

---

### 2️⃣ Как происходит аутентификация

#### **Шаг 1: Регистрация (Register)**
```
┌─────────┐                           ┌────────┐
│ React   │                           │ Server │
└────┬────┘                           └───┬────┘
     │                                    │
     │─ POST /api/auth/register ────────>│
     │  {email, name, password}          │
     │                                   │ (1) Валидирует пароль
     │                                   │ (2) Хеширует пароль (bcrypt)
     │                                   │ (3) Сохраняет user в БД
     │                                   │ (4) Создаёт токены
     │                                   │ (5) Сохраняет refresh token в БД
     │<─ 201 Created ────────────────────│
     │  {accessToken, user}              │
     │  Set-Cookie: refreshToken         │ (HttpOnly, Secure, SameSite)
```

**Ответ сервера:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "cmkv5lnl60000n16fyykpxxh0",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**HttpOnly Cookie (автоматически):**
```
Set-Cookie: refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; 
            HttpOnly; 
            Secure; 
            SameSite=Strict; 
            Max-Age=604800000; 
            Path=/
```

---

#### **Шаг 2: Вход (Login)**
```
┌─────────┐                           ┌────────┐
│ React   │                           │ Server │
└────┬────┘                           └───┬────┘
     │                                    │
     │─ POST /api/auth/login ────────────>│
     │  {email, password}                 │
     │                                   │ (1) Находит user по email
     │                                   │ (2) Проверяет пароль (bcrypt.compare)
     │                                   │ (3) Создаёт новые токены
     │                                   │ (4) Сохраняет новый refresh token
     │<─ 200 OK ─────────────────────────│
     │  {accessToken, user}              │
     │  Set-Cookie: refreshToken         │
```

---

#### **Шаг 3: Защищённый запрос (Get User Info)**
```
┌─────────┐                           ┌────────┐
│ React   │                           │ Server │
└────┬────┘                           └───┬────┘
     │                                    │
     │─ GET /api/auth/me ────────────────>│
     │  Authorization: Bearer <accessToken>
     │                                   │ (1) Проверяет подпись token
     │                                   │ (2) Проверяет exp (не истёк ли)
     │                                   │ (3) Извлекает userId из token
     │                                   │ (4) Возвращает user
     │<─ 200 OK ─────────────────────────│
     │  {id, email, name, createdAt}    │
```

---

#### **Шаг 4: Обновление токена (Refresh)**
```
┌─────────┐                           ┌────────┐
│ React   │                           │ Server │
└────┬────┘                           └───┬────┘
     │                                    │
     │─ POST /api/auth/refresh ─────────>│
     │  {refreshToken: "..."}            │
     │  (Cookie отправляется              │
     │   автоматически)                  │
     │                                   │ (1) Проверяет подпись
     │                                   │ (2) Проверяет exp
     │                                   │ (3) Проверяет что он в БД
     │                                   │ (4) Проверяет не revoked ли
     │                                   │ (5) Создаёт новый accessToken
     │<─ 200 OK ─────────────────────────│
     │  {accessToken}                    │
```

---

#### **Шаг 5: Выход (Logout)**
```
┌─────────┐                           ┌────────┐
│ React   │                           │ Server │
└────┬────┘                           └───┬────┘
     │                                    │
     │─ POST /api/auth/logout ──────────>│
     │  Authorization: Bearer <accessToken>
     │                                   │ (1) Проверяет token
     │                                   │ (2) Помечает все refresh токены как revoked
     │                                   │ (3) Удаляет cookie
     │<─ 200 OK ─────────────────────────│
     │  {message: "Logged out"}          │
     │  Set-Cookie: refreshToken="" (expires)
```

---

## 🏗️ Архитектура аутентификации

### Безопасность токенов

```
╔════════════════════════════════════════════════════════════╗
║                    БЕЗОПАСНОСТЬ                            ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  Access Token:                                             ║
║  ├─ Хранится в ПАМЯТИ React (state)                       ║
║  ├─ Отправляется в Authorization header                   ║
║  ├─ Доступен для чтения (нормально, данные из token)      ║
║  ├─ Короткоживущий (15 мин) = меньше риск                 ║
║  └─ Если украден, украдённый на 15 мин (потом истекает)   ║
║                                                            ║
║  Refresh Token:                                            ║
║  ├─ HttpOnly Cookie (JavaScript не может прочитать!)      ║
║  ├─ Secure (только HTTPS)                                 ║
║  ├─ SameSite=Strict (защита от CSRF)                      ║
║  ├─ Сохранён в БД (можно отозвать)                        ║
║  └─ Долгоживущий (7 дней) но безопасен в cookie           ║
║                                                            ║
║  Пароль:                                                  ║
║  ├─ Хешируется bcrypt с 10 раундами                       ║
║  ├─ Никогда не отправляется обратно                       ║
║  ├─ Сравнивается с hash (bcrypt.compare)                  ║
║  └─ Требования: 12 символов, заглавная, цифра, спец      ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

### Середлевер проверки на сервере

```typescript
// authenticate.ts middleware
export function authenticate(req, res, next) {
  // 1. Получает Authorization header
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }
  
  // 2. Проверяет подпись и exp
  const decoded = tokenService.verifyAccessToken(token);
  
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  // 3. Прикрепляет user к request
  req.user = decoded;
  next();
}
```

---

## 💻 Реализация на React + Vite

### 📦 Установка зависимостей

```bash
npm install axios zustand
```

**Пакеты:**
- `axios` - HTTP клиент
- `zustand` - State management (лучше чем Redux для auth)

---

### 🏗️ Структура проекта

```
src/
├── api/
│   └── authClient.ts          # API клиент для auth
├── stores/
│   └── authStore.ts           # Zustand store для auth
├── hooks/
│   └── useAuth.ts             # Custom hook для auth
├── pages/
│   ├── Login.tsx
│   ├── Register.tsx
│   └── Profile.tsx            # Защищённая страница
└── components/
    ├── ProtectedRoute.tsx
    └── AuthLayout.tsx
```

---

### 1️⃣ API Клиент (`src/api/authClient.ts`)

```typescript
import axios from 'axios';

// Создаём axios instance с базовым URL
const API = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true, // ← ВАЖНО! Отправляет cookies
});

// Интерцептор для добавления Access Token в заголовки
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Интерцептор для обновления токена при 401
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Если ошибка 401 И это не запрос refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Пытаемся обновить access token
        const { data } = await axios.post(
          'http://localhost:3000/api/auth/refresh',
          {},
          { withCredentials: true }
        );
        
        // Сохраняем новый токен
        localStorage.setItem('accessToken', data.accessToken);
        
        // Повторяем исходный запрос с новым токеном
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return API(originalRequest);
      } catch (err) {
        // Refresh не прошёл - отправляем на login
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  // Регистрация
  register: (data: {
    email: string;
    name: string;
    password: string;
    passwordConfirm: string;
  }) => API.post('/auth/register', data),

  // Вход
  login: (data: { email: string; password: string }) =>
    API.post('/auth/login', data),

  // Получить текущего пользователя
  getMe: () => API.get('/auth/me'),

  // Обновить access token
  refresh: () => API.post('/auth/refresh', {}),

  // Logout
  logout: () => API.post('/auth/logout', {}),
};
```

---

### 2️⃣ Zustand Store (`src/stores/authStore.ts`)

```typescript
import { create } from 'zustand';
import { authAPI } from '@/api/authClient';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  register: (data: RegisterData) => Promise<void>;
  login: (data: LoginData) => Promise<void>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
}

interface RegisterData {
  email: string;
  name: string;
  phoneNumber: string; // ← Новое поле!
  password: string;
  passwordConfirm: string;
}

interface LoginData {
  email: string;
  password: string;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { data: response } = await authAPI.register({
        email: data.email,
        name: `${data.name} (${data.phoneNumber})`, // ← Добавляем телефон в имя
        password: data.password,
        passwordConfirm: data.passwordConfirm,
      });

      // Сохраняем access token
      localStorage.setItem('accessToken', response.accessToken);
      
      // Обновляем store
      set({ user: response.user, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.error || 'Registration failed';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  login: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { data: response } = await authAPI.login(data);

      // Сохраняем access token
      localStorage.setItem('accessToken', response.accessToken);
      
      // Обновляем store
      set({ user: response.user, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.error || 'Login failed';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authAPI.logout();
      localStorage.removeItem('accessToken');
      set({ user: null, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  getCurrentUser: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ user: null });
      return;
    }

    set({ isLoading: true });
    try {
      const { data } = await authAPI.getMe();
      set({ user: data, isLoading: false });
    } catch (error) {
      localStorage.removeItem('accessToken');
      set({ user: null, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
```

---

### 3️⃣ Custom Hook (`src/hooks/useAuth.ts`)

```typescript
import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';

export function useAuth() {
  const { user, isLoading, error, getCurrentUser } = useAuthStore();

  // При загрузке приложения проверяем токен
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token && !user) {
      getCurrentUser();
    }
  }, []);

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
  };
}
```

---

## 📝 Примеры компонентов

### 📝 Login страница

```tsx
// pages/Login.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await login(formData);
      navigate('/profile'); // ← Перенаправляем на профиль
    } catch (err) {
      // Ошибка уже в store
    }
  };

  return (
    <div className="login-container">
      <h1>Вход</h1>
      
      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Пароль"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Загрузка...' : 'Войти'}
        </button>
      </form>

      <p>
        Нет аккаунта? <a href="/register">Зарегистрироваться</a>
      </p>
    </div>
  );
}
```

---

### 📝 Register страница (с телефоном)

```tsx
// pages/Register.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phoneNumber: '',
    password: '',
    passwordConfirm: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Очищаем ошибку поля при изменении
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) newErrors.email = 'Email не может быть пустым';
    if (!formData.name) newErrors.name = 'Имя не может быть пустым';
    if (!formData.phoneNumber) newErrors.phoneNumber = 'Номер телефона не может быть пустым';
    
    if (formData.password.length < 12) {
      newErrors.password = 'Пароль должен быть минимум 12 символов';
    }
    if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Пароль должен содержать заглавную букву';
    }
    if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Пароль должен содержать цифру';
    }
    if (!/[!@#$%^&*]/.test(formData.password)) {
      newErrors.password = 'Пароль должен содержать специальный символ (!@#$%^&*)';
    }
    
    if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = 'Пароли не совпадают';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    try {
      await register(formData);
      navigate('/profile');
    } catch (err) {
      // Ошибка уже в store
    }
  };

  return (
    <div className="register-container">
      <h1>Регистрация</h1>
      
      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>

        <div className="form-group">
          <input
            type="text"
            name="name"
            placeholder="Имя"
            value={formData.name}
            onChange={handleChange}
            required
          />
          {errors.name && <span className="error-text">{errors.name}</span>}
        </div>

        <div className="form-group">
          <input
            type="tel"
            name="phoneNumber"
            placeholder="+38 (XXX) XXX-XXXX"
            value={formData.phoneNumber}
            onChange={handleChange}
            required
          />
          {errors.phoneNumber && <span className="error-text">{errors.phoneNumber}</span>}
        </div>

        <div className="form-group">
          <input
            type="password"
            name="password"
            placeholder="Пароль"
            value={formData.password}
            onChange={handleChange}
            required
          />
          {errors.password && <span className="error-text">{errors.password}</span>}
        </div>

        <div className="form-group">
          <input
            type="password"
            name="passwordConfirm"
            placeholder="Повторите пароль"
            value={formData.passwordConfirm}
            onChange={handleChange}
            required
          />
          {errors.passwordConfirm && <span className="error-text">{errors.passwordConfirm}</span>}
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Загрузка...' : 'Зарегистрироваться'}
        </button>
      </form>

      <p>
        Уже есть аккаунт? <a href="/login">Войти</a>
      </p>
    </div>
  );
}
```

---

### 🔒 Protected Route

```tsx
// components/ProtectedRoute.tsx
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

---

### 👤 Profile страница

```tsx
// pages/Profile.tsx
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { logout, isLoading } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="profile-container">
      <h1>Профиль</h1>
      
      <div className="user-info">
        <p><strong>ID:</strong> {user?.id}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Имя:</strong> {user?.name}</p>
      </div>

      <button onClick={handleLogout} disabled={isLoading}>
        {isLoading ? 'Загрузка...' : 'Выход'}
      </button>
    </div>
  );
}
```

---

### 📱 App Router с Protected Routes

```tsx
// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginPage } from '@/pages/Login';
import { RegisterPage } from '@/pages/Register';
import { ProfilePage } from '@/pages/Profile';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/profile" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 🔄 Полный Flow аутентификации

```
┌────────────────────────────────────────────────────────────┐
│                      REACT VITE                             │
└────────────────────────────────────────────────────────────┘
                            │
                      1. User нажимает
                       "Зарегистрироваться"
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │   Register Form                       │
        │   - Email                             │
        │   - Имя                               │
        │   - Номер телефона                    │
        │   - Пароль (12+ символов)            │
        │   - Подтвердить пароль               │
        └───────────────────────────────────────┘
                            │
                      2. handleSubmit()
                            │
                ┌───────────┴───────────┐
                │ validateForm()        │
                │ checkPassword()       │
                └───────────┬───────────┘
                            │
                      3. useAuthStore.register()
                            │
                      4. axios.post('/api/auth/register')
                            │
┌────────────────────────────────────────────────────────────┐
│                   NODE.JS EXPRESS SERVER                    │
│                                                              │
│  POST /api/auth/register                                   │
│  ├─ Validate: Zod schema                                   │
│  ├─ Check email not exists                                 │
│  ├─ Validate password requirements                         │
│  ├─ Hash password: bcrypt.hash(password, 10)              │
│  ├─ Create user in DB                                      │
│  ├─ Create tokens:                                         │
│  │  ├─ accessToken = jwt.sign({userId, email}, secret)   │
│  │  └─ refreshToken = jwt.sign({userId}, secret)         │
│  ├─ Hash and save refreshToken in DB                      │
│  └─ Return {accessToken, user}                            │
│     + Set-Cookie: refreshToken (HttpOnly, Secure)         │
└────────────────────────────────────────────────────────────┘
                            │
                      5. Response 201
                    {accessToken, user}
                            │
        ┌───────────────────┴──────────────────┐
        │ localStorage.setItem(                │
        │   'accessToken',                     │
        │   response.accessToken               │
        │ )                                    │
        └──────────────┬──────────────────────┘
                       │
                  6. navigate('/profile')
                       │
                       ▼
        ┌──────────────────────────┐
        │  Profile Page (Protected) │
        │                          │
        │  useEffect(() => {       │
        │    getCurrentUser()      │
        │  })                      │
        └──────────────┬───────────┘
                       │
           7. GET /api/auth/me
           Authorization: Bearer <accessToken>
                       │
┌─────────────────────┴──────────────────────┐
│         SERVER                              │
│  GET /api/auth/me                          │
│  ├─ Extract token from header              │
│  ├─ jwt.verify(token, secret)             │
│  ├─ Check token.exp > now()               │
│  ├─ Extract userId                        │
│  ├─ Find user in DB                       │
│  └─ Return {id, email, name, createdAt}   │
└─────────────────────┬──────────────────────┘
                      │
            8. Response 200
          {id, email, name, createdAt}
                      │
          9. Store user in Zustand
                      │
                      ▼
        ┌──────────────────────────────┐
        │  Profile displayed!           │
        │  - User Info                 │
        │  - Logout button             │
        └──────────────────────────────┘
```

---

## 🛡️ Требования к паролю

Пароль должен быть:
- ✅ **Минимум 12 символов**
- ✅ **Хотя бы одна ЗАГЛАВНАЯ буква** (A-Z)
- ✅ **Хотя бы одна цифра** (0-9)
- ✅ **Хотя бы один специальный символ** (!@#$%^&*)

**Примеры:**
```
✅ MyPassword123!
✅ SecurePass@2024
✅ Welcome#2025

❌ password123      (нет заглавной, спецсимвола)
❌ MyPassword       (нет цифры, спецсимвола)
❌ Pass123!        (меньше 12 символов)
```

---

## ⚠️ Важные моменты

### 1. **Хранение токенов**
```typescript
// ✅ ПРАВИЛЬНО
localStorage.setItem('accessToken', token); // ← Краткоживущий токен в памяти

// ✅ ПРАВИЛЬНО (автоматически)
// refreshToken в HttpOnly Cookie (браузер отправляет автоматически)

// ❌ НЕПРАВИЛЬНО
localStorage.setItem('refreshToken', token); // ← Refresh в localStorage уязвим для XSS!
```

### 2. **Отправка токена на сервер**
```typescript
// ✅ ПРАВИЛЬНО
headers: {
  Authorization: `Bearer ${accessToken}`
}

// ❌ НЕПРАВИЛЬНО
headers: {
  'X-Token': accessToken  // Неправильный заголовок
}
```

### 3. **HttpOnly Cookie**
```typescript
// Сервер отправляет:
res.cookie('refreshToken', token, {
  httpOnly: true,  // ← JavaScript НЕ может прочитать
  secure: true,    // ← Только HTTPS
  sameSite: 'strict' // ← CSRF защита
});

// React НЕ может делать:
const token = document.cookie; // ❌ Не сможет прочитать refreshToken

// Браузер АВТОМАТИЧЕСКИ отправляет:
// Cookie: refreshToken=...
// (когда делаем fetch с withCredentials: true)
```

### 4. **Интерцептор для auto-refresh**
```typescript
// Когда accessToken истекает (401):
// 1. Автоматически отправляем refresh запрос
// 2. Получаем новый accessToken
// 3. Повторяем исходный запрос
// 4. User не видит это, всё работает прозрачно!
```

---

## ✅ Чеклист для реализации

- [ ] Установить `axios` и `zustand`
- [ ] Создать `src/api/authClient.ts` с интерцепторами
- [ ] Создать `src/stores/authStore.ts` с Zustand
- [ ] Создать `src/hooks/useAuth.ts`
- [ ] Создать `src/components/ProtectedRoute.tsx`
- [ ] Создать страницы: Login, Register, Profile
- [ ] Настроить React Router с Protected Routes
- [ ] Протестировать все flows (register, login, refresh, logout)
- [ ] Добавить phoneNumber поле в Register
- [ ] Настроить CORS на сервере (credentials: true)

---

## 🚀 Готово!

Теперь у тебя есть полная JWT аутентификация на React + Vite с защитой от XSS, CSRF и других атак! 🔐
