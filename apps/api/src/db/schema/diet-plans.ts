import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const dietPlans = sqliteTable('diet_plans', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  sourceImageUrl: text('source_image_url'),
  isActive: integer('is_active', { mode: 'boolean' }).default(false),
  
  // Weekly macro targets
  targetCalories: integer('target_calories').notNull(),
  targetProtein: integer('target_protein').notNull(),
  targetCarbs: integer('target_carbs').notNull(),
  targetFat: integer('target_fat').notNull(),
  targetFiber: integer('target_fiber'),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const plannedMeals = sqliteTable('planned_meals', {
  id: text('id').primaryKey(),
  dietPlanId: text('diet_plan_id').notNull().references(() => dietPlans.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(), // 0-6 (Mon-Sun)
  mealType: text('meal_type').notNull(), // breakfast, lunch, dinner, snack
  name: text('name').notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').default(0),
  
  // Macros
  calories: integer('calories').notNull(),
  protein: real('protein').notNull(),
  carbs: real('carbs').notNull(),
  fat: real('fat').notNull(),
  fiber: real('fiber'),
  
  // Ingredients stored as JSON
  ingredients: text('ingredients', { mode: 'json' }),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export type DietPlan = typeof dietPlans.$inferSelect;
export type NewDietPlan = typeof dietPlans.$inferInsert;
export type PlannedMeal = typeof plannedMeals.$inferSelect;
export type NewPlannedMeal = typeof plannedMeals.$inferInsert;
