import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  preferences: z.object({
    timezone: z.string().optional(),
    weekStartDay: z.enum(['monday', 'sunday']).optional(),
    units: z.enum(['metric', 'imperial']).optional(),
    language: z.string().optional(),
  }).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createDietPlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required'),
  description: z.string().optional(),
  weeklyTargets: z.object({
    calories: z.number().positive(),
    protein: z.number().positive(),
    carbs: z.number().positive(),
    fat: z.number().positive(),
    fiber: z.number().positive().optional(),
  }),
  meals: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
    name: z.string().min(1),
    description: z.string().optional(),
    macros: z.object({
      calories: z.number(),
      protein: z.number(),
      carbs: z.number(),
      fat: z.number(),
      fiber: z.number().optional(),
    }),
    ingredients: z.array(z.object({
      name: z.string(),
      quantity: z.number(),
      unit: z.string(),
    })).optional(),
  })).optional(),
});

export const logMealSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  inputMethod: z.enum(['text', 'voice', 'photo']),
  rawInput: z.string().min(1),
  loggedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const parseMealSchema = z.object({
  input: z.string().min(1),
  inputMethod: z.enum(['text', 'voice']),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateDietPlanInput = z.infer<typeof createDietPlanSchema>;
export type LogMealInput = z.infer<typeof logMealSchema>;
export type ParseMealInput = z.infer<typeof parseMealSchema>;
