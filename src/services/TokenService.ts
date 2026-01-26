// src/services/TokenService.ts
import jwt from 'jsonwebtoken';
import { config } from '@/config/env';
import type { TokenPayload } from '@/types';

export class TokenService {
  /**
   * Создаёт Access Token (короткоживущий)
   */
  createAccessToken(userId: string, email: string): string {
    const payload = {
      userId,
      email,
    };

    return jwt.sign(payload, config.jwtSecret as string, {
      expiresIn: config.jwtAccessExpiry,
      issuer: 'utm-connect',
    } as any);
  }

  /**
   * Создаёт Refresh Token (долгоживущий)
   */
  createRefreshToken(userId: string): string {
    const payload = {
      userId,
      type: 'refresh',
    };

    return jwt.sign(payload, config.jwtRefreshSecret as string, {
      expiresIn: config.jwtRefreshExpiry,
      issuer: 'utm-connect',
    } as any);
  }

  /**
   * Верифицирует и декодирует Access Token
   */
  verifyAccessToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Верифицирует и декодирует Refresh Token
   */
  verifyRefreshToken(token: string): { userId: string; type: string } | null {
    try {
      const decoded = jwt.verify(token, config.jwtRefreshSecret) as {
        userId: string;
        type: string;
      };
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Декодирует токен БЕЗ проверки подписи (для отладки)
   */
  decodeToken(token: string): any {
    return jwt.decode(token);
  }
}
