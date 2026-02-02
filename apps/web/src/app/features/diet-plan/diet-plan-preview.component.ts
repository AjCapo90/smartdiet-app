import { Component, signal, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { DietPlanStateService, ParsedDay, ParsedMeal, ParsedFood } from './diet-plan-state.service';

@Component({
  selector: 'app-diet-plan-preview',
  standalone: true,
  imports: [FormsModule, NgClass],
  template: `
    <div class="space-y-6 pb-24 animate-fade-in">
      <!-- Header -->
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Verifica Piano</h1>
          <p class="text-gray-500 mt-1">Controlla e correggi eventuali errori</p>
        </div>
        <button (click)="cancel()" class="text-gray-500 hover:text-gray-700">
          ✕ Annulla
        </button>
      </div>

      <!-- Stats -->
      <div class="card bg-blue-50 border border-blue-200">
        <div class="flex items-center gap-3">
          <span class="text-2xl">📊</span>
          <div>
            <p class="text-blue-800 font-medium">
              {{ state.parsedData()?.days?.length || 0 }} giorni · 
              {{ totalMeals() }} pasti · 
              {{ totalFoods() }} alimenti
            </p>
            <p class="text-sm text-blue-600">Tocca una card per modificare</p>
          </div>
        </div>
      </div>

      <!-- Days Cards -->
      @for (day of state.parsedData()?.days || []; track day.day; let dayIndex = $index) {
        <div class="card" [ngClass]="{'ring-2 ring-primary-500': editingDay() === dayIndex}">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-lg text-gray-900">{{ day.day }}</h3>
            <span class="text-sm text-gray-500">{{ day.meals?.length || 0 }} pasti</span>
          </div>

          <div class="space-y-3">
            @for (meal of day.meals || []; track $index; let mealIndex = $index) {
              <div 
                class="p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                [ngClass]="{'ring-2 ring-primary-400 bg-primary-50': isEditing(dayIndex, mealIndex)}"
                (click)="toggleEdit(dayIndex, mealIndex)"
              >
                <!-- Meal Header -->
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span class="text-xl">{{ getMealIcon(meal.type) }}</span>
                    <span class="font-medium text-gray-800">{{ getMealLabel(meal.type) }}</span>
                  </div>
                  <span class="text-xs text-gray-500">{{ meal.foods?.length || 0 }} alimenti</span>
                </div>

                <!-- Foods List (always visible) -->
                <div class="space-y-1">
                  @for (food of meal.foods || []; track $index; let foodIndex = $index) {
                    @if (isEditing(dayIndex, mealIndex)) {
                      <!-- Edit Mode -->
                      <div class="flex items-center gap-2 py-1" (click)="$event.stopPropagation()">
                        <input
                          type="text"
                          [(ngModel)]="food.display"
                          class="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          (click)="$event.stopPropagation()"
                          (focus)="$event.stopPropagation()"
                          (blur)="parseFood(food)"
                        />
                        <button 
                          (click)="removeFood(dayIndex, mealIndex, foodIndex); $event.stopPropagation()"
                          class="text-red-500 hover:text-red-700 p-1"
                        >
                          🗑️
                        </button>
                      </div>
                    } @else {
                      <!-- View Mode -->
                      <p class="text-sm text-gray-600 py-1">
                        {{ food.display || formatFood(food) }}
                      </p>
                    }
                  }
                </div>

                <!-- Add Food Button (in edit mode) -->
                @if (isEditing(dayIndex, mealIndex)) {
                  <button 
                    (click)="addFood(dayIndex, mealIndex); $event.stopPropagation()"
                    class="mt-2 text-sm text-primary-600 hover:text-primary-800 flex items-center gap-1"
                  >
                    <span>+</span> Aggiungi alimento
                  </button>
                }
              </div>
            }
          </div>

          <!-- Add Meal Button -->
          <button 
            (click)="addMeal(dayIndex)"
            class="mt-3 w-full py-2 text-sm text-gray-500 hover:text-gray-700 border border-dashed border-gray-300 rounded-xl hover:border-gray-400"
          >
            + Aggiungi pasto
          </button>
        </div>
      }

      <!-- Action Buttons -->
      <div class="fixed bottom-20 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <div class="max-w-lg mx-auto flex gap-3">
          <button 
            (click)="cancel()"
            class="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50"
          >
            Annulla
          </button>
          <button 
            (click)="confirm()"
            class="flex-1 py-3 px-4 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700"
          >
            Conferma →
          </button>
        </div>
      </div>
    </div>
  `
})
export class DietPlanPreviewComponent implements OnInit {
  protected state = inject(DietPlanStateService);
  private router = inject(Router);

  editingDay = signal<number | null>(null);
  editingMeal = signal<number | null>(null);

  ngOnInit(): void {
    // If no data, redirect back
    if (!this.state.parsedData()?.days?.length) {
      this.router.navigate(['/diet-plan']);
    }
  }

  totalMeals(): number {
    return this.state.parsedData()?.days?.reduce(
      (sum, day) => sum + (day.meals?.length || 0), 0
    ) || 0;
  }

  totalFoods(): number {
    return this.state.parsedData()?.days?.reduce(
      (sum, day) => sum + day.meals?.reduce(
        (msum, meal) => msum + (meal.foods?.length || 0), 0
      ) || 0, 0
    ) || 0;
  }

  getMealIcon(type: string): string {
    const icons: Record<string, string> = {
      'breakfast': '🌅', 'b': '🌅',
      'morning_snack': '🍎', 's': '🍎', 'sm': '🍎',
      'lunch': '☀️', 'l': '☀️',
      'afternoon_snack': '🥜', 'sp': '🥜',
      'dinner': '🌙', 'd': '🌙',
    };
    return icons[type] || '🍽️';
  }

  getMealLabel(type: string): string {
    const labels: Record<string, string> = {
      'breakfast': 'Colazione', 'b': 'Colazione',
      'morning_snack': 'Spuntino mattina', 's': 'Spuntino mattina', 'sm': 'Spuntino mattina',
      'lunch': 'Pranzo', 'l': 'Pranzo',
      'afternoon_snack': 'Spuntino pomeriggio', 'sp': 'Spuntino pomeriggio',
      'dinner': 'Cena', 'd': 'Cena',
    };
    return labels[type] || type;
  }

  formatFood(food: ParsedFood): string {
    if (food.display) return food.display;
    return `${food.quantity || ''}${food.unit || ''} ${food.name}`.trim();
  }

  isEditing(dayIndex: number, mealIndex: number): boolean {
    return this.editingDay() === dayIndex && this.editingMeal() === mealIndex;
  }

  toggleEdit(dayIndex: number, mealIndex: number): void {
    if (this.isEditing(dayIndex, mealIndex)) {
      this.editingDay.set(null);
      this.editingMeal.set(null);
    } else {
      this.editingDay.set(dayIndex);
      this.editingMeal.set(mealIndex);
    }
  }

  parseFood(food: ParsedFood): void {
    // Parse display string back to structured data
    const match = food.display?.match(/^(\d+)?\s*(g|ml|pz|fette?|cucchiai?o?|scatolett[ae]?)?\s*(.+)$/i);
    if (match) {
      food.quantity = parseInt(match[1]) || 1;
      food.unit = match[2] || 'pz';
      food.name = match[3]?.trim() || food.display || '';
    }
  }

  addFood(dayIndex: number, mealIndex: number): void {
    const data = this.state.parsedData();
    if (!data) return;
    
    data.days[dayIndex].meals[mealIndex].foods.push({
      name: '',
      quantity: 1,
      unit: 'pz',
      display: ''
    });
    this.state.updateParsedData(data);
  }

  removeFood(dayIndex: number, mealIndex: number, foodIndex: number): void {
    const data = this.state.parsedData();
    if (!data) return;
    
    data.days[dayIndex].meals[mealIndex].foods.splice(foodIndex, 1);
    this.state.updateParsedData(data);
  }

  addMeal(dayIndex: number): void {
    const data = this.state.parsedData();
    if (!data) return;

    // Show meal type selector
    const mealTypes = ['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner'];
    const existingTypes = data.days[dayIndex].meals.map(m => m.type);
    const availableTypes = mealTypes.filter(t => !existingTypes.includes(t));
    
    if (availableTypes.length === 0) {
      alert('Tutti i pasti sono già presenti per questo giorno');
      return;
    }

    // Add first available type
    data.days[dayIndex].meals.push({
      type: availableTypes[0],
      foods: [{ name: '', quantity: 1, unit: 'pz', display: '' }]
    });
    this.state.updateParsedData(data);
  }

  cancel(): void {
    this.state.clear();
    this.router.navigate(['/diet-plan']);
  }

  confirm(): void {
    // Go to verification step
    this.router.navigate(['/diet-plan/verify']);
  }
}
