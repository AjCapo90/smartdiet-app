import { DayOfWeek, MealType } from '../enums';
import { MacroTargets, Ingredient } from '../models/diet-plan';
import { MacroValues } from '../models/meal';

export interface CreateDietPlanDto {
  name: string;
  description?: string;
  weeklyTargets: MacroTargets;
  meals?: CreatePlannedMealDto[];
}

export interface UpdateDietPlanDto {
  name?: string;
  description?: string;
  weeklyTargets?: MacroTargets;
}

export interface CreatePlannedMealDto {
  dayOfWeek: DayOfWeek;
  mealType: MealType;
  name: string;
  description?: string;
  macros: MacroValues;
  ingredients?: Ingredient[];
}

export interface UpdatePlannedMealDto {
  name?: string;
  description?: string;
  macros?: MacroValues;
  ingredients?: Ingredient[];
}

export interface ParseDietPlanImageDto {
  imageBase64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface ParsedDietPlanResponse {
  confidence: number;
  weeklyTargets?: MacroTargets;
  meals: CreatePlannedMealDto[];
  rawText?: string;
  warnings?: string[];
}
