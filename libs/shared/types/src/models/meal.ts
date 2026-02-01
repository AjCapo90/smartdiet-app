import { InputMethod, MealType } from '../enums';

export interface MacroValues {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

export interface MealLog {
  id: string;
  userId: string;
  dietPlanId: string;
  loggedAt: Date;
  mealType: MealType;
  inputMethod: InputMethod;
  rawInput: string;
  parsedMeal: ParsedMeal;
  macros: MacroValues;
  matchedPlannedMealId?: string;
  isSubstitute: boolean;
  notes?: string;
}

export interface ParsedMeal {
  name: string;
  items: FoodItem[];
  confidence: number;
}

export interface FoodItem {
  name: string;
  quantity: number;
  unit: string;
  macros: MacroValues;
}

export interface MealLogSummary {
  id: string;
  mealType: MealType;
  name: string;
  macros: MacroValues;
  loggedAt: Date;
  isSubstitute: boolean;
}
