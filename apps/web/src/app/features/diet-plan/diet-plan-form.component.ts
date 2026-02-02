import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StorageService, DietPlan, PlannedMeal, DayPlan, Macros, FoodItem } from '../../core/services/storage.service';

interface MealInput {
  dayOfWeek: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const DAY_MAP: Record<string, string> = {
  'Monday': 'Lunedì',
  'Tuesday': 'Martedì',
  'Wednesday': 'Mercoledì',
  'Thursday': 'Giovedì',
  'Friday': 'Venerdì',
  'Saturday': 'Sabato',
  'Sunday': 'Domenica',
};

@Component({
  selector: 'app-diet-plan-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="max-w-3xl mx-auto space-y-6 pb-24 animate-fade-in">
      <!-- Header -->
      <div class="flex items-center gap-4">
        <button routerLink="/diet-plan" class="p-2 hover:bg-gray-100 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-2xl font-bold text-gray-900">Crea Dieta Manuale</h1>
      </div>
      
      <!-- Step Indicator -->
      <div class="flex items-center gap-2">
        @for (s of [1,2]; track s) {
          <div 
            class="flex-1 h-2 rounded-full"
            [class.bg-primary-500]="step() >= s"
            [class.bg-gray-200]="step() < s"
          ></div>
        }
      </div>
      
      <!-- Step 1: Weekly Targets -->
      @if (step() === 1) {
        <div class="card">
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Obiettivi Settimanali</h2>
          <p class="text-gray-500 mb-6">Inserisci i tuoi obiettivi per l'intera settimana</p>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">Calorie (kcal/sett)</label>
              <input 
                type="number" 
                [(ngModel)]="weeklyTargets.calories"
                class="input" 
                placeholder="14000"
              >
            </div>
            <div>
              <label class="label">Proteine (g/sett)</label>
              <input 
                type="number" 
                [(ngModel)]="weeklyTargets.protein"
                class="input" 
                placeholder="700"
              >
            </div>
            <div>
              <label class="label">Carboidrati (g/sett)</label>
              <input 
                type="number" 
                [(ngModel)]="weeklyTargets.carbs"
                class="input" 
                placeholder="1750"
              >
            </div>
            <div>
              <label class="label">Grassi (g/sett)</label>
              <input 
                type="number" 
                [(ngModel)]="weeklyTargets.fat"
                class="input" 
                placeholder="490"
              >
            </div>
          </div>
          
          <div class="mt-4 p-4 bg-blue-50 rounded-lg">
            <p class="text-sm text-blue-800">
              <strong>Media giornaliera:</strong> ~{{ Math.round(weeklyTargets.calories / 7) }} kcal, 
              {{ Math.round(weeklyTargets.protein / 7) }}g proteine
            </p>
          </div>
          
          <div class="flex gap-3 mt-6">
            <button routerLink="/diet-plan" class="btn btn-secondary flex-1">Annulla</button>
            <button (click)="step.set(2)" class="btn btn-primary flex-1">Avanti: Aggiungi Pasti</button>
          </div>
        </div>
      }
      
      <!-- Step 2: Meals -->
      @if (step() === 2) {
        <div class="card">
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Pasti Pianificati</h2>
          <p class="text-gray-500 mb-6">Aggiungi i pasti per ogni giorno della settimana.</p>
          
          <!-- Day selector -->
          <div class="flex gap-2 mb-4 overflow-x-auto pb-2">
            @for (day of dayNames; track $index) {
              <button
                (click)="selectedDay.set($index)"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0"
                [class.bg-primary-500]="selectedDay() === $index"
                [class.text-white]="selectedDay() === $index"
                [class.bg-gray-100]="selectedDay() !== $index"
              >
                {{ dayNamesItalian[$index] }}
                <span class="ml-1 text-xs opacity-70">({{ getMealsForDay($index).length }})</span>
              </button>
            }
          </div>
          
          <!-- Meals for selected day -->
          <div class="space-y-3 mb-4">
            @for (meal of getMealsForDay(selectedDay()); track meal.name + meal.mealType) {
              <div class="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div class="flex-1">
                  <p class="font-medium">{{ meal.name }}</p>
                  <p class="text-sm text-gray-500">{{ getMealTypeLabel(meal.mealType) }} · {{ meal.calories }} kcal · {{ meal.protein }}g P</p>
                </div>
                <button (click)="removeMeal(meal)" class="text-red-500 hover:text-red-700">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            }
          </div>
          
          <!-- Add meal form -->
          <div class="border-t pt-4">
            <h3 class="font-medium text-gray-700 mb-3">Aggiungi pasto per {{ dayNamesItalian[selectedDay()] }}</h3>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Tipo Pasto</label>
                <select [(ngModel)]="newMeal.mealType" class="input">
                  <option value="breakfast">Colazione</option>
                  <option value="lunch">Pranzo</option>
                  <option value="dinner">Cena</option>
                  <option value="snack">Spuntino</option>
                </select>
              </div>
              <div>
                <label class="label">Nome Pasto</label>
                <input type="text" [(ngModel)]="newMeal.name" class="input" placeholder="es. Pollo alla griglia">
              </div>
              <div>
                <label class="label">Calorie</label>
                <input type="number" [(ngModel)]="newMeal.calories" class="input" placeholder="500">
              </div>
              <div>
                <label class="label">Proteine (g)</label>
                <input type="number" [(ngModel)]="newMeal.protein" class="input" placeholder="30">
              </div>
              <div>
                <label class="label">Carboidrati (g)</label>
                <input type="number" [(ngModel)]="newMeal.carbs" class="input" placeholder="50">
              </div>
              <div>
                <label class="label">Grassi (g)</label>
                <input type="number" [(ngModel)]="newMeal.fat" class="input" placeholder="15">
              </div>
            </div>
            <button 
              (click)="addMeal()"
              [disabled]="!newMeal.name || !newMeal.calories"
              class="btn btn-outline w-full mt-3"
            >
              + Aggiungi Pasto
            </button>
          </div>
          
          <div class="flex gap-3 mt-6">
            <button (click)="step.set(1)" class="btn btn-secondary flex-1">Indietro</button>
            <button 
              (click)="savePlan()"
              [disabled]="meals.length === 0"
              class="btn btn-primary flex-1"
            >
              Salva Dieta
            </button>
          </div>
        </div>
        
        <!-- Summary -->
        <div class="card bg-gray-50">
          <h3 class="font-medium text-gray-700 mb-2">Riepilogo</h3>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <p>Pasti totali: <strong>{{ meals.length }}</strong></p>
            <p>Calorie settimanali: <strong>{{ totalMealCalories() }} / {{ weeklyTargets.calories }}</strong></p>
          </div>
        </div>
      }
    </div>
  `
})
export class DietPlanFormComponent {
  private router = inject(Router);
  private storage = inject(StorageService);
  
  step = signal(1);
  selectedDay = signal(0);
  
  weeklyTargets: Macros = {
    calories: 14000,
    protein: 700,
    carbs: 1750,
    fat: 490,
  };
  
  meals: MealInput[] = [];
  
  newMeal: MealInput = {
    dayOfWeek: 0,
    mealType: 'lunch',
    name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  };
  
  dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  dayNamesItalian = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
  Math = Math;

  getMealTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'breakfast': 'Colazione',
      'lunch': 'Pranzo',
      'dinner': 'Cena',
      'snack': 'Spuntino',
    };
    return labels[type] || type;
  }
  
  getMealsForDay(day: number): MealInput[] {
    return this.meals.filter(m => m.dayOfWeek === day);
  }
  
  addMeal() {
    if (!this.newMeal.name || !this.newMeal.calories) return;
    
    this.meals.push({
      ...this.newMeal,
      dayOfWeek: this.selectedDay(),
    });
    
    this.newMeal = {
      dayOfWeek: this.selectedDay(),
      mealType: 'lunch',
      name: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    };
  }
  
  removeMeal(meal: MealInput) {
    const index = this.meals.indexOf(meal);
    if (index > -1) {
      this.meals.splice(index, 1);
    }
  }
  
  totalMealCalories(): number {
    return this.meals.reduce((sum, m) => sum + m.calories, 0);
  }
  
  savePlan() {
    // Map simple types to full PlannedMeal types
    const mapMealType = (type: string): PlannedMeal['type'] => {
      const typeMap: Record<string, PlannedMeal['type']> = {
        'breakfast': 'breakfast',
        'lunch': 'lunch',
        'dinner': 'dinner',
        'snack': 'afternoon_snack', // Default snack to afternoon
      };
      return typeMap[type] || 'lunch';
    };

    // Group meals by day
    const days: DayPlan[] = [];
    
    this.dayNames.forEach((dayName, index) => {
      const dayMeals = this.getMealsForDay(index);
      if (dayMeals.length === 0) return;
      
      const meals: PlannedMeal[] = dayMeals.map(m => ({
        id: crypto.randomUUID(),
        name: m.name,
        type: mapMealType(m.mealType),
        displayType: m.mealType,
        foods: [{
          name: m.name,
          quantity: 1,
          unit: 'porzione',
          macros: {
            calories: m.calories,
            protein: m.protein,
            carbs: m.carbs,
            fat: m.fat,
          },
        }],
        macros: {
          calories: m.calories,
          protein: m.protein,
          carbs: m.carbs,
          fat: m.fat,
        },
      }));

      days.push({
        day: dayName,
        dayItalian: this.dayNamesItalian[index],
        meals,
      });
    });
    
    const plan: DietPlan = {
      id: crypto.randomUUID(),
      name: 'La Mia Dieta',
      createdAt: new Date().toISOString(),
      weeklyTargets: this.weeklyTargets,
      days,
    };
    
    this.storage.saveDietPlan(plan);
    this.router.navigate(['/dashboard']);
  }
}
