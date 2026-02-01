import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { tap } from 'rxjs';

interface MacroValues {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

interface FoodItem {
  name: string;
  quantity: number;
  unit: string;
  macros: MacroValues;
}

interface MealLog {
  id: string;
  mealType: string;
  inputMethod: string;
  rawInput: string;
  name: string;
  parsedItems: FoodItem[];
  confidence?: number;
  macros: MacroValues;
  loggedAt: string;
  notes?: string;
  isSubstitute: boolean;
  createdAt: string;
}

interface ParsedMealResponse {
  name: string;
  items: FoodItem[];
  macros: MacroValues;
  confidence: number;
  suggestions?: string[];
}

interface MealFilters {
  startDate?: string;
  endDate?: string;
  mealType?: string;
  limit?: number;
  offset?: number;
}

@Injectable({ providedIn: 'root' })
export class MealService {
  private api = inject(ApiService);

  private _meals = signal<MealLog[]>([]);
  private _loading = signal(false);

  meals = this._meals.asReadonly();
  loading = this._loading.asReadonly();

  loadMeals(filters?: MealFilters) {
    this._loading.set(true);
    return this.api.get<MealLog[]>('/meals', filters as any).pipe(
      tap(meals => {
        this._meals.set(meals);
        this._loading.set(false);
      })
    );
  }

  getById(id: string) {
    return this.api.get<MealLog>(`/meals/${id}`);
  }

  parseMeal(input: string, inputMethod: 'text' | 'voice') {
    return this.api.post<ParsedMealResponse>('/meals/parse', { input, inputMethod });
  }

  logMeal(data: {
    mealType: string;
    inputMethod: string;
    rawInput: string;
    name: string;
    items: FoodItem[];
    macros: MacroValues;
    confidence?: number;
    loggedAt?: string;
    notes?: string;
  }) {
    return this.api.post<MealLog>('/meals', data).pipe(
      tap(meal => {
        this._meals.update(meals => [meal, ...meals]);
      })
    );
  }

  updateMeal(id: string, data: Partial<{
    name: string;
    mealType: string;
    items: FoodItem[];
    macros: MacroValues;
    notes: string;
  }>) {
    return this.api.put<MealLog>(`/meals/${id}`, data).pipe(
      tap(updatedMeal => {
        this._meals.update(meals => 
          meals.map(m => m.id === id ? updatedMeal : m)
        );
      })
    );
  }

  deleteMeal(id: string) {
    return this.api.delete(`/meals/${id}`).pipe(
      tap(() => {
        this._meals.update(meals => meals.filter(m => m.id !== id));
      })
    );
  }
}
