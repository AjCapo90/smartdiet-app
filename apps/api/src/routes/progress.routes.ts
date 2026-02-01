import { FastifyPluginAsync } from 'fastify';
import { progressService } from '../services/progress.service';

export const progressRoutes: FastifyPluginAsync = async (fastify) => {
  // All routes require authentication
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });
  
  // Get current week progress
  fastify.get('/week', async (request) => {
    const userId = (request.user as any).sub;
    return progressService.getWeekProgress(userId);
  });
  
  // Get specific week progress
  fastify.get('/week/:date', async (request) => {
    const userId = (request.user as any).sub;
    const { date } = request.params as { date: string };
    
    const weekStart = new Date(date);
    return progressService.getWeekProgress(userId, weekStart);
  });
  
  // Get recommendations
  fastify.get('/recommendations', async (request) => {
    const userId = (request.user as any).sub;
    return progressService.getRecommendations(userId);
  });
};
