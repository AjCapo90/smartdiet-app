import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { tap } from 'rxjs';

interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

interface PlannedMeal {
  id: string;
  dayOfWeek: number;
  mealType: string;
  name: string;
  description?: string;
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
  };
  ingredients?: any[];
}

interface DietPlan {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  weeklyTargets: MacroTargets;
  meals: PlannedMeal[];
  createdAt: string;
  updatedAt: string;
}

interface DietPlanSummary {
  id: string;
  name: string;
  isActive: boolean;
  weeklyTargets: MacroTargets;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class DietPlanService {
  private api = inject(ApiService);

  private _activePlan = signal<DietPlan | null>(null);
  private _plans = signal<DietPlanSummary[]>([]);
  private _loading = signal(false);

  activePlan = this._activePlan.asReadonly();
  plans = this._plans.asReadonly();
  loading = this._loading.asReadonly();

  loadPlans() {
    this._loading.set(true);
    return this.api.get<DietPlanSummary[]>('/diet-plans').pipe(
      tap(plans => {
        this._plans.set(plans);
        this._loading.set(false);
      })
    );
  }

  loadActivePlan() {
    this._loading.set(true);
    return this.api.get<DietPlan>('/diet-plans/active').pipe(
      tap(plan => {
        this._activePlan.set(plan);
        this._loading.set(false);
      })
    );
  }

  getById(id: string) {
    return this.api.get<DietPlan>(`/diet-plans/${id}`);
  }

  create(data: {
    name: string;
    description?: string;
    weeklyTargets: MacroTargets;
    meals?: Omit<PlannedMeal, 'id'>[];
  }) {
    return this.api.post<DietPlan>('/diet-plans', data).pipe(
      tap(plan => {
        this._activePlan.set(plan);
        this.loadPlans().subscribe();
      })
    );
  }

  activate(id: string) {
    return this.api.post<DietPlan>(`/diet-plans/${id}/activate`).pipe(
      tap(plan => {
        this._activePlan.set(plan);
        this.loadPlans().subscribe();
      })
    );
  }

  delete(id: string) {
    return this.api.delete(`/diet-plans/${id}`).pipe(
      tap(() => {
        if (this._activePlan()?.id === id) {
          this._activePlan.set(null);
        }
        this.loadPlans().subscribe();
      })
    );
  }
}
