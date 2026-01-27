// src/config/env.ts
export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/utm_connect',
  
  // JWT настройки
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production',
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  
  // Password требования
  passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '12'),
  passwordRequireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
  passwordRequireNumber: process.env.PASSWORD_REQUIRE_NUMBER !== 'false',
  passwordRequireSpecial: process.env.PASSWORD_REQUIRE_SPECIAL !== 'false',
};

export const isDevelopment = config.nodeEnv === 'development';
export const isProduction = config.nodeEnv === 'production';
