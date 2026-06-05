import dotenv from 'dotenv';

// Ensure .env is loaded before reading process.env in this module.
// Force override because some environments predefine PORT (random).
dotenv.config({ override: true });

const localDevOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

export const config = {
  app: {
    name: 'LifeLink',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000'),
    apiUrl: process.env.API_URL || 'http://localhost:5000',
  },
  client: {
    url: process.env.CLIENT_URL || 'http://localhost:3000',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your_secret_key',
    expireIn: process.env.JWT_EXPIRE || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_refresh_secret',
    refreshExpireIn: process.env.JWT_REFRESH_EXPIRE || '30d',
  },
  cors: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      const explicitOrigins = [
        process.env.CLIENT_URL,
        process.env.API_URL,
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
      ].filter(Boolean) as string[];

      if (!origin) {
        callback(null, true);
        return;
      }

      const isDevelopment = (process.env.NODE_ENV || 'development') === 'development';
      const isExplicitlyAllowed = explicitOrigins.includes(origin);
      const isLocalDevOrigin = localDevOriginPattern.test(origin);

      if (isExplicitlyAllowed || (isDevelopment && isLocalDevOrigin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  },
  pagination: {
    defaultPage: 1,
    defaultLimit: 20,
    maxLimit: 100,
  },
};

export default config;

