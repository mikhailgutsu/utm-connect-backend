// src/routes/auth.ts
import express from 'express';
import { AuthService } from '@/services';
import { UserRepository } from '@/repositories';
import { authenticate, getCurrentUser } from '@/middleware/authenticate';
import { z } from 'zod';

const router = express.Router();
const userRepository = new UserRepository();
const authService = new AuthService(userRepository);

// Schemas для валидации
const RegisterSchema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(1, 'Name is required'),
  phoneNumber: z.string().optional(),
  password: z.string().min(12, 'Password must be at least 12 characters'),
  passwordConfirm: z.string(),
  role: z.number().min(0).max(2).optional().default(0), // 0=Студент, 1=Профессор, 2=Админ
  group: z.string().optional(), // CR-211
});

const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

const RefreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * POST /api/auth/register
 * Регистрация нового пользователя
 */
router.post('/register', async (req, res) => {
  try {
    // Валидируем входные данные
    const data = RegisterSchema.parse(req.body);

    // Регистрируем пользователя
    const result = await authService.register(data);

    // Отправляем refresh token в HttpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS только в production
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
      path: '/',
    });

    // Отправляем ответ (без refresh token в body)
    res.status(201).json({
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
    } else {
      res.status(400).json({ error: (error as Error).message });
    }
  }
});

/**
 * POST /api/auth/login
 * Вход в систему
 */
router.post('/login', async (req, res) => {
  try {
    // Валидируем входные данные
    const data = LoginSchema.parse(req.body);

    // Проверяем учётные данные
    const result = await authService.login(data);

    // Отправляем refresh token в HttpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
      path: '/',
    });

    // Отправляем ответ (без refresh token в body)
    res.status(200).json({
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
    } else {
      res.status(400).json({ error: (error as Error).message });
    }
  }
});

/**
 * POST /api/auth/refresh
 * Обновление access token через refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    // Валидируем входные данные
    const data = RefreshSchema.parse(req.body);

    // Обновляем access token
    const result = await authService.refreshAccessToken(data.refreshToken);

    res.status(200).json({
      accessToken: result.accessToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
    } else {
      res.status(401).json({ error: (error as Error).message });
    }
  }
});

/**
 * POST /api/auth/logout
 * Выход из системы (отозвать refresh token)
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    const user = getCurrentUser(req);

    // Отозываем refresh token
    await authService.logout(user.userId);

    // Удаляем cookie
    res.clearCookie('refreshToken', { path: '/' });

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/auth/me
 * Получить информацию о текущем пользователе
 */
router.get('/me', authenticate, async (req, res): Promise<void> => {
  try {
    const user = getCurrentUser(req);

    // Получаем полную информацию о пользователе
    const fullUser = await userRepository.findById(user.userId);
    if (!fullUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Возвращаем все поля кроме пароля
    const { password, ...userWithoutPassword } = fullUser;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
