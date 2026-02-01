import { MacroValues } from '../models/meal';
import { MacroTargets } from '../models/diet-plan';
import { MacroPercentages } from '../models/progress';

export const EMPTY_MACROS: MacroValues = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
};

export function addMacros(a: MacroValues, b: MacroValues): MacroValues {
  return {
    calories: a.calories + b.calories,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
    fiber: (a.fiber ?? 0) + (b.fiber ?? 0),
  };
}

export function subtractMacros(a: MacroValues, b: MacroValues): MacroValues {
  return {
    calories: Math.max(0, a.calories - b.calories),
    protein: Math.max(0, a.protein - b.protein),
    carbs: Math.max(0, a.carbs - b.carbs),
    fat: Math.max(0, a.fat - b.fat),
    fiber: Math.max(0, (a.fiber ?? 0) - (b.fiber ?? 0)),
  };
}

export function scaleMacros(macros: MacroValues, factor: number): MacroValues {
  return {
    calories: Math.round(macros.calories * factor),
    protein: Math.round(macros.protein * factor),
    carbs: Math.round(macros.carbs * factor),
    fat: Math.round(macros.fat * factor),
    fiber: macros.fiber ? Math.round(macros.fiber * factor) : undefined,
  };
}

export function sumMacros(items: MacroValues[]): MacroValues {
  return items.reduce((acc, item) => addMacros(acc, item), { ...EMPTY_MACROS });
}

export function calculatePercentages(
  consumed: MacroValues,
  targets: MacroTargets
): MacroPercentages {
  const calcPercent = (value: number, target: number) =>
    target > 0 ? Math.round((value / target) * 100) : 0;

  const calories = calcPercent(consumed.calories, targets.calories);
  const protein = calcPercent(consumed.protein, targets.protein);
  const carbs = calcPercent(consumed.carbs, targets.carbs);
  const fat = calcPercent(consumed.fat, targets.fat);

  // Overall is weighted average: calories 40%, protein 30%, carbs 15%, fat 15%
  const overall = Math.round(
    calories * 0.4 + protein * 0.3 + carbs * 0.15 + fat * 0.15
  );

  return { calories, protein, carbs, fat, overall };
}

export function divideMacros(macros: MacroValues, divisor: number): MacroValues {
  if (divisor <= 0) return { ...EMPTY_MACROS };
  return scaleMacros(macros, 1 / divisor);
}

export function macrosToDaily(weeklyTargets: MacroTargets): MacroTargets {
  return {
    calories: Math.round(weeklyTargets.calories / 7),
    protein: Math.round(weeklyTargets.protein / 7),
    carbs: Math.round(weeklyTargets.carbs / 7),
    fat: Math.round(weeklyTargets.fat / 7),
    fiber: weeklyTargets.fiber ? Math.round(weeklyTargets.fiber / 7) : undefined,
  };
}
