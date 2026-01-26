// src/repositories/UserRepository.ts
import { prisma } from '@/prisma/client';
import type { IUserRepository, UserEntity, CreateUserDTO } from '@/types';

export class UserRepository implements IUserRepository {
  async create(data: CreateUserDTO): Promise<UserEntity> {
    return prisma.user.create({
      data,
    });
  }

  async findById(id: string): Promise<UserEntity | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, data: Partial<UserEntity>): Promise<UserEntity> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }
}
