import { FastifyPluginAsync } from 'fastify';
import { mealService } from '../services/meal.service';
import { dietPlanService } from '../services/diet-plan.service';
import { logMealSchema, parseMealSchema } from '../utils/validation';

export const mealRoutes: FastifyPluginAsync = async (fastify) => {
  // All routes require authentication
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });
  
  // List meals with filters
  fastify.get('/', async (request) => {
    const userId = (request.user as any).sub;
    const query = request.query as {
      startDate?: string;
      endDate?: string;
      mealType?: string;
      limit?: string;
      offset?: string;
    };
    
    return mealService.listByUser(userId, {
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      mealType: query.mealType,
      limit: query.limit ? parseInt(query.limit) : undefined,
      offset: query.offset ? parseInt(query.offset) : undefined,
    });
  });
  
  // Get meal by ID
  fastify.get('/:id', async (request, reply) => {
    const userId = (request.user as any).sub;
    const { id } = request.params as { id: string };
    
    const meal = await mealService.getById(id, userId);
    
    if (!meal) {
      return reply.status(404).send({ error: 'Meal not found' });
    }
    
    return meal;
  });
  
  // Log a meal (with pre-parsed data)
  fastify.post('/', async (request, reply) => {
    try {
      const userId = (request.user as any).sub;
      const body = request.body as any;
      
      // Get active diet plan
      const plan = await dietPlanService.getActivePlan(userId);
      
      const meal = await mealService.log({
        userId,
        dietPlanId: plan?.id,
        mealType: body.mealType,
        inputMethod: body.inputMethod,
        rawInput: body.rawInput,
        name: body.name,
        parsedItems: body.items || [],
        macros: body.macros,
        confidence: body.confidence,
        loggedAt: body.loggedAt ? new Date(body.loggedAt) : undefined,
        notes: body.notes,
      });
      
      return reply.status(201).send(meal);
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });
  
  // Parse meal from text/voice input
  fastify.post('/parse', async (request, reply) => {
    try {
      const input = parseMealSchema.parse(request.body);
      
      // TODO: Implement AI parsing with OpenAI
      // For now, return mock data
      const mockParsed = {
        name: input.input.slice(0, 50),
        items: [
          {
            name: 'Parsed Item',
            quantity: 1,
            unit: 'serving',
            macros: { calories: 400, protein: 20, carbs: 45, fat: 15 },
          },
        ],
        macros: { calories: 400, protein: 20, carbs: 45, fat: 15 },
        confidence: 0.75,
        suggestions: [
          'Add specific quantities for more accurate tracking',
        ],
      };
      
      return mockParsed;
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });
  
  // Update meal
  fastify.put('/:id', async (request, reply) => {
    try {
      const userId = (request.user as any).sub;
      const { id } = request.params as { id: string };
      const body = request.body as any;
      
      const meal = await mealService.update(id, userId, {
        name: body.name,
        mealType: body.mealType,
        parsedItems: body.items,
        macros: body.macros,
        notes: body.notes,
      });
      
      if (!meal) {
        return reply.status(404).send({ error: 'Meal not found' });
      }
      
      return meal;
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });
  
  // Delete meal
  fastify.delete('/:id', async (request, reply) => {
    const userId = (request.user as any).sub;
    const { id } = request.params as { id: string };
    
    await mealService.delete(id, userId);
    
    return { success: true };
  });
};
