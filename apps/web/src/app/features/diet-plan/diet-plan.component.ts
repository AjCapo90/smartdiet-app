import { Component, signal, inject, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { OcrService, ParsedDietPlan, ParsedMeal } from '../../core/services/ocr.service';
import { StorageService, DietPlan, DayPlan, PlannedMeal, FoodItem } from '../../core/services/storage.service';
import { DietPlanStateService } from './diet-plan-state.service';

@Component({
  selector: 'app-diet-plan',
  standalone: true,
  imports: [RouterLink, NgClass],
  template: `
    <div class="space-y-6 pb-24 animate-fade-in">
      <!-- Header -->
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            {{ activePlan()?.name || 'Nessuna Dieta' }}
          </h1>
          @if (activePlan()) {
            <p class="text-gray-500 mt-1">
              {{ activePlan()?.weeklyTargets?.calories || 0 }} kcal/settimana
            </p>
          }
        </div>
        <div class="flex gap-2">
          <label class="btn btn-primary cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            📷 Carica Foto
            <input 
              type="file" 
              accept="image/*"
              class="hidden" 
              (change)="onFileSelected($event)"
            />
          </label>
        </div>
      </div>

      <!-- OCR Processing Modal -->
      @if (ocr.isProcessing()) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div class="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Analisi con AI</h3>
            <p class="text-gray-500 mb-4">{{ ocr.status() }}</p>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div 
                class="bg-primary-600 h-2 rounded-full transition-all duration-300"
                [style.width.%]="ocr.progress()"
              ></div>
            </div>
            <p class="text-sm text-gray-400 mt-2">{{ ocr.progress() }}%</p>
          </div>
        </div>
      }

      <!-- Error Message -->
      @if (errorMessage()) {
        <div class="card bg-red-50 border border-red-200">
          <div class="flex items-start gap-3">
            <span class="text-2xl">❌</span>
            <div class="flex-1">
              <h3 class="font-semibold text-red-800">Errore</h3>
              <p class="text-sm text-red-700 mt-1">{{ errorMessage() }}</p>
              <button 
                (click)="errorMessage.set(null)"
                class="text-sm text-red-600 hover:text-red-800 mt-2"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      }

      <!-- No Plan State -->
      @if (!activePlan()) {
        <div class="card text-center py-12">
          <div class="text-6xl mb-4">📋</div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Nessuna Dieta Caricata</h3>
          <p class="text-gray-500 mb-6">
            Scatta una foto della tua dieta dalla nutrizionista.<br>
            L'AI la analizzerà ed estrarrà tutti i pasti automaticamente.
          </p>
          <label class="btn btn-primary cursor-pointer inline-flex">
            📷 Scatta Foto Dieta
            <input type="file" accept="image/*" class="hidden" (change)="onFileSelected($event)" />
          </label>
        </div>
      }

      @if (activePlan()) {
        <!-- Weekly Targets Card -->
        <div class="card">
          <h3 class="font-semibold text-gray-900 mb-4">Obiettivi Settimanali</h3>
          <div class="grid grid-cols-4 gap-3">
            <div class="text-center p-3 bg-amber-50 rounded-xl">
              <p class="text-xl font-bold text-amber-600">{{ activePlan()?.weeklyTargets?.calories || 0 }}</p>
              <p class="text-xs text-gray-600">kcal</p>
            </div>
            <div class="text-center p-3 bg-red-50 rounded-xl">
              <p class="text-xl font-bold text-red-500">{{ activePlan()?.weeklyTargets?.protein || 0 }}g</p>
              <p class="text-xs text-gray-600">proteine</p>
            </div>
            <div class="text-center p-3 bg-blue-50 rounded-xl">
              <p class="text-xl font-bold text-blue-500">{{ activePlan()?.weeklyTargets?.carbs || 0 }}g</p>
              <p class="text-xs text-gray-600">carbo</p>
            </div>
            <div class="text-center p-3 bg-yellow-50 rounded-xl">
              <p class="text-xl font-bold text-yellow-600">{{ activePlan()?.weeklyTargets?.fat || 0 }}g</p>
              <p class="text-xs text-gray-600">grassi</p>
            </div>
          </div>
        </div>

        <!-- Notes -->
        @if (activePlan()?.notes?.length) {
          <div class="card bg-blue-50 border border-blue-200">
            <h3 class="font-semibold text-blue-800 mb-2">📝 Note dalla nutrizionista</h3>
            <ul class="text-sm text-blue-700 space-y-1">
              @for (note of activePlan()?.notes; track note) {
                <li>• {{ note }}</li>
              }
            </ul>
          </div>
        }
      
        <!-- Week Grid -->
        <div class="space-y-4">
          @for (day of weekPlan(); track day.day) {
            <div class="card">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="font-semibold text-gray-900">{{ day.dayItalian }}</h3>
                  <p class="text-sm text-gray-500">{{ getDayMacros(day) }} kcal</p>
                </div>
                @if (isToday(day.day)) {
                  <span class="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                    Oggi
                  </span>
                }
              </div>
              
              <div class="space-y-3">
                @for (meal of day.meals; track meal.id) {
                  <div 
                    class="p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                    (click)="toggleMealExpand(meal.id)"
                  >
                    <!-- Meal Header -->
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <span class="text-2xl">{{ getMealIcon(meal.displayType) }}</span>
                        <div>
                          <h4 class="font-medium text-gray-900">{{ getMealTypeLabel(meal.type) }}</h4>
                          @if (meal.time) {
                            <p class="text-xs text-gray-500">{{ meal.time }}</p>
                          }
                        </div>
                      </div>
                      <div class="text-right">
                        <p class="font-semibold text-gray-900">{{ meal.macros.calories }} kcal</p>
                        <p class="text-xs text-gray-500">
                          P:{{ meal.macros.protein }}g · C:{{ meal.macros.carbs }}g · G:{{ meal.macros.fat }}g
                        </p>
                      </div>
                    </div>

                    <!-- Expanded Foods List -->
                    @if (expandedMeals().has(meal.id)) {
                      <div class="mt-4 pt-4 border-t border-gray-200 space-y-2">
                        @for (food of meal.foods; track food.name) {
                          <div class="flex items-center justify-between text-sm">
                            <span class="text-gray-700" [ngClass]="{'italic text-gray-400': food.isOptional}">
                              {{ food.isOptional ? '(opz.) ' : '' }}{{ food.quantity }}{{ food.unit }} {{ food.name }}
                            </span>
                            <span class="text-gray-500">{{ food.macros.calories }} kcal</span>
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }
        </div>

        <!-- Actions -->
        <div class="card bg-gray-50">
          <button 
            (click)="clearPlan()"
            class="w-full py-3 text-red-600 hover:text-red-800 font-medium"
          >
            🗑️ Elimina dieta e ricarica
          </button>
        </div>
      }
    </div>
  `
})
export class DietPlanComponent {
  protected ocr = inject(OcrService);
  private storage = inject(StorageService);
  private stateService = inject(DietPlanStateService);
  private router = inject(Router);

  activePlan = this.storage.dietPlan;
  errorMessage = signal<string | null>(null);
  expandedMeals = signal<Set<string>>(new Set());

  weekPlan = computed(() => {
    const plan = this.activePlan();
    if (!plan) return [];
    return plan.days;
  });

  getMealIcon(type: string): string {
    const icons: Record<string, string> = {
      'breakfast': '🌅',
      'lunch': '☀️',
      'dinner': '🌙',
      'snack': '🍎'
    };
    return icons[type.toLowerCase()] || '🍽️';
  }

  getMealTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'breakfast': 'Colazione',
      'morning_snack': 'Spuntino mattina',
      'lunch': 'Pranzo',
      'afternoon_snack': 'Spuntino pomeriggio',
      'dinner': 'Cena',
    };
    return labels[type] || type;
  }

  getDayMacros(day: DayPlan): number {
    return day.meals.reduce((sum, m) => sum + m.macros.calories, 0);
  }

  isToday(dayName: string): boolean {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return dayName === today;
  }

  toggleMealExpand(mealId: string): void {
    this.expandedMeals.update(set => {
      const newSet = new Set(set);
      if (newSet.has(mealId)) {
        newSet.delete(mealId);
      } else {
        newSet.add(mealId);
      }
      return newSet;
    });
  }

  clearPlan(): void {
    if (confirm('Sei sicuro di voler eliminare la dieta?')) {
      this.storage.clearAll();
    }
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.errorMessage.set(null);

    try {
      // Parse using AI Vision
      const parsed = await this.ocr.parseDietPlanFromImage(file);

      // Validate
      if (!parsed.days || parsed.days.length === 0) {
        throw new Error('Non sono riuscito a estrarre pasti dalla foto. Prova con una foto più nitida.');
      }

      // Store in state service and navigate to preview
      this.stateService.setParsedData(parsed);
      this.router.navigate(['/diet-plan/preview']);

    } catch (error) {
      console.error('OCR Error:', error);
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Errore durante l\'analisi della foto'
      );
    }

    // Reset input
    input.value = '';
  }

  private convertToDietPlan(parsed: ParsedDietPlan): DietPlan {
    const mapDisplayType = (type: string): 'breakfast' | 'lunch' | 'dinner' | 'snack' => {
      switch (type) {
        case 'breakfast': return 'breakfast';
        case 'lunch': return 'lunch';
        case 'dinner': return 'dinner';
        default: return 'snack';
      }
    };

    const mapDayName = (italian: string): string => {
      const map: Record<string, string> = {
        'Lunedì': 'Monday',
        'Martedì': 'Tuesday',
        'Mercoledì': 'Wednesday',
        'Giovedì': 'Thursday',
        'Venerdì': 'Friday',
        'Sabato': 'Saturday',
        'Domenica': 'Sunday',
      };
      return map[italian] || italian;
    };

    return {
      id: crypto.randomUUID(),
      name: parsed.planName || 'La Mia Dieta',
      createdAt: new Date().toISOString(),
      notes: parsed.notes,
      weeklyTargets: parsed.weeklyTotals,
      days: parsed.days.map(day => ({
        day: mapDayName(day.day),
        dayItalian: day.day,
        meals: day.meals.map(meal => ({
          id: crypto.randomUUID(),
          name: this.getMealTypeLabel(meal.type),
          type: meal.type as PlannedMeal['type'],
          displayType: mapDisplayType(meal.type),
          time: meal.time,
          foods: meal.foods.map(f => ({
            name: f.name,
            quantity: f.quantity,
            unit: f.unit,
            isOptional: f.isOptional,
            macros: f.macros,
          })),
          macros: meal.totalMacros,
        })),
      })),
    };
  }
}
