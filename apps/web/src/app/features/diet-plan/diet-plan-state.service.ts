import { Injectable, signal } from '@angular/core';

export interface ParsedFood {
  name: string;
  quantity?: number;
  unit?: string;
  display?: string;
  macros?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  needsManualInput?: boolean;
  source?: string;
}

export interface ParsedMeal {
  type: string;
  time?: string;
  foods: ParsedFood[];
}

export interface ParsedDay {
  day: string;
  meals: ParsedMeal[];
}

export interface ParsedPlan {
  days: ParsedDay[];
  planName?: string;
  notes?: string[];
}

export type FlowStep = 'upload' | 'preview' | 'verify' | 'complete';

@Injectable({ providedIn: 'root' })
export class DietPlanStateService {
  // Current step in the flow
  currentStep = signal<FlowStep>('upload');
  
  // Parsed data from OCR
  private _parsedData = signal<ParsedPlan | null>(null);
  parsedData = this._parsedData.asReadonly();

  // Foods that need manual nutrition input
  private _pendingFoods = signal<Array<{ dayIndex: number; mealIndex: number; foodIndex: number; food: ParsedFood }>>([]);
  pendingFoods = this._pendingFoods.asReadonly();

  // Verification progress
  verificationProgress = signal(0);
  verificationStatus = signal('');

  // Set parsed data from OCR
  setParsedData(data: any): void {
    // Normalize the data format
    const normalized = this.normalizeData(data);
    this._parsedData.set(normalized);
    this.currentStep.set('preview');
  }

  // Update parsed data (after edits)
  updateParsedData(data: ParsedPlan): void {
    this._parsedData.set({ ...data });
  }

  // Set pending foods that need manual input
  setPendingFoods(foods: Array<{ dayIndex: number; mealIndex: number; foodIndex: number; food: ParsedFood }>): void {
    this._pendingFoods.set(foods);
  }

  // Update a specific food's macros
  updateFoodMacros(dayIndex: number, mealIndex: number, foodIndex: number, macros: ParsedFood['macros']): void {
    const data = this._parsedData();
    if (!data) return;

    data.days[dayIndex].meals[mealIndex].foods[foodIndex].macros = macros;
    data.days[dayIndex].meals[mealIndex].foods[foodIndex].needsManualInput = false;
    this._parsedData.set({ ...data });

    // Remove from pending
    this._pendingFoods.update(pending => 
      pending.filter(p => !(p.dayIndex === dayIndex && p.mealIndex === mealIndex && p.foodIndex === foodIndex))
    );
  }

  // Clear all state
  clear(): void {
    this._parsedData.set(null);
    this._pendingFoods.set([]);
    this.currentStep.set('upload');
    this.verificationProgress.set(0);
    this.verificationStatus.set('');
  }

  // Normalize data from various formats
  private normalizeData(data: any): ParsedPlan {
    const dayMap: Record<string, string> = {
      'Lun': 'Lunedì', 'Mar': 'Martedì', 'Mer': 'Mercoledì',
      'Gio': 'Giovedì', 'Ven': 'Venerdì', 'Sab': 'Sabato', 'Dom': 'Domenica',
      'Monday': 'Lunedì', 'Tuesday': 'Martedì', 'Wednesday': 'Mercoledì',
      'Thursday': 'Giovedì', 'Friday': 'Venerdì', 'Saturday': 'Sabato', 'Sunday': 'Domenica',
    };
    
    const typeMap: Record<string, string> = {
      'b': 'breakfast', 's': 'morning_snack', 'l': 'lunch', 
      'sp': 'afternoon_snack', 'd': 'dinner'
    };

    const days: ParsedDay[] = (data.days || []).map((day: any) => ({
      day: dayMap[day.day] || day.day,
      meals: (day.meals || []).map((meal: any) => {
        const mealType = typeMap[meal.t] || meal.type || meal.t;
        const foods: ParsedFood[] = (meal.f || meal.foods || []).map((food: any) => {
          if (typeof food === 'string') {
            // Parse "40g avena" format
            const match = food.match(/^(\d+)?\s*(g|ml|pz|fette?|scatolett[ae]?)?\s*(.+)$/i);
            if (match) {
              return {
                name: match[3]?.trim() || food,
                quantity: parseInt(match[1]) || 1,
                unit: match[2] || 'pz',
                display: food,
                needsManualInput: true
              };
            }
            return { name: food, quantity: 1, unit: 'pz', display: food, needsManualInput: true };
          }
          return {
            ...food,
            display: food.display || `${food.quantity || ''}${food.unit || ''} ${food.name}`.trim(),
            needsManualInput: !food.macros
          };
        });
        
        return {
          type: mealType,
          time: meal.time,
          foods,
        };
      })
    }));

    return {
      days,
      planName: data.planName,
      notes: data.notes
    };
  }

  // Check if all foods have macros
  isComplete(): boolean {
    const data = this._parsedData();
    if (!data) return false;

    for (const day of data.days) {
      for (const meal of day.meals) {
        for (const food of meal.foods) {
          if (!food.macros || food.needsManualInput) {
            return false;
          }
        }
      }
    }
    return true;
  }

  // Get total counts
  getCounts(): { days: number; meals: number; foods: number; resolved: number; pending: number } {
    const data = this._parsedData();
    if (!data) return { days: 0, meals: 0, foods: 0, resolved: 0, pending: 0 };

    let meals = 0, foods = 0, resolved = 0, pending = 0;

    for (const day of data.days) {
      meals += day.meals.length;
      for (const meal of day.meals) {
        foods += meal.foods.length;
        for (const food of meal.foods) {
          if (food.macros && !food.needsManualInput) {
            resolved++;
          } else {
            pending++;
          }
        }
      }
    }

    return { days: data.days.length, meals, foods, resolved, pending };
  }
}
