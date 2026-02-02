import { Injectable, signal, computed, effect } from '@angular/core';

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodItem {
  name: string;
  quantity: number;
  unit: string;
  isOptional?: boolean;
  macros: Macros;
}

export interface PlannedMeal {
  id: string;
  name: string;
  type: 'breakfast' | 'morning_snack' | 'lunch' | 'afternoon_snack' | 'dinner';
  displayType: 'breakfast' | 'lunch' | 'dinner' | 'snack'; // For icons/display
  time?: string;
  foods: FoodItem[];
  macros: Macros;
}

export interface DayPlan {
  day: string;
  dayItalian: string;
  meals: PlannedMeal[];
}

export interface DietPlan {
  id: string;
  name: string;
  createdAt: string;
  notes?: string[];
  weeklyTargets: Macros;
  days: DayPlan[];
}

export interface MealLog {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  plannedMealId?: string; // Reference to planned meal if following plan
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods?: FoodItem[]; // What was actually eaten
  macros: Macros;
  status: 'completed' | 'modified' | 'skipped';
  notes?: string;
  timestamp: number;
}

export interface MealStatus {
  plannedMealId: string;
  date: string;
  status: 'pending' | 'completed' | 'modified' | 'skipped';
  actualFoods?: FoodItem[];
  actualMacros?: Macros;
  delta?: Macros;
}

export interface DailyProgress {
  date: string;
  planned: Macros;
  actual: Macros;
  delta: Macros;
  mealStatuses: MealStatus[];
}

export interface WeeklyProgress {
  startDate: string;
  endDate: string;
  planned: Macros;
  actual: Macros;
  delta: Macros;
  dailyProgress: DailyProgress[];
}

const STORAGE_KEYS = {
  DIET_PLAN: 'calo_diet_plan',
  MEAL_LOGS: 'calo_meal_logs',
  MEAL_STATUSES: 'calo_meal_statuses',
  USER_PREFS: 'calo_user_prefs',
};

@Injectable({ providedIn: 'root' })
export class StorageService {
  // Signals for reactive state
  private _dietPlan = signal<DietPlan | null>(null);
  private _mealLogs = signal<MealLog[]>([]);
  private _mealStatuses = signal<MealStatus[]>([]);

  // Public readonly signals
  readonly dietPlan = this._dietPlan.asReadonly();
  readonly mealLogs = this._mealLogs.asReadonly();
  readonly mealStatuses = this._mealStatuses.asReadonly();

  // Today's date string
  readonly today = computed(() => new Date().toISOString().split('T')[0]);

  // Computed: today's logs
  readonly todayLogs = computed(() => {
    const today = this.today();
    return this._mealLogs().filter(log => log.date === today);
  });

  // Computed: today's meal statuses
  readonly todayMealStatuses = computed(() => {
    const today = this.today();
    return this._mealStatuses().filter(s => s.date === today);
  });

  // Computed: today's planned meals from diet plan
  readonly todayPlannedMeals = computed(() => {
    const plan = this._dietPlan();
    if (!plan) return [];
    
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    const dayPlan = plan.days.find(d => d.day === dayName);
    
    return dayPlan?.meals || [];
  });

