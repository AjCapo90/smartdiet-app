import { DayOfWeek, MealType } from '../enums';
import { MacroValues } from './meal';

export interface DietPlan {
  id: string;
  userId: string;
  name: string;
  description?: string;
  sourceImageUrl?: string;
  weeklyTargets: MacroTargets;
  meals: PlannedMeal[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

export interface PlannedMeal {
  id: string;
  dietPlanId: string;
  dayOfWeek: DayOfWeek;
  mealType: MealType;
  name: string;
  description?: string;
  macros: MacroValues;
  ingredients?: Ingredient[];
  sortOrder: number;
}

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  macros?: MacroValues;
}

export interface DietPlanSummary {
  id: string;
  name: string;
  isActive: boolean;
  weeklyTargets: MacroTargets;
  mealCount: number;
  createdAt: Date;
}
