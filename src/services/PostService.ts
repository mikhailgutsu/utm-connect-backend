import { prisma } from '@/prisma/client';
import { PostRepository } from '@/repositories/PostRepository';

export class PostService {
  constructor(private postRepository: PostRepository) {}

  async createPost(userId: string, description: string, photoUrls: string[] = []) {
    return this.postRepository.create({
      userId,
      description,
      photoUrls,
    });
  }

  async getPostById(id: string) {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new Error('Post not found');
    }
    return post;
  }

  async getAllPosts(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const posts = await prisma.post.findMany({
      skip,
      take: limit,
      include: { comments: true },
      orderBy: { createdAt: 'desc' },
    });
    const total = await prisma.post.count();
    return { posts, total, page, limit };
  }

  async updatePost(id: string, description: string, photoUrls: string[]) {
    return this.postRepository.update(id, {
      description,
      photoUrls,
    });
  }

  async deletePost(id: string): Promise<void> {
    await this.postRepository.delete(id);
  }
}

