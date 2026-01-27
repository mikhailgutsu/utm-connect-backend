import { prisma } from '@/prisma/client';
import type { IGroupRepository, GroupEntity } from '@/types';

export interface CreateGroupDTO {
  name: string;
  userIds?: string[];
}

export class GroupRepository implements IGroupRepository {
  async create(data: CreateGroupDTO): Promise<GroupEntity> {
    return prisma.group.create({
      data: {
        name: data.name,
        userIds: data.userIds || [],
      },
    });
  }

  async findById(id: string): Promise<GroupEntity | null> {
    return prisma.group.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: Partial<GroupEntity>): Promise<GroupEntity> {
    return prisma.group.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.group.delete({
      where: { id },
    });
  }
}
