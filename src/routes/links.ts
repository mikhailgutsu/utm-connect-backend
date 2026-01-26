// src/routes/links.ts
import express from 'express';
import { LinkService } from '@/services';
import { LinkRepository } from '@/repositories';
import { z } from 'zod';

const router = express.Router();
const linkRepository = new LinkRepository();
const linkService = new LinkService(linkRepository);

const CreateLinkSchema = z.object({
  originalUrl: z.string().url(),
  shortCode: z.string().min(3),
  campaignId: z.string().optional(),
  userId: z.string(),
});

router.post('/', async (req, res) => {
  try {
    const data = CreateLinkSchema.parse(req.body);
    const link = await linkService.createLink(data);
    res.status(201).json(link);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
    } else {
      res.status(400).json({ error: (error as Error).message });
    }
  }
});

router.get('/:shortCode', async (req, res) => {
  try {
    const link = await linkService.getLinkByShortCode(req.params.shortCode);
    // Record click
    await linkService.recordClick(req.params.shortCode);
    res.json(link);
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
});

export default router;
