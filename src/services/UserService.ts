// src/services/UserService.ts
import type { IUserRepository, UserEntity, CreateUserDTO } from '@/types';
import { prisma } from '@/prisma/client';

export interface UserInfoDTO {
  id: string;
  email: string;
  name: string;
  role: number;        // 0 = студент, 1 = преподаватель, 2 = админ
  group: string | null; // CR-211
  friends: string[];   // Список ID друзей
  groupIds: string[];  // ID групп, в которых участвует
  photoIds: string[];  // ID фотографий профиля
  postIds: string[];   // ID постов на стене
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

  /**
   * Получить полную информацию о пользователе
   * Включает: основную инфо, друзей, группы, фотографии, посты
   */
  async getUserInfo(userId: string): Promise<UserInfoDTO> {
    // Получаем основную информацию пользователя
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        group: true,
        // Друзья (через отношение friendOf)
        friends: {
          select: { friendId: true },
        },
        // Группы, в которых участвует
        groupMemberships: {
          select: { groupId: true },
        },
        // Фотографии профиля
        profilePhotos: {
          select: { id: true },
        },
        // Посты на стене
        wallPosts: {
          select: { id: true },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Формируем ответ в нужном формате
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      group: user.group,
      friends: user.friends.map((f) => f.friendId),
      groupIds: user.groupMemberships.map((gm) => gm.groupId),
      photoIds: user.profilePhotos.map((p) => p.id),
      postIds: user.wallPosts.map((p) => p.id),
    };
  }

  async updateUser(id: string, data: Partial<UserEntity>): Promise<UserEntity> {
    return this.userRepository.update(id, data);
  }

  async deleteUser(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }
}