  // Computed: today's macros (from logs)
  readonly todayMacros = computed(() => {
    return this.todayLogs().reduce(
      (acc, log) => ({
        calories: acc.calories + log.macros.calories,
        protein: acc.protein + log.macros.protein,
        carbs: acc.carbs + log.macros.carbs,
        fat: acc.fat + log.macros.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  });

  // Computed: today's planned totals
  readonly todayPlanned = computed(() => {
    const meals = this.todayPlannedMeals();
    return meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.macros.calories,
        protein: acc.protein + meal.macros.protein,
        carbs: acc.carbs + meal.macros.carbs,
        fat: acc.fat + meal.macros.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  });

  // Computed: today's delta
  readonly todayDelta = computed(() => {
    const actual = this.todayMacros();
    const planned = this.todayPlanned();
    return {
      calories: actual.calories - planned.calories,
      protein: actual.protein - planned.protein,
      carbs: actual.carbs - planned.carbs,
      fat: actual.fat - planned.fat,
    };
  });

  constructor() {
    this.loadFromStorage();
    
    // Auto-save when data changes
    effect(() => {
      const plan = this._dietPlan();
      if (plan) {
        localStorage.setItem(STORAGE_KEYS.DIET_PLAN, JSON.stringify(plan));
      }
    });
    
    effect(() => {
      const logs = this._mealLogs();
      localStorage.setItem(STORAGE_KEYS.MEAL_LOGS, JSON.stringify(logs));
    });

    effect(() => {
      const statuses = this._mealStatuses();
      localStorage.setItem(STORAGE_KEYS.MEAL_STATUSES, JSON.stringify(statuses));
    });
  }

  private loadFromStorage(): void {
    try {
      const planJson = localStorage.getItem(STORAGE_KEYS.DIET_PLAN);
      if (planJson) {
        this._dietPlan.set(JSON.parse(planJson));
      }
      
      const logsJson = localStorage.getItem(STORAGE_KEYS.MEAL_LOGS);
      if (logsJson) {
        this._mealLogs.set(JSON.parse(logsJson));
      }

      const statusesJson = localStorage.getItem(STORAGE_KEYS.MEAL_STATUSES);
      if (statusesJson) {
        this._mealStatuses.set(JSON.parse(statusesJson));
      }
    } catch (e) {
      console.error('Failed to load from storage:', e);
    }
  }

  saveDietPlan(plan: DietPlan): void {
    this._dietPlan.set(plan);
  }

  // Mark a planned meal as completed (followed the plan)
  completeMeal(plannedMealId: string, date: string = this.today()): void {
    const plan = this._dietPlan();
    if (!plan) return;

    // Find the planned meal
    let plannedMeal: PlannedMeal | undefined;
    for (const day of plan.days) {
      plannedMeal = day.meals.find(m => m.id === plannedMealId);
      if (plannedMeal) break;
    }
    if (!plannedMeal) return;

    // Create log entry
    const log: MealLog = {
      id: crypto.randomUUID(),
      date,
      plannedMealId,
      name: plannedMeal.name,
      type: plannedMeal.displayType,
      foods: plannedMeal.foods,
      macros: plannedMeal.macros,
      status: 'completed',
      timestamp: Date.now(),
    };

    this._mealLogs.update(logs => [...logs, log]);

    // Update meal status
    this._mealStatuses.update(statuses => {
      const existing = statuses.findIndex(s => s.plannedMealId === plannedMealId && s.date === date);
      const newStatus: MealStatus = {
        plannedMealId,
        date,
        status: 'completed',
      };
      if (existing >= 0) {
        return statuses.map((s, i) => i === existing ? newStatus : s);
      }
      return [...statuses, newStatus];
    });
  }

  // Log a modified meal (ate something different)
  logModifiedMeal(plannedMealId: string, actualFoods: FoodItem[], date: string = this.today()): void {
    const plan = this._dietPlan();
    if (!plan) return;

    // Find the planned meal
    let plannedMeal: PlannedMeal | undefined;
    for (const day of plan.days) {
      plannedMeal = day.meals.find(m => m.id === plannedMealId);
      if (plannedMeal) break;
    }
    if (!plannedMeal) return;

    // Calculate actual macros
    const actualMacros = actualFoods.reduce(
      (acc, food) => ({
        calories: acc.calories + food.macros.calories,
        protein: acc.protein + food.macros.protein,
        carbs: acc.carbs + food.macros.carbs,
        fat: acc.fat + food.macros.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    // Calculate delta
    const delta: Macros = {
      calories: actualMacros.calories - plannedMeal.macros.calories,
      protein: actualMacros.protein - plannedMeal.macros.protein,
      carbs: actualMacros.carbs - plannedMeal.macros.carbs,
      fat: actualMacros.fat - plannedMeal.macros.fat,
    };

    // Create log entry
    const log: MealLog = {
      id: crypto.randomUUID(),
      date,
      plannedMealId,
      name: plannedMeal.name + ' (modificato)',
      type: plannedMeal.displayType,
      foods: actualFoods,
      macros: actualMacros,
      status: 'modified',
      timestamp: Date.now(),
    };

    this._mealLogs.update(logs => [...logs, log]);

    // Update meal status
    this._mealStatuses.update(statuses => {
      const existing = statuses.findIndex(s => s.plannedMealId === plannedMealId && s.date === date);
      const newStatus: MealStatus = {
        plannedMealId,
        date,
        status: 'modified',
        actualFoods,
        actualMacros,
        delta,
      };
      if (existing >= 0) {
        return statuses.map((s, i) => i === existing ? newStatus : s);
      }
      return [...statuses, newStatus];
    });
  }

  // Skip a meal
  skipMeal(plannedMealId: string, date: string = this.today()): void {
    this._mealStatuses.update(statuses => {
      const existing = statuses.findIndex(s => s.plannedMealId === plannedMealId && s.date === date);
      const newStatus: MealStatus = {
        plannedMealId,
        date,
        status: 'skipped',
      };
      if (existing >= 0) {
        return statuses.map((s, i) => i === existing ? newStatus : s);
      }
      return [...statuses, newStatus];
    });
  }

  // Get status of a meal for a specific date
  getMealStatus(plannedMealId: string, date: string = this.today()): MealStatus | undefined {
    return this._mealStatuses().find(s => s.plannedMealId === plannedMealId && s.date === date);
  }

  // Legacy methods for backward compatibility
  logMeal(meal: Omit<MealLog, 'id' | 'timestamp' | 'status'>): MealLog {
    const newLog: MealLog = {
      ...meal,
      id: crypto.randomUUID(),
      status: 'completed',
      timestamp: Date.now(),
    };
    this._mealLogs.update(logs => [...logs, newLog]);
    return newLog;
  }

  deleteMealLog(id: string): void {
    this._mealLogs.update(logs => logs.filter(l => l.id !== id));
  }

  updateMealLog(id: string, updates: Partial<MealLog>): void {
    this._mealLogs.update(logs =>
      logs.map(l => (l.id === id ? { ...l, ...updates } : l))
    );
  }

  getWeeklyProgress(weekStartDate?: Date): WeeklyProgress {
    const start = weekStartDate ?? this.getWeekStart(new Date());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const dailyProgress: DailyProgress[] = [];
    const plan = this._dietPlan();
    const logs = this._mealLogs();
    const statuses = this._mealStatuses();

    const totalPlanned: Macros = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const totalActual: Macros = { calories: 0, protein: 0, carbs: 0, fat: 0 };

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

      // Get planned for this day
      const dayPlan = plan?.days.find(d => d.day === dayName);
      const planned = dayPlan
        ? dayPlan.meals.reduce(
            (acc, m) => ({
              calories: acc.calories + m.macros.calories,
              protein: acc.protein + m.macros.protein,
              carbs: acc.carbs + m.macros.carbs,
              fat: acc.fat + m.macros.fat,
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0 }
          )
        : { calories: 0, protein: 0, carbs: 0, fat: 0 };

      // Get actual for this day
      const dayLogs = logs.filter(l => l.date === dateStr);
      const actual = dayLogs.reduce(
        (acc, l) => ({
          calories: acc.calories + l.macros.calories,
          protein: acc.protein + l.macros.protein,
          carbs: acc.carbs + l.macros.carbs,
          fat: acc.fat + l.macros.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      // Get meal statuses for this day
      const dayStatuses = statuses.filter(s => s.date === dateStr);

      dailyProgress.push({
        date: dateStr,
        planned,
        actual,
        delta: {
          calories: actual.calories - planned.calories,
          protein: actual.protein - planned.protein,
          carbs: actual.carbs - planned.carbs,
          fat: actual.fat - planned.fat,
        },
        mealStatuses: dayStatuses,
      });

      totalPlanned.calories += planned.calories;
      totalPlanned.protein += planned.protein;
      totalPlanned.carbs += planned.carbs;
      totalPlanned.fat += planned.fat;

      totalActual.calories += actual.calories;
      totalActual.protein += actual.protein;
      totalActual.carbs += actual.carbs;
      totalActual.fat += actual.fat;
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      planned: totalPlanned,
      actual: totalActual,
      delta: {
        calories: totalActual.calories - totalPlanned.calories,
        protein: totalActual.protein - totalPlanned.protein,
        carbs: totalActual.carbs - totalPlanned.carbs,
        fat: totalActual.fat - totalPlanned.fat,
      },
      dailyProgress,
    };
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
    return new Date(d.setDate(diff));
  }

  clearAll(): void {
    localStorage.removeItem(STORAGE_KEYS.DIET_PLAN);
    localStorage.removeItem(STORAGE_KEYS.MEAL_LOGS);
    localStorage.removeItem(STORAGE_KEYS.MEAL_STATUSES);
    this._dietPlan.set(null);
    this._mealLogs.set([]);
    this._mealStatuses.set([]);
  }
}
