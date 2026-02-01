import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { db, schema } from '../db';
import { generateId } from '../utils/id';

interface LogMealInput {
  userId: string;
  dietPlanId?: string;
  mealType: string;
  inputMethod: string;
  rawInput: string;
  name: string;
  parsedItems: any[];
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
  };
  confidence?: number;
  loggedAt?: Date;
  notes?: string;
}

interface MealFilters {
  startDate?: Date;
  endDate?: Date;
  mealType?: string;
  limit?: number;
  offset?: number;
}

export class MealService {
  async log(input: LogMealInput) {
    const now = new Date();
    const mealId = generateId();
    
    await db.insert(schema.mealLogs).values({
      id: mealId,
      userId: input.userId,
      dietPlanId: input.dietPlanId || null,
      mealType: input.mealType,
      inputMethod: input.inputMethod,
      rawInput: input.rawInput,
      name: input.name,
      parsedItems: input.parsedItems,
      confidence: input.confidence,
      calories: input.macros.calories,
      protein: input.macros.protein,
      carbs: input.macros.carbs,
      fat: input.macros.fat,
      fiber: input.macros.fiber,
      loggedAt: input.loggedAt || now,
      notes: input.notes,
      isSubstitute: false,
      createdAt: now,
      updatedAt: now,
    });
    
    return this.getById(mealId, input.userId);
  }
  
  async getById(mealId: string, userId: string) {
    const meal = await db.query.mealLogs.findFirst({
      where: and(
        eq(schema.mealLogs.id, mealId),
        eq(schema.mealLogs.userId, userId)
      ),
    });
    
    if (!meal) {
      return null;
    }
    
    return this.formatMeal(meal);
  }
  
  async listByUser(userId: string, filters: MealFilters = {}) {
    const conditions = [eq(schema.mealLogs.userId, userId)];
    
    if (filters.startDate) {
      conditions.push(gte(schema.mealLogs.loggedAt, filters.startDate));
    }
    
    if (filters.endDate) {
      conditions.push(lte(schema.mealLogs.loggedAt, filters.endDate));
    }
    
    if (filters.mealType) {
      conditions.push(eq(schema.mealLogs.mealType, filters.mealType));
    }
    
    const meals = await db.query.mealLogs.findMany({
      where: and(...conditions),
      orderBy: [desc(schema.mealLogs.loggedAt)],
      limit: filters.limit || 50,
      offset: filters.offset || 0,
    });
    
    return meals.map(this.formatMeal);
  }
  
  async getWeekMeals(userId: string, weekStart: Date) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    return this.listByUser(userId, {
      startDate: weekStart,
      endDate: weekEnd,
    });
  }
  
  async update(mealId: string, userId: string, updates: Partial<LogMealInput>) {
    const now = new Date();
    
    const updateData: any = { updatedAt: now };
    
    if (updates.name) updateData.name = updates.name;
    if (updates.mealType) updateData.mealType = updates.mealType;
    if (updates.parsedItems) updateData.parsedItems = updates.parsedItems;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.macros) {
      updateData.calories = updates.macros.calories;
      updateData.protein = updates.macros.protein;
      updateData.carbs = updates.macros.carbs;
      updateData.fat = updates.macros.fat;
      updateData.fiber = updates.macros.fiber;
    }
    
    await db.update(schema.mealLogs)
      .set(updateData)
      .where(and(
        eq(schema.mealLogs.id, mealId),
        eq(schema.mealLogs.userId, userId)
      ));
    
    return this.getById(mealId, userId);
  }
  
  async delete(mealId: string, userId: string) {
    await db.delete(schema.mealLogs)
      .where(and(
        eq(schema.mealLogs.id, mealId),
        eq(schema.mealLogs.userId, userId)
      ));
  }
  
  private formatMeal(meal: typeof schema.mealLogs.$inferSelect) {
    return {
      id: meal.id,
      mealType: meal.mealType,
      inputMethod: meal.inputMethod,
      rawInput: meal.rawInput,
      name: meal.name,
      parsedItems: meal.parsedItems,
      confidence: meal.confidence,
      macros: {
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        fiber: meal.fiber,
      },
      loggedAt: meal.loggedAt,
      notes: meal.notes,
      isSubstitute: meal.isSubstitute,
      createdAt: meal.createdAt,
    };
  }
}

export const mealService = new MealService();
