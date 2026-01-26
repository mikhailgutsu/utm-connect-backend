// src/routes/campaigns.ts
import express from 'express';
import { CampaignService } from '@/services';
import { CampaignRepository } from '@/repositories';
import { z } from 'zod';

const router = express.Router();
const campaignRepository = new CampaignRepository();
const campaignService = new CampaignService(campaignRepository);

const CreateCampaignSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  userId: z.string(),
});

router.post('/', async (req, res) => {
  try {
    const data = CreateCampaignSchema.parse(req.body);
    const campaign = await campaignService.createCampaign(data);
    res.status(201).json(campaign);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
    } else {
      res.status(400).json({ error: (error as Error).message });
    }
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const campaigns = await campaignService.getUserCampaigns(req.params.userId);
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const campaign = await campaignService.getCampaignById(req.params.id);
    res.json(campaign);
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
});

export default router;
