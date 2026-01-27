// src/routes/users.ts
import express from 'express';
import { UserService } from '@/services';
import { UserRepository } from '@/repositories';
import { authenticate } from '@/middleware/authenticate';
import { z } from 'zod';

const router = express.Router();
const userRepository = new UserRepository();
const userService = new UserService(userRepository);

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6),
});

/**
 * POST /api/users
 * Создать нового пользователя
 */
router.post('/', async (req, res) => {
  try {
    const data = CreateUserSchema.parse(req.body);
    const user = await userService.createUser(data);
    res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
    } else {
      res.status(400).json({ error: (error as Error).message });
    }
  }
});

/**
 * GET /api/users
 * Получить список всех пользователей (пароль не возвращаем)
 */
router.get('/', async (_req, res) => {
  try {
    const users = await userService.getAllUsers();
    const safeUsers = users.map(({ password, ...rest }) => rest);
    res.json(safeUsers);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/users/:id
 * Получить пользователя по ID
 */
router.get('/:id', async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json(user);
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/users/info/:id
 * Получить полную информацию о пользователе
 * Включает: друзей, группы, фотографии, посты и т.д.
 */
router.get('/info/:id', async (req, res) => {
  try {
    const userInfo = await userService.getUserInfo(req.params.id);
    res.json(userInfo);
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/users/me/info
 * Получить полную информацию о текущем авторизованном пользователе
 */
router.get('/me/info', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const userInfo = await userService.getUserInfo(userId);
    res.json(userInfo);
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
});

export default router;
