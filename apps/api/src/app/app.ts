import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import sensible from '@fastify/sensible';

import { authRoutes } from '../routes/auth.routes';
import { dietPlanRoutes } from '../routes/diet-plan.routes';
import { mealRoutes } from '../routes/meal.routes';
import { progressRoutes } from '../routes/progress.routes';
import { userRoutes } from '../routes/user.routes';

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  // Register plugins
  await app.register(sensible);
  
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    credentials: true,
  });
  
  await app.register(cookie, {
    secret: process.env.COOKIE_SECRET || 'calo-cookie-secret-dev-only',
  });
  
  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'calo-jwt-secret-dev-only',
  });

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // API routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(dietPlanRoutes, { prefix: '/api/diet-plans' });
  await app.register(mealRoutes, { prefix: '/api/meals' });
  await app.register(progressRoutes, { prefix: '/api/progress' });
  await app.register(userRoutes, { prefix: '/api/user' });

  return app;
}
