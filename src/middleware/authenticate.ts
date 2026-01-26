// src/middleware/authenticate.ts
import express from 'express';
import { TokenService } from '@/services';
import type { TokenPayload } from '@/types';

const tokenService = new TokenService();

/**
 * Middleware для проверки JWT токена в Authorization заголовке
 * 
 * Использование:
 * app.get('/api/protected', authenticate, (req, res) => { ... })
 */
export const authenticate = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void => {
  try {
    // 1. Получаем Authorization заголовок
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      res.status(401).json({ error: 'No authorization header provided' });
      return;
    }

    // 2. Извлекаем токен из "Bearer TOKEN"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({ error: 'Invalid authorization header format' });
      return;
    }

    const token = parts[1];

    // 3. Верифицируем токен
    const decoded = tokenService.verifyAccessToken(token);
    if (!decoded) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }

    // 4. Прикрепляем информацию о пользователе к request
    (req as any).user = decoded;

    next();
  } catch (error) {
    res.status(403).json({ error: 'Token verification failed' });
  }
};

/**
 * Получить текущего пользователя из request
 */
export const getCurrentUser = (req: express.Request): TokenPayload => {
  return (req as any).user;
};
