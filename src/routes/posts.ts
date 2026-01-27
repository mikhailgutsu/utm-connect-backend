import express from 'express';
import { UserRepository } from '@/repositories';
import { prisma } from '@/prisma/client';
import { authenticate, getCurrentUser } from '@/middleware/authenticate';
import { z } from 'zod';

const router = express.Router();
const userRepository = new UserRepository();

const CreatePostSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  photoUrls: z.array(z.string()).optional().default([]),
});

const CommentPostSchema = z.object({
  text: z.string().min(1, 'Comment text is required'),
});

/**
 * POST /api/posts/create
 * Создать новый пост
 */
router.post('/create', authenticate, async (req, res) => {
  try {
    const currentUser = getCurrentUser(req);
    const { description, photoUrls } = CreatePostSchema.parse(req.body);

    // Создаем пост
    const post = await prisma.post.create({
      data: {
        userId: currentUser.userId,
        description,
        photoUrls,
        likes: [],
      },
      include: { comments: true },
    });

    // Добавляем ID поста в user.postIds
    const user = await userRepository.findById(currentUser.userId);
    if (user) {
      await userRepository.update(currentUser.userId, {
        postIds: [...user.postIds, post.id],
      });
    }

    res.status(201).json({
      message: 'Post created successfully',
      post,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
    } else {
      res.status(500).json({ error: (error as Error).message });
    }
  }
});

/**
 * POST /api/posts/:id/like
 * Лайкнуть пост
 */
router.post('/:id/like', authenticate, async (req, res) => {
  try {
    const currentUser = getCurrentUser(req);
    const { id: postId } = req.params;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { comments: true },
    });

    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    // Проверяем что уже не лайкнули
    if (post.likes.includes(currentUser.userId)) {
      res.status(400).json({ error: 'Already liked this post' });
      return;
    }

    // Добавляем лайк
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        likes: [...post.likes, currentUser.userId],
      },
      include: { comments: true },
    });

    res.status(200).json({
      message: 'Post liked successfully',
      post: updatedPost,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * POST /api/posts/:id/unlike
 * Убрать лайк с поста
 */
router.post('/:id/unlike', authenticate, async (req, res) => {
  try {
    const currentUser = getCurrentUser(req);
    const { id: postId } = req.params;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { comments: true },
    });

    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    // Проверяем что лайк существует
    if (!post.likes.includes(currentUser.userId)) {
      res.status(400).json({ error: 'You did not like this post' });
      return;
    }

    // Удаляем лайк
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        likes: post.likes.filter(id => id !== currentUser.userId),
      },
      include: { comments: true },
    });

    res.status(200).json({
      message: 'Like removed successfully',
      post: updatedPost,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * DELETE /api/posts/:id/likes/:userId
 * Удалить лайк (deprecated - используй /api/posts/:id/unlike)
 */
router.delete('/:id/likes/:userId', authenticate, async (req, res) => {
  try {
    const currentUser = getCurrentUser(req);
    const postId = req.params.id;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { comments: true },
    });

    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    if (!post.likes.includes(currentUser.userId)) {
      res.status(400).json({ error: 'You did not like this post' });
      return;
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        likes: post.likes.filter(id => id !== currentUser.userId),
      },
      include: { comments: true },
    });

    res.status(200).json({
      message: 'Like removed successfully',
      post: updatedPost,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * POST /api/posts/:id/comment
 * Добавить комментарий к посту
 */
router.post('/:id/comment', authenticate, async (req, res) => {
  try {
    const currentUser = getCurrentUser(req);
    const { id: postId } = req.params;
    const { text } = CommentPostSchema.parse(req.body);

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    // Создаем комментарий
    await prisma.comment.create({
      data: {
        postId,
        userId: currentUser.userId,
        text,
      },
    });

    // Получаем пост с комментариями
    const updatedPost = await prisma.post.findUnique({
      where: { id: postId },
      include: { comments: true },
    });

    res.status(201).json({
      message: 'Comment added successfully',
      post: updatedPost,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
    } else {
      res.status(500).json({ error: (error as Error).message });
    }
  }
});

/**
 * GET /api/posts/:id/comments
 * Получить все комментарии поста
 */
router.get('/:id/comments', async (req, res) => {
  try {
    const { id: postId } = req.params;

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    // Получаем все комментарии с информацией о пользователях
    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
    });

    // Получаем информацию о пользователях для каждого комментария
    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        const user = await userRepository.findById(comment.userId);
        return {
          id: comment.id,
          postId: comment.postId,
          userId: comment.userId,
          text: comment.text,
          createdAt: comment.createdAt,
          user: user ? {
            id: user.id,
            name: user.name,
            photoUrl: user.photoUrl,
          } : null,
        };
      })
    );

    res.status(200).json({
      comments: commentsWithUsers,
      total: commentsWithUsers.length,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * PUT /api/posts/:id
 * Обновить описание поста
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const currentUser = getCurrentUser(req);
    const { id: postId } = req.params;
    const { description, photoUrls } = CreatePostSchema.parse(req.body);

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    // Проверяем что это автор поста
    if (post.userId !== currentUser.userId) {
      res.status(403).json({ error: 'You can only update your own posts' });
      return;
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        description,
        photoUrls,
      },
      include: { comments: true },
    });

    res.status(200).json({
      message: 'Post updated successfully',
      post: updatedPost,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
    } else {
      res.status(500).json({ error: (error as Error).message });
    }
  }
});

/**
 * DELETE /api/posts/:id
 * Удалить пост (только автор)
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const currentUser = getCurrentUser(req);
    const { id: postId } = req.params;

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    // Проверяем что это автор поста
    if (post.userId !== currentUser.userId) {
      res.status(403).json({ error: 'You can only delete your own posts' });
      return;
    }

    // Удаляем пост
    await prisma.post.delete({
      where: { id: postId },
    });

    // Удаляем ID поста из user.postIds
    const user = await userRepository.findById(currentUser.userId);
    if (user) {
      await userRepository.update(currentUser.userId, {
        postIds: user.postIds.filter(id => id !== postId),
      });
    }

    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/posts/:id
 * Получить информацию о посте
 */
router.get('/:id', async (req, res) => {
  try {
    const { id: postId } = req.params;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { comments: true },
    });

    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/posts
 * Получить все посты (с пагинацией)
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const posts = await prisma.post.findMany({
      skip,
      take: limit,
      include: { comments: true },
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.post.count();

    res.status(200).json({
      posts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
