import type { IPostRepository, PostEntity } from '@/types';
import type { CreatePostDTO } from '@/repositories/PostRepository';

export class PostService {
  constructor(private postRepository: IPostRepository) {}

  async createPost(data: CreatePostDTO): Promise<PostEntity> {
    return this.postRepository.create(data);
  }

  async getPostById(id: string): Promise<PostEntity> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new Error('Post not found');
    }
    return post;
  }

  async addLike(postId: string, userId: string): Promise<PostEntity> {
    const post = await this.postRepository.findById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    const updatedLikes = Array.isArray(post.likes) ? post.likes : [];
    if (!updatedLikes.includes(userId)) {
      updatedLikes.push(userId);
    }

    return this.postRepository.update(postId, { likes: updatedLikes });
  }

  async removeLike(postId: string, userId: string): Promise<PostEntity> {
    const post = await this.postRepository.findById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    const updatedLikes = (post.likes || []).filter(id => id !== userId);
    return this.postRepository.update(postId, { likes: updatedLikes });
  }

  async addComment(
    postId: string,
    userId: string,
    userName: string,
    content: string
  ): Promise<PostEntity> {
    const post = await this.postRepository.findById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    const comments = Array.isArray(post.comments) ? post.comments : [];
    comments.push({
      userId,
      userName,
      content,
      createdAt: new Date(),
    });

    return this.postRepository.update(postId, { comments });
  }

  async updatePost(id: string, data: Partial<PostEntity>): Promise<PostEntity> {
    return this.postRepository.update(id, data);
  }

  async deletePost(id: string): Promise<void> {
    await this.postRepository.delete(id);
  }
}
