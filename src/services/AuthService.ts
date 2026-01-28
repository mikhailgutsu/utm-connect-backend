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
   * Register a new user
   */
  async register(data: RegisterDTO): Promise<AuthResponse> {
    // 1. Check that passwords match
    if (data.password !== data.passwordConfirm) {
      throw new Error('Passwords do not match');
    }

    // 2. Validate password requirements
    const passwordValidation = this.passwordService.validatePassword(data.password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    // 3. Check that email is not already registered
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // 4. Hash password
    const hashedPassword = await this.passwordService.hashPassword(data.password);

    // 5. Create user with additional fields
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        phoneNumber: data.phoneNumber || null,
        // Support both fields: universityGroup and alias group
        universityGroup: data.universityGroup || data.group || null,
        role: data.role !== undefined ? data.role : 0,
        friends: [],
        friendRequestsSent: [],
        friendRequestsReceived: [],
        groupIds: [],
        postIds: [],
        photoUrl: [],
        primaryPhotoUrl: null,
      },
    });

    // 6. Create tokens
    const accessToken = this.tokenService.createAccessToken(user.id, user.email);
    const refreshToken = this.tokenService.createRefreshToken(user.id);

    // 7. Save hashed refresh token to DB
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

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
   * Login to system
   */
  async login(data: LoginDTO): Promise<AuthResponse> {
    // 1. Find user by email
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // 2. Verify password
    const isPasswordValid = await this.passwordService.verifyPassword(data.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // 3. Create tokens
    const accessToken = this.tokenService.createAccessToken(user.id, user.email);
    const refreshToken = this.tokenService.createRefreshToken(user.id);

    // 4. Save hashed refresh token to DB
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // 5. Revoke old refresh token (if any)
    await prisma.refreshToken.updateMany({
      where: { userId: user.id, isRevoked: false },
      data: { isRevoked: true },
    });

    // 6. Create new refresh token
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
   * Refresh Access Token using Refresh Token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    // 1. Verify refresh token
    const decoded = this.tokenService.verifyRefreshToken(refreshToken);
    if (!decoded) {
      throw new Error('Invalid refresh token');
    }

    // 2. Find user
    const user = await this.userRepository.findById(decoded.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // 3. Check that refresh token is in DB and not revoked
    const storedTokens = await prisma.refreshToken.findMany({
      where: {
        userId: decoded.userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    // 4. Check that provided token matches one of the saved tokens
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

    // 5. Create new access token
    const newAccessToken = this.tokenService.createAccessToken(user.id, user.email);

    return {
      accessToken: newAccessToken,
    };
  }

  /**
   * Logout - revoke refresh token
   */
  async logout(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  /**
   * Get user from token
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
