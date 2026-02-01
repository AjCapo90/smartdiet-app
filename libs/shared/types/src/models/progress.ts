import { DayOfWeek, MealType, RecommendationPriority } from '../enums';
import { MacroTargets, PlannedMeal } from './diet-plan';
import { MacroValues } from './meal';

export interface WeekProgress {
  userId: string;
  dietPlanId: string;
  weekStart: Date;
  weekEnd: Date;
  targets: MacroTargets;
  consumed: MacroValues;
  remaining: MacroValues;
  percentComplete: MacroPercentages;
  daysLogged: number;
  totalDays: number;
  dailyBreakdown: DailyProgress[];
}

export interface MacroPercentages {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  overall: number;
}

export interface DailyProgress {
  date: Date;
  dayOfWeek: DayOfWeek;
  consumed: MacroValues;
  plannedMeals: number;
  loggedMeals: number;
  isComplete: boolean;
}

export interface MealRecommendation {
  id: string;
  mealType: MealType;
  dayOfWeek: DayOfWeek;
  date: Date;
  originalMeal: PlannedMeal;
  adjustedMeal?: AdjustedMeal;
  priority: RecommendationPriority;
  reason: string;
}

export interface AdjustedMeal {
  name: string;
  description: string;
  macros: MacroValues;
  adjustments: MealAdjustment[];
}

export interface MealAdjustment {
  type: 'portion' | 'swap' | 'add' | 'remove';
  description: string;
  macroImpact: Partial<MacroValues>;
}
