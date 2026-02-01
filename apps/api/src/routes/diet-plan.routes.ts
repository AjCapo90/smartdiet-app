import { FastifyPluginAsync } from 'fastify';
import { dietPlanService } from '../services/diet-plan.service';
import { createDietPlanSchema } from '../utils/validation';

export const dietPlanRoutes: FastifyPluginAsync = async (fastify) => {
  // All routes require authentication
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });
  
  // List diet plans
  fastify.get('/', async (request) => {
    const userId = (request.user as any).sub;
    return dietPlanService.listByUser(userId);
  });
  
  // Get active plan
  fastify.get('/active', async (request, reply) => {
    const userId = (request.user as any).sub;
    const plan = await dietPlanService.getActivePlan(userId);
    
    if (!plan) {
      return reply.status(404).send({ error: 'No active diet plan' });
    }
    
    return plan;
  });
  
  // Get plan by ID
  fastify.get('/:id', async (request, reply) => {
    const userId = (request.user as any).sub;
    const { id } = request.params as { id: string };
    
    const plan = await dietPlanService.getById(id, userId);
    
    if (!plan) {
      return reply.status(404).send({ error: 'Diet plan not found' });
    }
    
    return plan;
  });
  
  // Create diet plan
  fastify.post('/', async (request, reply) => {
    try {
      const userId = (request.user as any).sub;
      const input = createDietPlanSchema.parse(request.body);
      
      const plan = await dietPlanService.create(userId, input);
      
      return reply.status(201).send(plan);
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });
  
  // Activate plan
  fastify.post('/:id/activate', async (request, reply) => {
    const userId = (request.user as any).sub;
    const { id } = request.params as { id: string };
    
    const plan = await dietPlanService.activate(id, userId);
    
    if (!plan) {
      return reply.status(404).send({ error: 'Diet plan not found' });
    }
    
    return plan;
  });
  
  // Delete plan
  fastify.delete('/:id', async (request, reply) => {
    const userId = (request.user as any).sub;
    const { id } = request.params as { id: string };
    
    await dietPlanService.delete(id, userId);
    
    return { success: true };
  });
  
  // Parse diet plan from image (OCR)
  fastify.post('/parse-image', async (request, reply) => {
    // TODO: Implement OCR with OpenAI Vision API
    return reply.status(501).send({ 
      error: 'OCR parsing not yet implemented',
      message: 'This feature will use OpenAI Vision API to extract diet plans from images'
    });
  });
};
