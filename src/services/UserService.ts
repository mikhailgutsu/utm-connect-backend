// src/services/UserService.ts
import type { IUserRepository, UserEntity, CreateUserDTO } from '@/types';

export class UserService {
  constructor(private userRepository: IUserRepository) {}

  async createUser(data: CreateUserDTO): Promise<UserEntity> {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    // TODO: hash password before saving
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

  async updateUser(id: string, data: Partial<UserEntity>): Promise<UserEntity> {
    return this.userRepository.update(id, data);
  }

  async deleteUser(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }
}
