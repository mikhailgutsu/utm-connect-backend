// src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from '@/config/env';

// Routes
import usersRouter from '@/routes/users';
import linksRouter from '@/routes/links';
import campaignsRouter from '@/routes/campaigns';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/users', usersRouter);
app.use('/api/links', linksRouter);
app.use('/api/campaigns', campaignsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📁 Environment: ${config.nodeEnv}`);
});

export default app;
