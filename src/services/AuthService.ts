// src/services/AuthService.ts
import type { IUserRepository } from '@/types';
import type { LoginDTO, RegisterDTO, AuthResponse } from '@/types';
import { PasswordService } from './PasswordService';
import { TokenService } from './TokenService';
import bcrypt from 'bcrypt';
import { prisma } from '@/prisma/client';

export class AuthService {
  private userRepository: IUserRepository;
  private passwordService: PasswordService;
  private tokenService: TokenService;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
    this.passwordService = new PasswordService();
    this.tokenService = new TokenService();
  }

  /**
   * Регистрация нового пользователя
   */
  async register(data: RegisterDTO): Promise<AuthResponse> {
    // 1. Проверяем что пароли совпадают
    if (data.password !== data.passwordConfirm) {
      throw new Error('Passwords do not match');
    }

    // 2. Валидируем требования к паролю
    const passwordValidation = this.passwordService.validatePassword(data.password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    // 3. Проверяем что email уже не зарегистрирован
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // 4. Хешируем пароль
    const hashedPassword = await this.passwordService.hashPassword(data.password);

    // 5. Создаём пользователя с дополнительными полями
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        phoneNumber: data.phoneNumber || null,
        role: data.role !== undefined ? data.role : 0,
        group: data.group || null,
      },
    });

    // 6. Создаём токены
    const accessToken = this.tokenService.createAccessToken(user.id, user.email);
    const refreshToken = this.tokenService.createRefreshToken(user.id);

    // 7. Сохраняем refresh token в БД (хешированный!)
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 дней

    await prisma.refreshToken.create({
      data: {
        token: hashedRefreshToken,
        userId: user.id,
        expiresAt,
        isRevoked: false,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  /**
   * Вход в систему
   */
  async login(data: LoginDTO): Promise<AuthResponse> {
    // 1. Находим пользователя по email
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // 2. Проверяем пароль
    const isPasswordValid = await this.passwordService.verifyPassword(data.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // 3. Создаём токены
    const accessToken = this.tokenService.createAccessToken(user.id, user.email);
    const refreshToken = this.tokenService.createRefreshToken(user.id);

    // 4. Сохраняем refresh token в БД (хешированный!)
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 дней

    // 5. Отозываем старый refresh token (если есть)
    await prisma.refreshToken.updateMany({
      where: { userId: user.id, isRevoked: false },
      data: { isRevoked: true },
    });

    // 6. Создаём новый refresh token
    await prisma.refreshToken.create({
      data: {
        token: hashedRefreshToken,
        userId: user.id,
        expiresAt,
        isRevoked: false,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  /**
   * Обновление Access Token через Refresh Token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    // 1. Верифицируем refresh token
    const decoded = this.tokenService.verifyRefreshToken(refreshToken);
    if (!decoded) {
      throw new Error('Invalid refresh token');
    }

    // 2. Находим пользователя
    const user = await this.userRepository.findById(decoded.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // 3. Проверяем что refresh token в БД и не отозван
    const storedTokens = await prisma.refreshToken.findMany({
      where: {
        userId: decoded.userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    // 4. Проверяем что переданный токен совпадает с одним из сохранённых
    let tokenFound = false;
    for (const storedToken of storedTokens) {
      const isMatch = await bcrypt.compare(refreshToken, storedToken.token);
      if (isMatch) {
        tokenFound = true;
        break;
      }
    }

    if (!tokenFound) {
      throw new Error('Refresh token not found or revoked');
    }

    // 5. Создаём новый access token
    const newAccessToken = this.tokenService.createAccessToken(user.id, user.email);

    return {
      accessToken: newAccessToken,
    };
  }

  /**
   * Logout - отозвать refresh token
   */
  async logout(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  /**
   * Получить пользователя по токену
   */
  async getUserFromToken(accessToken: string): Promise<any> {
    const decoded = this.tokenService.verifyAccessToken(accessToken);
    if (!decoded) {
      throw new Error('Invalid token');
    }

    const user = await this.userRepository.findById(decoded.userId);
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}
