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

interface MacroPercentages {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  overall: number;
}

interface DailyProgress {
  date: string;
  dayOfWeek: number;
  consumed: MacroValues;
  mealCount: number;
}

interface WeekProgress {
  dietPlanId: string;
  dietPlanName: string;
  weekStart: string;
  weekEnd: string;
  targets: MacroValues;
  consumed: MacroValues;
  remaining: MacroValues;
  percentages: MacroPercentages;
  daysLogged: number;
  daysElapsed: number;
  totalMealsLogged: number;
  plannedMealsCount: number;
  dailyBreakdown: DailyProgress[];
}

interface Recommendation {
  id: string;
  type: string;
  priority: 'required' | 'suggested' | 'optional';
  mealType?: string;
  dayOfWeek?: number;
  originalMeal?: string;
  suggestion: string;
  reason: string;
  macroImpact: Partial<MacroValues>;
}

interface RecommendationsResponse {
  remaining: MacroValues;
  dailyTargetForRemaining: MacroValues;
  daysLeft: number;
  recommendations: Recommendation[];
}

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private api = inject(ApiService);

  private _weekProgress = signal<WeekProgress | null>(null);
  private _recommendations = signal<RecommendationsResponse | null>(null);
  private _loading = signal(false);

  weekProgress = this._weekProgress.asReadonly();
  recommendations = this._recommendations.asReadonly();
  loading = this._loading.asReadonly();

  loadWeekProgress(weekStart?: string) {
    this._loading.set(true);
    const path = weekStart ? `/progress/week/${weekStart}` : '/progress/week';
    return this.api.get<WeekProgress>(path).pipe(
      tap(progress => {
        this._weekProgress.set(progress);
        this._loading.set(false);
      })
    );
  }

  loadRecommendations() {
    return this.api.get<RecommendationsResponse>('/progress/recommendations').pipe(
      tap(recommendations => {
        this._recommendations.set(recommendations);
      })
    );
  }

  // Computed helpers
  getOverallPercentage(): number {
    return this._weekProgress()?.percentages.overall ?? 0;
  }

  getDaysRemaining(): number {
    const progress = this._weekProgress();
    if (!progress) return 7;
    return 7 - progress.daysElapsed;
  }

  isOnTrack(): boolean {
    const progress = this._weekProgress();
    if (!progress) return true;
    
    // On track if we're at least at expected percentage for elapsed days
    const expectedPercent = (progress.daysElapsed / 7) * 100;
    return progress.percentages.overall >= expectedPercent * 0.9; // 10% buffer
  }
}
