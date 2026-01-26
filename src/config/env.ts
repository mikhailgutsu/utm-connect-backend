// src/config/env.ts
export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/utm_connect',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-here',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
};

export const isDevelopment = config.nodeEnv === 'development';
export const isProduction = config.nodeEnv === 'production';
