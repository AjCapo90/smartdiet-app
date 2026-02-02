import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { DietPlanStateService, ParsedFood, ParsedDay, ParsedMeal } from './diet-plan-state.service';
import { NutritionService, NutritionData } from '../../core/services/nutrition.service';
import { StorageService, DietPlan, DayPlan, PlannedMeal, FoodItem, Macros } from '../../core/services/storage.service';

interface FoodWithContext extends ParsedFood {
  dayIndex: number;
  mealIndex: number;
  foodIndex: number;
  isExpanded?: boolean;
}

@Component({
  selector: 'app-diet-plan-verify',
  standalone: true,
  imports: [FormsModule, NgClass],
  template: `
    <div class="space-y-6 pb-32 animate-fade-in">
      <!-- Header -->
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Verifica Calorie</h1>
          <p class="text-gray-500 mt-1">Controllo valori nutrizionali</p>
        </div>
        <button (click)="back()" class="text-gray-500 hover:text-gray-700">
          ← Indietro
        </button>
      </div>

      <!-- Progress -->
      @if (isCalculating()) {
        <div class="card">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <div class="flex-1">
              <p class="font-medium text-gray-900">{{ nutrition.status() }}</p>
              <div class="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  class="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  [style.width.%]="nutrition.progress()"
                ></div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Summary Card -->
      @if (!isCalculating()) {
        <div class="card" [ngClass]="{
          'bg-green-50 border-green-200': pendingFoods().length === 0,
          'bg-amber-50 border-amber-200': pendingFoods().length > 0
        }">
          <div class="flex items-start gap-3">
            <span class="text-3xl">{{ pendingFoods().length === 0 ? '✅' : '⚠️' }}</span>
            <div>
              @if (pendingFoods().length === 0) {
                <h3 class="font-semibold text-green-800">Tutti gli alimenti verificati!</h3>
                <p class="text-sm text-green-700 mt-1">
                  {{ counts().resolved }} alimenti con valori nutrizionali calcolati
                </p>
              } @else {
                <h3 class="font-semibold text-amber-800">{{ pendingFoods().length }} alimenti da verificare</h3>
                <p class="text-sm text-amber-700 mt-1">
                  Inserisci i valori nutrizionali per completare il piano
                </p>
              }
            </div>
          </div>
        </div>

        <!-- Weekly Summary -->
        <div class="card bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
          <h3 class="font-semibold text-primary-900 mb-4">📊 Riepilogo Settimanale</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="text-center p-3 bg-white/70 rounded-xl">
              <p class="text-2xl font-bold text-primary-700">{{ weeklyTotals().calories }}</p>
              <p class="text-xs text-gray-600">kcal/settimana</p>
            </div>
            <div class="text-center p-3 bg-white/70 rounded-xl">
              <p class="text-2xl font-bold text-primary-700">{{ Math.round(weeklyTotals().calories / 7) }}</p>
              <p class="text-xs text-gray-600">kcal/giorno (media)</p>
            </div>
            <div class="col-span-2 grid grid-cols-3 gap-2">
              <div class="text-center p-2 bg-red-50 rounded-lg">
                <p class="font-semibold text-red-600">{{ weeklyTotals().protein }}g</p>
                <p class="text-xs text-gray-500">proteine</p>
              </div>
              <div class="text-center p-2 bg-blue-50 rounded-lg">
                <p class="font-semibold text-blue-600">{{ weeklyTotals().carbs }}g</p>
                <p class="text-xs text-gray-500">carbo</p>
              </div>
              <div class="text-center p-2 bg-yellow-50 rounded-lg">
                <p class="font-semibold text-yellow-600">{{ weeklyTotals().fat }}g</p>
                <p class="text-xs text-gray-500">grassi</p>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Pending Foods (if any) -->
      @if (pendingFoods().length > 0 && !isCalculating()) {
        <div class="space-y-3">
          <h2 class="font-semibold text-gray-700">⚠️ Alimenti da completare:</h2>
          
          @for (food of pendingFoods(); track food.dayIndex + '-' + food.mealIndex + '-' + food.foodIndex) {
            <div class="card border-amber-200">
              <div 
                class="flex items-center justify-between cursor-pointer"
                (click)="togglePendingExpand(food)"
              >
                <div>
                  <p class="font-medium text-gray-900">{{ food.display || food.name }}</p>
                  <p class="text-sm text-gray-500">
                    {{ getDayName(food.dayIndex) }} · {{ getMealLabel(food.mealIndex, food.dayIndex) }}
                  </p>
                </div>
                <span class="text-gray-400">{{ food.isExpanded ? '▲' : '▼' }}</span>
              </div>

              @if (food.isExpanded) {
                <div class="mt-4 pt-4 border-t border-gray-200">
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="text-xs text-gray-500 uppercase">Calorie</label>
                      <input 
                        type="number" 
                        [(ngModel)]="manualInput()[food.dayIndex + '-' + food.mealIndex + '-' + food.foodIndex].calories"
                        class="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="kcal"
                      />
                    </div>
                    <div>
                      <label class="text-xs text-gray-500 uppercase">Proteine</label>
                      <input 
                        type="number" 
                        [(ngModel)]="manualInput()[food.dayIndex + '-' + food.mealIndex + '-' + food.foodIndex].protein"
                        class="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="g"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label class="text-xs text-gray-500 uppercase">Carboidrati</label>
                      <input 
                        type="number" 
                        [(ngModel)]="manualInput()[food.dayIndex + '-' + food.mealIndex + '-' + food.foodIndex].carbs"
                        class="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="g"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label class="text-xs text-gray-500 uppercase">Grassi</label>
                      <input 
                        type="number" 
                        [(ngModel)]="manualInput()[food.dayIndex + '-' + food.mealIndex + '-' + food.foodIndex].fat"
                        class="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="g"
                        step="0.1"
                      />
                    </div>
                  </div>
                  
                  <button 
                    (click)="saveManualInput(food)"
                    class="mt-4 w-full py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
                    [disabled]="!isManualInputValid(food)"
                    [ngClass]="{'opacity-50 cursor-not-allowed': !isManualInputValid(food)}"
                  >
                    Salva
                  </button>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Daily Details -->
      @if (!isCalculating()) {
        <div class="space-y-4">
          <h2 class="font-semibold text-gray-700">📅 Dettaglio Giornaliero</h2>

          @for (day of state.parsedData()?.days || []; track day.day; let dayIndex = $index) {
            <div class="card">
              <!-- Day Header -->
              <div 
                class="flex items-center justify-between cursor-pointer"
                (click)="toggleDayExpand(dayIndex)"
              >
                <div>
                  <h3 class="font-semibold text-lg text-gray-900">{{ day.day }}</h3>
                  <p class="text-sm text-gray-500">{{ day.meals.length }} pasti</p>
                </div>
                <div class="text-right">
                  <p class="text-xl font-bold text-primary-600">{{ getDayCalories(dayIndex) }} kcal</p>
                  <p class="text-xs text-gray-500">
                    P:{{ getDayMacro(dayIndex, 'protein') }}g · 
                    C:{{ getDayMacro(dayIndex, 'carbs') }}g · 
                    G:{{ getDayMacro(dayIndex, 'fat') }}g
                  </p>
                </div>
              </div>

              <!-- Expanded Day Content -->
              @if (expandedDays().has(dayIndex)) {
                <div class="mt-4 pt-4 border-t border-gray-200 space-y-3">
                  @for (meal of day.meals; track $index; let mealIndex = $index) {
                    <div class="bg-gray-50 rounded-xl p-3">
                      <!-- Meal Header -->
                      <div 
                        class="flex items-center justify-between cursor-pointer"
                        (click)="toggleMealExpand(dayIndex, mealIndex); $event.stopPropagation()"
                      >
                        <div class="flex items-center gap-2">
                          <span class="text-lg">{{ getMealIcon(meal.type) }}</span>
                          <span class="font-medium text-gray-800">{{ getMealLabelByType(meal.type) }}</span>
                        </div>
                        <div class="text-right">
                          <span class="font-semibold text-gray-900">{{ getMealCalories(dayIndex, mealIndex) }} kcal</span>
                          <span class="text-gray-400 ml-2">{{ isMealExpanded(dayIndex, mealIndex) ? '▲' : '▼' }}</span>
                        </div>
                      </div>

                      <!-- Expanded Meal Foods -->
                      @if (isMealExpanded(dayIndex, mealIndex)) {
                        <div class="mt-3 pt-3 border-t border-gray-200 space-y-2">
                          @for (food of meal.foods; track $index) {
                            <div class="flex items-center justify-between text-sm">
                              <span class="text-gray-700">{{ food.display || food.name }}</span>
                              <div class="text-right">
                                <span class="font-medium text-gray-900">{{ food.macros?.calories || 0 }} kcal</span>
                                <span class="text-xs text-gray-400 ml-2">
                                  P:{{ food.macros?.protein || 0 }}g
                                </span>
                              </div>
                            </div>
                          }
                          <!-- Meal Macro Summary -->
                          <div class="pt-2 mt-2 border-t border-gray-300 flex justify-between text-xs text-gray-500">
                            <span>Totale pasto:</span>
                            <span>
                              P:{{ getMealMacro(dayIndex, mealIndex, 'protein') }}g · 
                              C:{{ getMealMacro(dayIndex, mealIndex, 'carbs') }}g · 
                              G:{{ getMealMacro(dayIndex, mealIndex, 'fat') }}g
                            </span>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Action Buttons -->
      <div class="fixed bottom-20 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <div class="max-w-lg mx-auto">
          @if (pendingFoods().length === 0 && !isCalculating()) {
            <button 
              (click)="savePlan()"
              class="w-full py-4 bg-primary-600 text-white rounded-xl font-semibold text-lg hover:bg-primary-700 shadow-lg"
            >
              ✓ Salva Piano Dieta
            </button>
          } @else if (!isCalculating()) {
            <button 
              disabled
              class="w-full py-4 bg-gray-300 text-gray-500 rounded-xl font-semibold text-lg cursor-not-allowed"
            >
              Completa tutti gli alimenti per salvare
            </button>
          }
        </div>
      </div>
    </div>
  `
})
export class DietPlanVerifyComponent implements OnInit {
  protected state = inject(DietPlanStateService);
  protected nutrition = inject(NutritionService);
  private storage = inject(StorageService);
  private router = inject(Router);

