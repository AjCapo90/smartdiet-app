import { FastifyPluginAsync } from 'fastify';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db';
import { authService } from '../services/auth.service';

export const userRoutes: FastifyPluginAsync = async (fastify) => {
  // All routes require authentication
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });
  
  // Get current user profile
  fastify.get('/profile', async (request, reply) => {
    const userId = (request.user as any).sub;
    const user = await authService.getUserById(userId);
    
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }
    
    return user;
  });
  
  // Update user profile
  fastify.put('/profile', async (request, reply) => {
    const userId = (request.user as any).sub;
    const body = request.body as { name?: string };
    
    const now = new Date();
    
    if (body.name) {
      await db.update(schema.users)
        .set({ name: body.name, updatedAt: now })
        .where(eq(schema.users.id, userId));
    }
    
    const user = await authService.getUserById(userId);
    return user;
  });
  
  // Update user preferences
  fastify.put('/preferences', async (request, reply) => {
    const userId = (request.user as any).sub;
    const body = request.body as {
      timezone?: string;
      weekStartDay?: 'monday' | 'sunday';
      units?: 'metric' | 'imperial';
      language?: string;
    };
    
    const now = new Date();
    const updates: any = { updatedAt: now };
    
    if (body.timezone) updates.timezone = body.timezone;
    if (body.weekStartDay) updates.weekStartDay = body.weekStartDay;
    if (body.units) updates.units = body.units;
    if (body.language) updates.language = body.language;
    
    await db.update(schema.users)
      .set(updates)
      .where(eq(schema.users.id, userId));
    
    const user = await authService.getUserById(userId);
    return user;
  });
};
