// src/repositories/LinkRepository.ts
import { prisma } from '@/prisma/client';
import type { ILinkRepository, LinkEntity, CreateLinkDTO } from '@/types';

export class LinkRepository implements ILinkRepository {
  async create(data: CreateLinkDTO): Promise<LinkEntity> {
    return prisma.link.create({
      data,
    });
  }

  async findById(id: string): Promise<LinkEntity | null> {
    return prisma.link.findUnique({
      where: { id },
    });
  }

  async findByShortCode(shortCode: string): Promise<LinkEntity | null> {
    return prisma.link.findUnique({
      where: { shortCode },
    });
  }

  async findByUserId(userId: string): Promise<LinkEntity[]> {
    return prisma.link.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async incrementClicks(id: string): Promise<void> {
    await prisma.link.update({
      where: { id },
      data: { clicks: { increment: 1 } },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.link.delete({
      where: { id },
    });
  }
}