  isCalculating = signal(true);
  manualInput = signal<Record<string, { calories: number; protein: number; carbs: number; fat: number }>>({});
  
  pendingFoods = signal<FoodWithContext[]>([]);
  expandedDays = signal<Set<number>>(new Set([0])); // First day expanded by default
  expandedMeals = signal<Set<string>>(new Set());
  
  protected Math = Math;

  ngOnInit(): void {
    if (!this.state.parsedData()?.days?.length) {
      this.router.navigate(['/diet-plan']);
      return;
    }
    
    this.calculateNutrition();
  }

  counts() {
    return this.state.getCounts();
  }

  weeklyTotals(): Macros {
    const data = this.state.parsedData();
    if (!data) return { calories: 0, protein: 0, carbs: 0, fat: 0 };

    let totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    for (const day of data.days) {
      for (const meal of day.meals) {
        for (const food of meal.foods) {
          if (food.macros) {
            totals.calories += food.macros.calories;
            totals.protein += food.macros.protein;
            totals.carbs += food.macros.carbs;
            totals.fat += food.macros.fat;
          }
        }
      }
    }

    return {
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein * 10) / 10,
      carbs: Math.round(totals.carbs * 10) / 10,
      fat: Math.round(totals.fat * 10) / 10,
    };
  }

  getDayCalories(dayIndex: number): number {
    const day = this.state.parsedData()?.days[dayIndex];
    if (!day) return 0;
    
    return Math.round(day.meals.reduce((sum, meal) => 
      sum + meal.foods.reduce((msum, food) => msum + (food.macros?.calories || 0), 0), 0
    ));
  }

  getDayMacro(dayIndex: number, macro: 'protein' | 'carbs' | 'fat'): number {
    const day = this.state.parsedData()?.days[dayIndex];
    if (!day) return 0;
    
    const total = day.meals.reduce((sum, meal) => 
      sum + meal.foods.reduce((msum, food) => msum + (food.macros?.[macro] || 0), 0), 0
    );
    return Math.round(total * 10) / 10;
  }

  getMealCalories(dayIndex: number, mealIndex: number): number {
    const meal = this.state.parsedData()?.days[dayIndex]?.meals[mealIndex];
    if (!meal) return 0;
    
    return Math.round(meal.foods.reduce((sum, food) => sum + (food.macros?.calories || 0), 0));
  }

  getMealMacro(dayIndex: number, mealIndex: number, macro: 'protein' | 'carbs' | 'fat'): number {
    const meal = this.state.parsedData()?.days[dayIndex]?.meals[mealIndex];
    if (!meal) return 0;
    
    const total = meal.foods.reduce((sum, food) => sum + (food.macros?.[macro] || 0), 0);
    return Math.round(total * 10) / 10;
  }

  toggleDayExpand(dayIndex: number): void {
    this.expandedDays.update(set => {
      const newSet = new Set(set);
      if (newSet.has(dayIndex)) {
        newSet.delete(dayIndex);
      } else {
        newSet.add(dayIndex);
      }
      return newSet;
    });
  }

  toggleMealExpand(dayIndex: number, mealIndex: number): void {
    const key = `${dayIndex}-${mealIndex}`;
    this.expandedMeals.update(set => {
      const newSet = new Set(set);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  }

  isMealExpanded(dayIndex: number, mealIndex: number): boolean {
    return this.expandedMeals().has(`${dayIndex}-${mealIndex}`);
  }

  getMealIcon(type: string): string {
    const icons: Record<string, string> = {
      'breakfast': '🌅',
      'morning_snack': '🍎',
      'lunch': '☀️',
      'afternoon_snack': '🥜',
      'dinner': '🌙',
    };
    return icons[type] || '🍽️';
  }

  getMealLabelByType(type: string): string {
    const labels: Record<string, string> = {
      'breakfast': 'Colazione',
      'morning_snack': 'Spuntino mattina',
      'lunch': 'Pranzo',
      'afternoon_snack': 'Spuntino pomeriggio',
      'dinner': 'Cena',
    };
    return labels[type] || type;
  }

  async calculateNutrition(): Promise<void> {
    this.isCalculating.set(true);
    const data = this.state.parsedData();
    if (!data) return;

    // Collect all foods
    const allFoods: Array<{ name: string; quantity: number; unit: string; dayIndex: number; mealIndex: number; foodIndex: number }> = [];
    
    for (let dayIndex = 0; dayIndex < data.days.length; dayIndex++) {
      const day = data.days[dayIndex];
      for (let mealIndex = 0; mealIndex < day.meals.length; mealIndex++) {
        const meal = day.meals[mealIndex];
        for (let foodIndex = 0; foodIndex < meal.foods.length; foodIndex++) {
          const food = meal.foods[foodIndex];
          allFoods.push({
            name: food.name,
            quantity: food.quantity || 1,
            unit: food.unit || 'pz',
            dayIndex,
            mealIndex,
            foodIndex
          });
        }
      }
    }

    // Lookup nutrition for all foods
    const result = await this.nutrition.lookupBulk(
      allFoods.map(f => ({ name: f.name, quantity: f.quantity, unit: f.unit }))
    );

    // Update state with results
    const pending: FoodWithContext[] = [];
    const manualInputs: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {};

    for (let i = 0; i < result.results.length; i++) {
      const lookupResult = result.results[i];
      const { dayIndex, mealIndex, foodIndex } = allFoods[i];
      
      if (lookupResult.nutrition) {
        this.state.updateFoodMacros(dayIndex, mealIndex, foodIndex, {
          calories: lookupResult.nutrition.calories,
          protein: lookupResult.nutrition.protein,
          carbs: lookupResult.nutrition.carbs,
          fat: lookupResult.nutrition.fat
        });
        
        // Also update source
        const food = data.days[dayIndex].meals[mealIndex].foods[foodIndex];
        food.source = lookupResult.nutrition.source;
      } else {
        const food = data.days[dayIndex].meals[mealIndex].foods[foodIndex];
        pending.push({
          ...food,
          dayIndex,
          mealIndex,
          foodIndex,
          isExpanded: pending.length === 0 // Auto-expand first one
        });
        
        // Initialize manual input
        const key = `${dayIndex}-${mealIndex}-${foodIndex}`;
        manualInputs[key] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }
    }

    this.pendingFoods.set(pending);
    this.manualInput.set(manualInputs);
    this.isCalculating.set(false);
  }

  getDayName(dayIndex: number): string {
    return this.state.parsedData()?.days[dayIndex]?.day || '';
  }

  getMealLabel(mealIndex: number, dayIndex: number): string {
    const meal = this.state.parsedData()?.days[dayIndex]?.meals[mealIndex];
    return this.getMealLabelByType(meal?.type || '');
  }

  togglePendingExpand(food: FoodWithContext): void {
    this.pendingFoods.update(foods => 
      foods.map(f => 
        f === food ? { ...f, isExpanded: !f.isExpanded } : f
      )
    );
  }

  isManualInputValid(food: FoodWithContext): boolean {
    const key = `${food.dayIndex}-${food.mealIndex}-${food.foodIndex}`;
    const input = this.manualInput()[key];
    return input && input.calories > 0;
  }

  saveManualInput(food: FoodWithContext): void {
    const key = `${food.dayIndex}-${food.mealIndex}-${food.foodIndex}`;
    const input = this.manualInput()[key];
    
    if (!input || input.calories <= 0) return;

    // Update state
    this.state.updateFoodMacros(food.dayIndex, food.mealIndex, food.foodIndex, {
      calories: input.calories,
      protein: input.protein || 0,
      carbs: input.carbs || 0,
      fat: input.fat || 0
    });

    // Remove from pending
    this.pendingFoods.update(foods => 
      foods.filter(f => !(f.dayIndex === food.dayIndex && f.mealIndex === food.mealIndex && f.foodIndex === food.foodIndex))
    );
  }

  back(): void {
    this.router.navigate(['/diet-plan/preview']);
  }

  savePlan(): void {
    const data = this.state.parsedData();
    if (!data) return;

    // Convert to DietPlan format
    const dietPlan = this.convertToDietPlan(data);
    
    // Save to storage
    this.storage.saveDietPlan(dietPlan);
    
    // Clear state and navigate
    this.state.clear();
    this.router.navigate(['/diet-plan']);
  }

  private convertToDietPlan(data: any): DietPlan {
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
        'Lunedì': 'Monday', 'Martedì': 'Tuesday', 'Mercoledì': 'Wednesday',
        'Giovedì': 'Thursday', 'Venerdì': 'Friday', 'Sabato': 'Saturday', 'Domenica': 'Sunday',
      };
      return map[italian] || italian;
    };

    const weeklyTotals = this.weeklyTotals();

    return {
      id: crypto.randomUUID(),
      name: data.planName || 'La Mia Dieta',
      createdAt: new Date().toISOString(),
      notes: data.notes,
      weeklyTargets: weeklyTotals,
      days: data.days.map((day: any) => ({
        day: mapDayName(day.day),
        dayItalian: day.day,
        meals: day.meals.map((meal: any) => {
          const mealMacros = meal.foods.reduce(
            (acc: Macros, f: any) => ({
              calories: acc.calories + (f.macros?.calories || 0),
              protein: acc.protein + (f.macros?.protein || 0),
              carbs: acc.carbs + (f.macros?.carbs || 0),
              fat: acc.fat + (f.macros?.fat || 0),
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0 }
          );

          return {
            id: crypto.randomUUID(),
            name: this.getMealLabelByType(meal.type),
            type: meal.type as PlannedMeal['type'],
            displayType: mapDisplayType(meal.type),
            time: meal.time,
            foods: meal.foods.map((f: any) => ({
              name: f.name,
              quantity: f.quantity || 1,
              unit: f.unit || 'pz',
              isOptional: f.isOptional,
              macros: f.macros || { calories: 0, protein: 0, carbs: 0, fat: 0 },
            })),
            macros: {
              calories: Math.round(mealMacros.calories),
              protein: Math.round(mealMacros.protein * 10) / 10,
              carbs: Math.round(mealMacros.carbs * 10) / 10,
              fat: Math.round(mealMacros.fat * 10) / 10,
            },
          };
        }),
      })),
    };
  }
}
