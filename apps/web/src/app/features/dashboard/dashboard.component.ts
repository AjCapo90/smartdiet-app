import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { MacroRingComponent } from '../../shared/components/macro-ring.component';
import { MacroBarComponent } from '../../shared/components/macro-bar.component';
import { StorageService } from '../../core/services/storage.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, NgClass, MacroRingComponent, MacroBarComponent],
  template: `
    <div class="space-y-6 animate-fade-in">
      <!-- Header with Delta Badge -->
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Progresso di Oggi</h1>
          <p class="text-gray-500 capitalize">{{ todayDate }}</p>
        </div>
        
        <!-- Quick Delta Badge -->
        <div 
          class="px-3 py-2 rounded-xl text-sm font-medium"
          [ngClass]="deltaStatusClass()"
        >
          {{ deltaStatusText() }}
        </div>
      </div>

      <!-- Main Progress Card -->
      <div class="card">
        <div class="flex flex-col md:flex-row items-center gap-6">
          <!-- Calorie Ring -->
          <div class="flex-shrink-0">
            <app-macro-ring
              [percentage]="caloriePercentage()"
              [size]="140"
            />
            <p class="text-center mt-2 text-sm text-gray-500">
              {{ storage.todayMacros().calories }} / {{ storage.todayPlanned().calories }} kcal
            </p>
          </div>
          
          <!-- Macro Bars -->
          <div class="flex-grow w-full space-y-4">
            <app-macro-bar
              [label]="'Proteine'"
              [current]="storage.todayMacros().protein"
              [target]="storage.todayPlanned().protein"
              [unit]="'g'"
              [color]="'red'"
              [delta]="storage.todayDelta().protein"
            />
            <app-macro-bar
              [label]="'Carboidrati'"
              [current]="storage.todayMacros().carbs"
              [target]="storage.todayPlanned().carbs"
              [unit]="'g'"
              [color]="'blue'"
              [delta]="storage.todayDelta().carbs"
            />
            <app-macro-bar
              [label]="'Grassi'"
              [current]="storage.todayMacros().fat"
              [target]="storage.todayPlanned().fat"
              [unit]="'g'"
              [color]="'yellow'"
              [delta]="storage.todayDelta().fat"
            />
          </div>
        </div>
      </div>

      <!-- Next Meal Suggestion -->
      @if (nextMeal()) {
        <a routerLink="/log" class="card bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200 hover:shadow-lg transition-shadow block">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <span class="text-2xl">{{ getMealIcon(nextMeal()!.displayType) }}</span>
              </div>
              <div>
                <p class="text-xs text-primary-600 font-medium uppercase">Prossimo pasto</p>
                <h3 class="font-semibold text-gray-900">{{ nextMeal()!.name }}</h3>
                <p class="text-sm text-gray-600">{{ nextMeal()!.macros.calories }} kcal</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm text-primary-600 font-medium">{{ loggedMealsCount().logged }}/{{ loggedMealsCount().total }}</p>
              <p class="text-xs text-gray-500">pasti loggati</p>
            </div>
          </div>
        </a>
      } @else if (storage.dietPlan() && loggedMealsCount().logged === loggedMealsCount().total && loggedMealsCount().total > 0) {
        <div class="card bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <span class="text-2xl">🎉</span>
            </div>
            <div>
              <h3 class="font-semibold text-green-800">Tutti i pasti completati!</h3>
              <p class="text-sm text-green-700">Hai seguito il piano di oggi. Ottimo lavoro!</p>
            </div>
          </div>
        </div>
      }

      <!-- Delta Card (Always Visible) -->
      <div class="card bg-gradient-to-br from-gray-50 to-gray-100">
        <h3 class="font-semibold text-gray-900 mb-4">📊 Pianificato vs Reale (Oggi)</h3>
        <div class="grid grid-cols-4 gap-3">
          <div class="text-center">
            <p class="text-xs text-gray-500 mb-1">Calorie</p>
            <p 
              class="text-lg font-bold"
              [ngClass]="getDeltaClass(storage.todayDelta().calories)"
            >
              {{ formatDelta(storage.todayDelta().calories) }}
            </p>
          </div>
          <div class="text-center">
            <p class="text-xs text-gray-500 mb-1">Proteine</p>
            <p 
              class="text-lg font-bold"
              [ngClass]="getDeltaClass(storage.todayDelta().protein)"
            >
              {{ formatDelta(storage.todayDelta().protein) }}g
            </p>
          </div>
          <div class="text-center">
            <p class="text-xs text-gray-500 mb-1">Carbo</p>
            <p 
              class="text-lg font-bold"
              [ngClass]="getDeltaClass(storage.todayDelta().carbs)"
            >
              {{ formatDelta(storage.todayDelta().carbs) }}g
            </p>
          </div>
          <div class="text-center">
            <p class="text-xs text-gray-500 mb-1">Grassi</p>
            <p 
              class="text-lg font-bold"
              [ngClass]="getDeltaClass(storage.todayDelta().fat)"
            >
              {{ formatDelta(storage.todayDelta().fat) }}g
            </p>
          </div>
        </div>
      </div>

      <!-- Weekly Overview -->
      <div class="card">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-semibold text-gray-900">Questa Settimana</h3>
          <a routerLink="/recommendations" class="text-primary-600 text-sm font-medium hover:text-primary-700">
            Suggerimenti →
          </a>
        </div>
        
        <div class="grid grid-cols-7 gap-2">
          @for (day of weekDays(); track day.name) {
            <div 
              class="text-center p-2 rounded-lg cursor-pointer transition-colors"
              [ngClass]="{
                'bg-primary-100 text-primary-700': day.isToday,
                'bg-gray-50 hover:bg-gray-100': !day.isToday
              }"
            >
              <p class="text-xs font-medium">{{ day.shortName }}</p>
              <p class="text-lg font-bold" [ngClass]="day.isToday ? 'text-primary-600' : 'text-gray-900'">
                {{ day.dayNum }}
              </p>
              @if (day.progress) {
                <div 
                  class="w-2 h-2 rounded-full mx-auto mt-1"
                  [ngClass]="{
                    'bg-green-500': day.progress.delta.calories <= 100 && day.progress.delta.calories >= -100,
                    'bg-yellow-500': day.progress.delta.calories > 100 || day.progress.delta.calories < -100,
                    'bg-red-500': day.progress.delta.calories > 300 || day.progress.delta.calories < -300
                  }"
                ></div>
              }
            </div>
          }
        </div>

        <!-- Weekly Summary -->
        <div class="mt-4 pt-4 border-t border-gray-100">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-gray-500">Obiettivo Settimanale</p>
              <p class="font-semibold text-gray-900">{{ weeklyProgress()?.planned?.calories || 0 }} kcal</p>
            </div>
            <div>
              <p class="text-gray-500">Progresso Settimanale</p>
              <p 
                class="font-semibold"
                [ngClass]="getDeltaClass(weeklyProgress()?.delta?.calories || 0)"
              >
                {{ weeklyProgress()?.actual?.calories || 0 }} kcal 
                ({{ formatDelta(weeklyProgress()?.delta?.calories || 0) }})
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-2 gap-4">
        <a routerLink="/log" class="card hover:shadow-lg transition-shadow">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <span class="text-2xl">🍽️</span>
            </div>
            <div>
              <p class="font-semibold text-gray-900">Registra Pasto</p>
              <p class="text-sm text-gray-500">Cosa hai mangiato?</p>
            </div>
          </div>
        </a>
        
        <a routerLink="/diet-plan" class="card hover:shadow-lg transition-shadow">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <span class="text-2xl">📋</span>
            </div>
            <div>
              <p class="font-semibold text-gray-900">Piano Dieta</p>
              <p class="text-sm text-gray-500">Visualizza o carica</p>
            </div>
          </div>
        </a>
      </div>

      <!-- Today's Meals -->
      @if (storage.todayLogs().length > 0) {
        <div class="card">
          <h3 class="font-semibold text-gray-900 mb-4">Pasti di Oggi</h3>
          <div class="space-y-3">
            @for (meal of storage.todayLogs(); track meal.id) {
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div class="flex items-center gap-3">
                  <span class="text-xl">{{ getMealIcon(meal.type) }}</span>
                  <div>
                    <p class="font-medium text-gray-900">{{ meal.name }}</p>
                    <p class="text-xs text-gray-500">{{ meal.macros.calories }} kcal</p>
                  </div>
                </div>
                <button 
                  (click)="deleteMeal(meal.id)"
                  class="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            }
          </div>
        </div>
      }

      <!-- No Plan Warning -->
      @if (!storage.dietPlan()) {
        <div class="card bg-amber-50 border border-amber-200">
          <div class="flex items-start gap-4">
            <span class="text-2xl">⚠️</span>
            <div>
              <h3 class="font-semibold text-amber-800">Nessun Piano Dieta</h3>
              <p class="text-sm text-amber-700 mt-1">
                Carica il piano della tua nutrizionista per attivare il tracking e i suggerimenti.
              </p>
              <a routerLink="/diet-plan" class="inline-block mt-3 text-sm font-medium text-amber-800 hover:text-amber-900">
                Carica Piano →
              </a>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class DashboardComponent {
  protected storage = inject(StorageService);

  todayDate = new Date().toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  // Get next unlogged meal
  nextMeal = computed(() => {
    const plan = this.storage.dietPlan();
    if (!plan) return null;
    
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const dayPlan = plan.days.find(d => d.day === today);
    if (!dayPlan) return null;
    
    const todayLogs = this.storage.todayLogs();
    const loggedMealIds = new Set(todayLogs.map(l => l.plannedMealId));
    
    // Find first unlogged meal
    return dayPlan.meals.find(m => !loggedMealIds.has(m.id)) || null;
  });

  // Count logged meals today
  loggedMealsCount = computed(() => {
    const plan = this.storage.dietPlan();
    if (!plan) return { logged: 0, total: 0 };
    
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const dayPlan = plan.days.find(d => d.day === today);
    if (!dayPlan) return { logged: 0, total: 0 };
    
    const todayLogs = this.storage.todayLogs();
    const loggedMealIds = new Set(todayLogs.map(l => l.plannedMealId));
    const logged = dayPlan.meals.filter(m => loggedMealIds.has(m.id)).length;
    
    return { logged, total: dayPlan.meals.length };
  });

  caloriePercentage = computed(() => {
    const planned = this.storage.todayPlanned().calories;
    if (planned <= 0) return 0;
    return Math.min(100, Math.round((this.storage.todayMacros().calories / planned) * 100));
  });

  weeklyProgress = computed(() => this.storage.getWeeklyProgress());

  weekDays = computed(() => {
    const today = new Date();
    const weekStart = this.getWeekStart(today);
    const progress = this.weeklyProgress();
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      return {
        name: date.toLocaleDateString('en-US', { weekday: 'long' }),
        shortName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: date.getDate(),
        isToday: date.toDateString() === today.toDateString(),
        progress: progress?.dailyProgress?.find(d => d.date === dateStr)
      };
    });
  });

  deltaStatusClass = computed(() => {
    const cal = this.storage.todayDelta().calories;
    if (cal === 0) return 'bg-gray-100 text-gray-600';
    if (cal > 0 && cal <= 100) return 'bg-green-100 text-green-700';
    if (cal < 0 && cal >= -100) return 'bg-green-100 text-green-700';
    if (cal > 100 || cal < -100) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  });

  deltaStatusText = computed(() => {
    const cal = this.storage.todayDelta().calories;
    const planned = this.storage.todayPlanned().calories;
    
    if (planned === 0) return '📋 Set plan first';
    if (cal === 0) return '✨ On track!';
    if (cal > 0) return `+${cal} kcal over`;
    return `${cal} kcal under`;
  });

  getDeltaClass(delta: number): string {
    if (delta === 0) return 'text-gray-600';
    if (Math.abs(delta) <= 50) return 'text-green-600';
    if (Math.abs(delta) <= 150) return 'text-yellow-600';
    return delta > 0 ? 'text-red-600' : 'text-blue-600';
  }

  formatDelta(delta: number): string {
    const rounded = Math.round(delta * 10) / 10; // Round to 1 decimal
    if (rounded === 0) return '0';
    return rounded > 0 ? `+${rounded}` : `${rounded}`;
  }

  getMealIcon(type: string): string {
    const icons: Record<string, string> = {
      'breakfast': '🌅',
      'lunch': '☀️',
      'dinner': '🌙',
      'snack': '🍎'
    };
    return icons[type.toLowerCase()] || '🍽️';
  }

  deleteMeal(id: string): void {
    this.storage.deleteMealLog(id);
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }
}
