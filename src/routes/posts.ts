import express from 'express';
import { PostService } from '@/services/PostService';
import { PostRepository } from '@/repositories/PostRepository';
import { authenticate } from '@/middleware/authenticate';
import { z } from 'zod';

const router = express.Router();
const postRepository = new PostRepository();
const postService = new PostService(postRepository);

const CreatePostSchema = z.object({
  imageUrls: z.array(z.string()).optional(),
  likes: z.array(z.string()).optional(),
  comments: z.any().optional(),
});

/**
 * POST /api/posts
 * Создать новый пост
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const data = CreatePostSchema.parse(req.body);
    const post = await postService.createPost(data);
    res.status(201).json(post);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
    } else {
      res.status(400).json({ error: (error as Error).message });
    }
  }
});

/**
 * GET /api/posts/:id
 * Получить пост по ID
 */
router.get('/:id', async (req, res) => {
  try {
    const post = await postService.getPostById(req.params.id);
    res.json(post);
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
});

/**
 * POST /api/posts/:id/likes/:userId
 * Добавить лайк
 */
router.post('/:id/likes/:userId', authenticate, async (req, res) => {
  try {
    const post = await postService.addLike(req.params.id, req.params.userId);
    res.json(post);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * DELETE /api/posts/:id/likes/:userId
 * Удалить лайк
 */
router.delete('/:id/likes/:userId', authenticate, async (req, res) => {
  try {
    const post = await postService.removeLike(req.params.id, req.params.userId);
    res.json(post);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * POST /api/posts/:id/comments
 * Добавить комментарий
 */
router.post('/:id/comments', authenticate, async (req, res) => {
  try {
    const { userId, userName, content } = z.object({
      userId: z.string(),
      userName: z.string(),
      content: z.string(),
    }).parse(req.body);

    const post = await postService.addComment(req.params.id, userId, userName, content);
    res.json(post);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
    } else {
      res.status(400).json({ error: (error as Error).message });
    }
  }
});

/**
 * PUT /api/posts/:id
 * Обновить пост
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const data = CreatePostSchema.parse(req.body);
    const post = await postService.updatePost(req.params.id, data);
    res.json(post);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * DELETE /api/posts/:id
 * Удалить пост
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await postService.deletePost(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;
