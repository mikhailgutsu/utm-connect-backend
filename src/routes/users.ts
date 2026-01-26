// src/routes/users.ts
import express from 'express';
import { UserService } from '@/services';
import { UserRepository } from '@/repositories';
import { z } from 'zod';

const router = express.Router();
const userRepository = new UserRepository();
const userService = new UserService(userRepository);

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6),
});

router.post('/', async (req, res) => {
  try {
    const data = CreateUserSchema.parse(req.body);
    const user = await userService.createUser(data);
    res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
    } else {
      res.status(400).json({ error: (error as Error).message });
    }
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json(user);
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
});

export default router;
