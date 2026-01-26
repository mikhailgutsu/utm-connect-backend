// src/repositories/CampaignRepository.ts
import { prisma } from '@/prisma/client';
import type { ICampaignRepository, CampaignEntity, CreateCampaignDTO } from '@/types';

export class CampaignRepository implements ICampaignRepository {
  async create(data: CreateCampaignDTO): Promise<CampaignEntity> {
    return prisma.campaign.create({
      data,
    });
  }

  async findById(id: string): Promise<CampaignEntity | null> {
    return prisma.campaign.findUnique({
      where: { id },
    });
  }

  async findByUserId(userId: string): Promise<CampaignEntity[]> {
    return prisma.campaign.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: Partial<CampaignEntity>): Promise<CampaignEntity> {
    return prisma.campaign.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.campaign.delete({
      where: { id },
    });
  }
}
