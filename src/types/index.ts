// src/types/index.ts
export interface IUserRepository {
  create(data: CreateUserDTO): Promise<UserEntity>;
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  update(id: string, data: Partial<UserEntity>): Promise<UserEntity>;
  delete(id: string): Promise<void>;
}

export interface ICampaignRepository {
  create(data: CreateCampaignDTO): Promise<CampaignEntity>;
  findById(id: string): Promise<CampaignEntity | null>;
  findByUserId(userId: string): Promise<CampaignEntity[]>;
  update(id: string, data: Partial<CampaignEntity>): Promise<CampaignEntity>;
  delete(id: string): Promise<void>;
}

export interface ILinkRepository {
  create(data: CreateLinkDTO): Promise<LinkEntity>;
  findById(id: string): Promise<LinkEntity | null>;
  findByShortCode(shortCode: string): Promise<LinkEntity | null>;
  findByUserId(userId: string): Promise<LinkEntity[]>;
  incrementClicks(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}

// Entities
export interface UserEntity {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefreshTokenEntity {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
}

export interface CampaignEntity {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LinkEntity {
  id: string;
  originalUrl: string;
  shortCode: string;
  campaignId: string | null;
  userId: string;
  createdAt: Date;
  clicks: number;
}

// DTOs
export interface CreateUserDTO {
  email: string;
  name: string;
  password: string;
}

export interface CreateCampaignDTO {
  name: string;
  description?: string;
  userId: string;
}

export interface CreateLinkDTO {
  originalUrl: string;
  shortCode: string;
  campaignId?: string;
  userId: string;
}

// Auth DTOs
export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  email: string;
  name: string;
  phoneNumber?: string;
  password: string;
  passwordConfirm: string;
  role?: number;        // 0 = Студент, 1 = Профессор, 2 = Админ
  group?: string;       // CR-211 (только для студентов)
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface TokenPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}
