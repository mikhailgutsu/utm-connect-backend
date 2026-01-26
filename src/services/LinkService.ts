// src/services/LinkService.ts
import type { ILinkRepository, LinkEntity, CreateLinkDTO } from '@/types';

export class LinkService {
  constructor(private linkRepository: ILinkRepository) {}

  async createLink(data: CreateLinkDTO): Promise<LinkEntity> {
    const existingLink = await this.linkRepository.findByShortCode(data.shortCode);
    if (existingLink) {
      throw new Error('Short code already exists');
    }
    return this.linkRepository.create(data);
  }

  async getLinkByShortCode(shortCode: string): Promise<LinkEntity> {
    const link = await this.linkRepository.findByShortCode(shortCode);
    if (!link) {
      throw new Error('Link not found');
    }
    return link;
  }

  async getUserLinks(userId: string): Promise<LinkEntity[]> {
    return this.linkRepository.findByUserId(userId);
  }

  async recordClick(shortCode: string): Promise<void> {
    const link = await this.getLinkByShortCode(shortCode);
    await this.linkRepository.incrementClicks(link.id);
  }

  async deleteLink(id: string): Promise<void> {
    await this.linkRepository.delete(id);
  }
}
