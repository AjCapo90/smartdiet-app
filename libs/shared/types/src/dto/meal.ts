import { InputMethod, MealType } from '../enums';
import { MacroValues, FoodItem } from '../models/meal';

export interface LogMealDto {
  mealType: MealType;
  inputMethod: InputMethod;
  rawInput: string;
  loggedAt?: Date;
  notes?: string;
}

export interface LogMealWithMacrosDto extends LogMealDto {
  name: string;
  items: FoodItem[];
  macros: MacroValues;
}

export interface ParseMealDto {
  input: string;
  inputMethod: InputMethod;
}

export interface ParsedMealResponse {
  name: string;
  items: FoodItem[];
  macros: MacroValues;
  confidence: number;
  suggestions?: string[];
}

export interface UpdateMealLogDto {
  mealType?: MealType;
  name?: string;
  items?: FoodItem[];
  macros?: MacroValues;
  notes?: string;
}

export interface MealLogFilters {
  startDate?: Date;
  endDate?: Date;
  mealType?: MealType;
  limit?: number;
  offset?: number;
}
