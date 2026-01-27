import express from 'express';
import { GroupService } from '@/services/GroupService';
import { GroupRepository } from '@/repositories/GroupRepository';
import { authenticate } from '@/middleware/authenticate';
import { z } from 'zod';

const router = express.Router();
const groupRepository = new GroupRepository();
const groupService = new GroupService(groupRepository);

const CreateGroupSchema = z.object({
  name: z.string().min(1),
  userIds: z.array(z.string()).optional(),
});

/**
 * POST /api/groups
 * Создать новую группу
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const data = CreateGroupSchema.parse(req.body);
    const group = await groupService.createGroup(data);
    res.status(201).json(group);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
    } else {
      res.status(400).json({ error: (error as Error).message });
    }
  }
});

/**
 * GET /api/groups/:id
 * Получить группу по ID
 */
router.get('/:id', async (req, res) => {
  try {
    const group = await groupService.getGroupById(req.params.id);
    res.json(group);
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
});

/**
 * POST /api/groups/:id/users/:userId
 * Добавить пользователя в группу
 */
router.post('/:id/users/:userId', authenticate, async (req, res) => {
  try {
    const group = await groupService.addUserToGroup(req.params.id, req.params.userId);
    res.json(group);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * DELETE /api/groups/:id/users/:userId
 * Удалить пользователя из группы
 */
router.delete('/:id/users/:userId', authenticate, async (req, res) => {
  try {
    const group = await groupService.removeUserFromGroup(req.params.id, req.params.userId);
    res.json(group);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * PUT /api/groups/:id
 * Обновить группу
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const data = z.object({ name: z.string().min(1).optional() }).parse(req.body);
    const group = await groupService.updateGroup(req.params.id, data);
    res.json(group);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * DELETE /api/groups/:id
 * Удалить группу
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await groupService.deleteGroup(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;
