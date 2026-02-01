import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { dietPlans, plannedMeals } from './diet-plans';

export const mealLogs = sqliteTable('meal_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  dietPlanId: text('diet_plan_id').references(() => dietPlans.id, { onDelete: 'set null' }),
  matchedPlannedMealId: text('matched_planned_meal_id').references(() => plannedMeals.id, { onDelete: 'set null' }),
  
  loggedAt: integer('logged_at', { mode: 'timestamp' }).notNull(),
  mealType: text('meal_type').notNull(), // breakfast, lunch, dinner, snack
  inputMethod: text('input_method').notNull(), // text, voice, photo
  rawInput: text('raw_input').notNull(),
  
  // Parsed meal data
  name: text('name').notNull(),
  parsedItems: text('parsed_items', { mode: 'json' }), // Array of food items
  confidence: real('confidence'), // AI parsing confidence 0-1
  
  // Macros
  calories: integer('calories').notNull(),
  protein: real('protein').notNull(),
  carbs: real('carbs').notNull(),
  fat: real('fat').notNull(),
  fiber: real('fiber'),
  
  isSubstitute: integer('is_substitute', { mode: 'boolean' }).default(false),
  notes: text('notes'),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export type MealLog = typeof mealLogs.$inferSelect;
export type NewMealLog = typeof mealLogs.$inferInsert;
