import { eq, and } from 'drizzle-orm';
import { db, schema } from '../db';
import { generateId } from '../utils/id';
import type { CreateDietPlanInput } from '../utils/validation';

export class DietPlanService {
  async create(userId: string, input: CreateDietPlanInput) {
    const now = new Date();
    const planId = generateId();
    
    // Deactivate other plans if this one is being set as active
    await db.update(schema.dietPlans)
      .set({ isActive: false, updatedAt: now })
      .where(eq(schema.dietPlans.userId, userId));
    
    // Create the diet plan
    await db.insert(schema.dietPlans).values({
      id: planId,
      userId,
      name: input.name,
      description: input.description,
      isActive: true,
      targetCalories: input.weeklyTargets.calories,
      targetProtein: input.weeklyTargets.protein,
      targetCarbs: input.weeklyTargets.carbs,
      targetFat: input.weeklyTargets.fat,
      targetFiber: input.weeklyTargets.fiber,
      createdAt: now,
      updatedAt: now,
    });
    
    // Create planned meals if provided
    if (input.meals && input.meals.length > 0) {
      const meals = input.meals.map((meal, index) => ({
        id: generateId(),
        dietPlanId: planId,
        dayOfWeek: meal.dayOfWeek,
        mealType: meal.mealType,
        name: meal.name,
        description: meal.description,
        sortOrder: index,
        calories: meal.macros.calories,
        protein: meal.macros.protein,
        carbs: meal.macros.carbs,
        fat: meal.macros.fat,
        fiber: meal.macros.fiber,
        ingredients: meal.ingredients || null,
        createdAt: now,
      }));
      
      await db.insert(schema.plannedMeals).values(meals);
    }
    
    return this.getById(planId, userId);
  }
  
  async getById(planId: string, userId: string) {
    const plan = await db.query.dietPlans.findFirst({
      where: and(
        eq(schema.dietPlans.id, planId),
        eq(schema.dietPlans.userId, userId)
      ),
    });
    
    if (!plan) {
      return null;
    }
    
    const meals = await db.query.plannedMeals.findMany({
      where: eq(schema.plannedMeals.dietPlanId, planId),
      orderBy: (meals, { asc }) => [asc(meals.dayOfWeek), asc(meals.sortOrder)],
    });
    
    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      sourceImageUrl: plan.sourceImageUrl,
      isActive: plan.isActive,
      weeklyTargets: {
        calories: plan.targetCalories,
        protein: plan.targetProtein,
        carbs: plan.targetCarbs,
        fat: plan.targetFat,
        fiber: plan.targetFiber,
      },
      meals: meals.map(m => ({
        id: m.id,
        dayOfWeek: m.dayOfWeek,
        mealType: m.mealType,
        name: m.name,
        description: m.description,
        macros: {
          calories: m.calories,
          protein: m.protein,
          carbs: m.carbs,
          fat: m.fat,
          fiber: m.fiber,
        },
        ingredients: m.ingredients,
      })),
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }
  
  async getActivePlan(userId: string) {
    const plan = await db.query.dietPlans.findFirst({
      where: and(
        eq(schema.dietPlans.userId, userId),
        eq(schema.dietPlans.isActive, true)
      ),
    });
    
    if (!plan) {
      return null;
    }
    
    return this.getById(plan.id, userId);
  }
  
  async listByUser(userId: string) {
    const plans = await db.query.dietPlans.findMany({
      where: eq(schema.dietPlans.userId, userId),
      orderBy: (plans, { desc }) => [desc(plans.updatedAt)],
    });
    
    return plans.map(p => ({
      id: p.id,
      name: p.name,
      isActive: p.isActive,
      weeklyTargets: {
        calories: p.targetCalories,
        protein: p.targetProtein,
        carbs: p.targetCarbs,
        fat: p.targetFat,
      },
      createdAt: p.createdAt,
    }));
  }
  
  async activate(planId: string, userId: string) {
    const now = new Date();
    
    // Deactivate all plans
    await db.update(schema.dietPlans)
      .set({ isActive: false, updatedAt: now })
      .where(eq(schema.dietPlans.userId, userId));
    
    // Activate the selected plan
    await db.update(schema.dietPlans)
      .set({ isActive: true, updatedAt: now })
      .where(and(
        eq(schema.dietPlans.id, planId),
        eq(schema.dietPlans.userId, userId)
      ));
    
    return this.getById(planId, userId);
  }
  
  async delete(planId: string, userId: string) {
    await db.delete(schema.dietPlans)
      .where(and(
        eq(schema.dietPlans.id, planId),
        eq(schema.dietPlans.userId, userId)
      ));
  }
}

export const dietPlanService = new DietPlanService();
