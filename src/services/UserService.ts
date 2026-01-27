// src/services/UserService.ts
import type { IUserRepository, UserEntity, CreateUserDTO } from '@/types';

export interface UserInfoDTO {
  id: string;
  email: string;
  name: string;
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

export class UserService {
  constructor(private userRepository: IUserRepository) {}

  async createUser(data: CreateUserDTO): Promise<UserEntity> {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    return this.userRepository.create(data);
  }

  async getUserById(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async getUserByEmail(email: string): Promise<UserEntity> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async getAllUsers(): Promise<UserEntity[]> {
    return this.userRepository.findAll();
  }

  async getUserInfo(userId: string): Promise<UserInfoDTO> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phoneNumber: user.phoneNumber,
      universityGroup: user.universityGroup,
      role: user.role,
      friends: user.friends,
      groupIds: user.groupIds,
      postIds: user.postIds,
      photoUrl: user.photoUrl,
      primaryPhotoUrl: user.primaryPhotoUrl,
      joinedAt: user.joinedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateUser(id: string, data: Partial<UserEntity>): Promise<UserEntity> {
    return this.userRepository.update(id, data);
  }

  async deleteUser(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }
}
