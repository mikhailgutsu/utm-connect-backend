// src/types/index.ts
export interface IUserRepository {
  create(data: CreateUserDTO): Promise<UserEntity>;
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findAll(): Promise<UserEntity[]>;
  update(id: string, data: Partial<UserEntity>): Promise<UserEntity>;
  delete(id: string): Promise<void>;
}

export interface IGroupRepository {
  create(data: CreateGroupDTO): Promise<GroupEntity>;
  findById(id: string): Promise<GroupEntity | null>;
  update(id: string, data: Partial<GroupEntity>): Promise<GroupEntity>;
  delete(id: string): Promise<void>;
}

export interface IPostRepository {
  create(data: CreatePostDTO): Promise<PostEntity>;
  findById(id: string): Promise<PostEntity | null>;
  update(id: string, data: Partial<PostEntity>): Promise<PostEntity>;
  delete(id: string): Promise<void>;
}

// Entities
export interface UserEntity {
  id: string;
  email: string;
  name: string;
  password: string;
  phoneNumber: string | null;
  universityGroup: string | null;
  role: number;
  friends: string | null;
  groupIds: string[];
  postIds: string[];
  photoUrl: string | null;
  primaryPhotoUrl: string | null;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupEntity {
  id: string;
  name: string;
  userIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PostEntity {
  id: string;
  imageUrls: string[];
  likes: string[];
  comments: any;
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

// DTOs
export interface CreateUserDTO {
  email: string;
  name: string;
  password: string;
  phoneNumber?: string;
  universityGroup?: string;
  role?: number;
}

export interface CreateGroupDTO {
  name: string;
  userIds?: string[];
}

export interface CreatePostDTO {
  imageUrls?: string[];
  likes?: string[];
  comments?: any;
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
  role?: number;
  universityGroup?: string;
  // alias для удобства фронта
  group?: string;
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
