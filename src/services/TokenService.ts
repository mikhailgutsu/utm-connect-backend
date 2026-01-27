import jwt from 'jsonwebtoken';
import { config } from '@/config/env';
import type { TokenPayload } from '@/types';

export class TokenService {
  /**
   * Create Access Token (short-lived)
   */
  createAccessToken(userId: string, email: string): string {
    const payload = {
      userId,
      email,
    };

    return jwt.sign(
      payload,
      config.jwtSecret as string,
      {
        expiresIn: config.jwtAccessExpiry,
        issuer: 'utm-connect',
      } as any
    );
  }

  /**
   * Create Refresh Token (long-lived)
   */
  createRefreshToken(userId: string): string {
    const payload = {
      userId,
      type: 'refresh',
    };

    return jwt.sign(
      payload,
      config.jwtRefreshSecret as string,
      {
        expiresIn: config.jwtRefreshExpiry,
        issuer: 'utm-connect',
      } as any
    );
  }

  /**
   * Verify and decode Access Token
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
   * Verify and decode Refresh Token
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
   * Decode token WITHOUT signature verification (for debugging)
   */
  decodeToken(token: string): any {
    return jwt.decode(token);
  }
}
