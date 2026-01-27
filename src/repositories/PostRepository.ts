import { prisma } from '@/prisma/client';
import type { IPostRepository, PostEntity } from '@/types';

export interface CreatePostDTO {
  imageUrls?: string[];
  likes?: string[];
  comments?: any;
}

export class PostRepository implements IPostRepository {
  async create(data: CreatePostDTO): Promise<PostEntity> {
    return prisma.post.create({
      data: {
        imageUrls: data.imageUrls || [],
        likes: data.likes || [],
        comments: data.comments || {},
      },
    });
  }

  async findById(id: string): Promise<PostEntity | null> {
    return prisma.post.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: Partial<PostEntity>): Promise<PostEntity> {
    return prisma.post.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.post.delete({
      where: { id },
    });
  }
}
