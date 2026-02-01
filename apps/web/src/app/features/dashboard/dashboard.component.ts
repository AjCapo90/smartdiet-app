import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MacroRingComponent } from '../../shared/components/macro-ring.component';
import { MacroBarComponent } from '../../shared/components/macro-bar.component';
import { MealCardComponent } from '../../shared/components/meal-card.component';

interface DayProgress {
  day: string;
  shortDay: string;
  isToday: boolean;
  logged: number;
  planned: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, MacroRingComponent, MacroBarComponent, MealCardComponent],
  template: `
    <div class="space-y-6 animate-fade-in">
      <!-- Header -->
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p class="text-gray-500 mt-1">Week of {{ weekStartDate() }}</p>
        </div>
        <button routerLink="/log" class="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Log Meal
        </button>
      </div>
      
      <!-- Weekly Progress Overview -->
      <div class="card">
        <div class="flex flex-col lg:flex-row gap-8">
          <!-- Main Progress Ring -->
          <div class="flex flex-col items-center">
            <app-macro-ring 
              [percentage]="overallProgress()" 
              [size]="180"
              [strokeWidth]="12"
            />
            <p class="mt-4 text-lg font-medium text-gray-700">Weekly Progress</p>
            <p class="text-sm text-gray-500">{{ daysRemaining() }} days remaining</p>
          </div>
          
          <!-- Macro Breakdown -->
          <div class="flex-1 space-y-4">
            <h3 class="font-semibold text-gray-900">Macro Targets</h3>
            <app-macro-bar 
              label="Calories" 
              [current]="consumed().calories" 
              [target]="targets().calories"
              unit="kcal"
              color="amber"
            />
            <app-macro-bar 
              label="Protein" 
              [current]="consumed().protein" 
              [target]="targets().protein"
              unit="g"
              color="red"
            />
            <app-macro-bar 
              label="Carbs" 
              [current]="consumed().carbs" 
              [target]="targets().carbs"
              unit="g"
              color="blue"
            />
            <app-macro-bar 
              label="Fat" 
              [current]="consumed().fat" 
              [target]="targets().fat"
              unit="g"
              color="yellow"
            />
          </div>
        </div>
      </div>
      
      <!-- Week Calendar Strip -->
      <div class="card">
        <h3 class="font-semibold text-gray-900 mb-4">This Week</h3>
        <div class="flex gap-2 overflow-x-auto pb-2">
          @for (day of weekDays(); track day.day) {
            <div 
              class="flex-shrink-0 w-16 p-3 rounded-xl text-center transition-colors"
              [class.bg-primary-100]="day.isToday"
              [class.bg-gray-50]="!day.isToday"
            >
              <p class="text-xs text-gray-500 uppercase">{{ day.shortDay }}</p>
              <p class="text-lg font-semibold" [class.text-primary-700]="day.isToday">
                {{ day.logged }}/{{ day.planned }}
              </p>
              <div class="flex gap-0.5 justify-center mt-1">
                @for (i of [1,2,3,4]; track i) {
                  <div 
                    class="w-1.5 h-1.5 rounded-full"
                    [class.bg-primary-500]="i <= day.logged"
                    [class.bg-gray-300]="i > day.logged"
                  ></div>
                }
              </div>
            </div>
          }
        </div>
      </div>
      
      <!-- Today's Meals -->
      <div class="card">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-semibold text-gray-900">Today's Meals</h3>
          <a routerLink="/diet-plan" class="text-sm text-primary-600 hover:text-primary-700">View plan →</a>
        </div>
        <div class="space-y-3">
          @for (meal of todaysMeals(); track meal.id) {
            <app-meal-card [meal]="meal" />
          }
          @empty {
            <div class="text-center py-8 text-gray-500">
              <p>No meals logged today</p>
              <button routerLink="/log" class="mt-2 text-primary-600 hover:text-primary-700 font-medium">
                Log your first meal →
              </button>
            </div>
          }
        </div>
      </div>
      
      <!-- Quick Recommendations -->
      <div class="card bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <span class="text-2xl">💡</span>
          </div>
          <div class="flex-1">
            <h3 class="font-semibold text-primary-900">Today's Tip</h3>
            <p class="text-primary-800 mt-1">
              You're 15g short on protein. Add a Greek yogurt (150g) to hit your daily target!
            </p>
            <button routerLink="/recommendations" class="mt-3 text-sm font-medium text-primary-700 hover:text-primary-800">
              See all suggestions →
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent {
  // Mock data - will be replaced with real state
  targets = signal({
    calories: 14000,
    protein: 700,
    carbs: 1750,
    fat: 490
  });
  
  consumed = signal({
    calories: 8420,
    protein: 385,
    carbs: 980,
    fat: 295
  });
  
  overallProgress = computed(() => {
    const c = this.consumed();
    const t = this.targets();
    const avgPercent = (
      (c.calories / t.calories) +
      (c.protein / t.protein) +
      (c.carbs / t.carbs) +
      (c.fat / t.fat)
    ) / 4;
    return Math.round(avgPercent * 100);
  });
  
  weekStartDate = signal('Jan 27 - Feb 2');
  daysRemaining = signal(3);
  
  weekDays = signal<DayProgress[]>([
    { day: 'Monday', shortDay: 'Mon', isToday: false, logged: 4, planned: 4 },
    { day: 'Tuesday', shortDay: 'Tue', isToday: false, logged: 4, planned: 4 },
    { day: 'Wednesday', shortDay: 'Wed', isToday: false, logged: 3, planned: 4 },
    { day: 'Thursday', shortDay: 'Thu', isToday: false, logged: 4, planned: 4 },
    { day: 'Friday', shortDay: 'Fri', isToday: true, logged: 2, planned: 4 },
    { day: 'Saturday', shortDay: 'Sat', isToday: false, logged: 0, planned: 4 },
    { day: 'Sunday', shortDay: 'Sun', isToday: false, logged: 0, planned: 4 },
  ]);
  
  todaysMeals = signal([
    { id: '1', name: 'Oatmeal with Berries', type: 'Breakfast', time: '8:30 AM', macros: { calories: 420, protein: 15, carbs: 65, fat: 12 }, logged: true },
    { id: '2', name: 'Grilled Chicken Salad', type: 'Lunch', time: '1:00 PM', macros: { calories: 580, protein: 45, carbs: 25, fat: 28 }, logged: true },
    { id: '3', name: 'Salmon with Vegetables', type: 'Dinner', time: '7:00 PM', macros: { calories: 650, protein: 42, carbs: 35, fat: 35 }, logged: false },
    { id: '4', name: 'Protein Shake', type: 'Snack', time: '4:00 PM', macros: { calories: 250, protein: 30, carbs: 15, fat: 8 }, logged: false },
  ]);
}
