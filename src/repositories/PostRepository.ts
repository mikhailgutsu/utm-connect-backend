import { prisma } from '@/prisma/client';

export interface CreatePostDTO {
  userId: string;
  description: string;
  photoUrls?: string[];
}

export class PostRepository {
  async create(data: CreatePostDTO) {
    return prisma.post.create({
      data: {
        userId: data.userId,
        description: data.description,
        photoUrls: data.photoUrls || [],
        likes: [],
      },
      include: { comments: true },
    });
  }

  async findById(id: string) {
    return prisma.post.findUnique({
      where: { id },
      include: { comments: true },
    });
  }

  async update(id: string, data: any) {
    return prisma.post.update({
      where: { id },
      data,
      include: { comments: true },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.post.delete({
      where: { id },
    });
  }
}
