// src/services/CampaignService.ts
import type { ICampaignRepository, CampaignEntity, CreateCampaignDTO } from '@/types';

export class CampaignService {
  constructor(private campaignRepository: ICampaignRepository) {}

  async createCampaign(data: CreateCampaignDTO): Promise<CampaignEntity> {
    return this.campaignRepository.create(data);
  }

  async getCampaignById(id: string): Promise<CampaignEntity> {
    const campaign = await this.campaignRepository.findById(id);
    if (!campaign) {
      throw new Error('Campaign not found');
    }
    return campaign;
  }

  async getUserCampaigns(userId: string): Promise<CampaignEntity[]> {
    return this.campaignRepository.findByUserId(userId);
  }

  async updateCampaign(id: string, data: Partial<CampaignEntity>): Promise<CampaignEntity> {
    return this.campaignRepository.update(id, data);
  }

  async deleteCampaign(id: string): Promise<void> {
    await this.campaignRepository.delete(id);
  }
}
