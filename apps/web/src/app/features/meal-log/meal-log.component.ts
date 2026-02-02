import { Component, signal, inject, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { StorageService, MealLog, PlannedMeal, DayPlan } from '../../core/services/storage.service';

interface QuickMeal {
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  macros: { calories: number; protein: number; carbs: number; fat: number };
}

@Component({
  selector: 'app-meal-log',
  standalone: true,
  imports: [FormsModule, RouterLink, NgClass],
  template: `
    <div class="space-y-6 animate-fade-in">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Registra Pasto</h1>
          <p class="text-gray-500">Cosa hai mangiato?</p>
        </div>
      </div>

      <!-- Quick Log from Diet Plan -->
      @if (todayPlannedMeals().length > 0) {
        <div class="card">
          <h3 class="font-semibold text-gray-900 mb-4">📋 Piano di Oggi</h3>
          <p class="text-sm text-gray-500 mb-4">Tocca un pasto per loggarlo</p>
          
          <div class="grid gap-3 sm:grid-cols-2">
            @for (meal of todayPlannedMeals(); track meal.id) {
              <button 
                (click)="logPlannedMeal(meal)"
                class="p-4 rounded-xl border transition-all text-left relative"
                [ngClass]="{
                  'bg-green-50 border-green-300': meal.isLogged,
                  'bg-gray-50 border-transparent hover:bg-primary-50 hover:border-primary-300': !meal.isLogged
                }"
              >
                @if (meal.isLogged) {
                  <div class="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span class="text-white text-sm">✓</span>
                  </div>
                }
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-lg">{{ getMealIcon(meal.displayType) }}</span>
                  <span class="text-xs text-gray-500 uppercase">{{ getMealTypeLabel(meal.displayType) }}</span>
                </div>
                <h4 class="font-medium text-gray-900 text-sm">{{ meal.name }}</h4>
                <div class="flex gap-2 mt-2 text-xs text-gray-500">
                  <span>{{ meal.macros.calories }} kcal</span>
                  <span>·</span>
                  <span>{{ meal.macros.protein }}g P</span>
                  <span>·</span>
                  <span>{{ meal.macros.carbs }}g C</span>
                  <span>·</span>
                  <span>{{ meal.macros.fat }}g F</span>
                </div>
              </button>
            }
          </div>
        </div>
      }

      <!-- Manual Entry Form -->
      <div class="card">
        <h3 class="font-semibold text-gray-900 mb-4">✏️ Inserimento Manuale</h3>
        
        <form (ngSubmit)="submitManualMeal()" class="space-y-4">
          <!-- Meal Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nome Pasto</label>
            <input
              type="text"
              [(ngModel)]="manualMeal.name"
              name="name"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="es. Pollo alla griglia con insalata"
              required
            />
          </div>

          <!-- Meal Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
            <div class="grid grid-cols-4 gap-2">
              @for (type of mealTypes; track type.value) {
                <button
                  type="button"
                  (click)="manualMeal.type = type.value"
                  class="p-3 rounded-xl border-2 transition-all text-center"
                  [ngClass]="{
                    'border-primary-500 bg-primary-50 text-primary-700': manualMeal.type === type.value,
                    'border-gray-200 hover:border-gray-300': manualMeal.type !== type.value
                  }"
                >
                  <span class="text-xl">{{ type.icon }}</span>
                  <p class="text-xs mt-1">{{ type.label }}</p>
                </button>
              }
            </div>
          </div>

          <!-- Macros Grid -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Calorie</label>
              <input
                type="number"
                [(ngModel)]="manualMeal.calories"
                name="calories"
                class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="0"
                min="0"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Proteine (g)</label>
              <input
                type="number"
                [(ngModel)]="manualMeal.protein"
                name="protein"
                class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Carboidrati (g)</label>
              <input
                type="number"
                [(ngModel)]="manualMeal.carbs"
                name="carbs"
                class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Grassi (g)</label>
              <input
                type="number"
                [(ngModel)]="manualMeal.fat"
                name="fat"
                class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <!-- Voice Input (if supported) -->
          @if (voiceSupported) {
            <button
              type="button"
              (click)="startVoiceInput()"
              class="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary-300 hover:text-primary-600 transition-colors flex items-center justify-center gap-2"
              [ngClass]="{ 'border-red-300 bg-red-50 text-red-600': isListening() }"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              {{ isListening() ? 'In ascolto...' : 'Input Vocale' }}
            </button>
          }

          <button
            type="submit"
            class="w-full btn btn-primary py-3"
            [disabled]="!manualMeal.name || !manualMeal.calories"
          >
            Registra Pasto
          </button>
        </form>
      </div>

      <!-- Recent Meals -->
      @if (recentMeals().length > 0) {
        <div class="card">
          <h3 class="font-semibold text-gray-900 mb-4">⏱️ Recenti (tocca per loggare)</h3>
          <div class="space-y-2">
            @for (meal of recentMeals(); track $index) {
              <button 
                (click)="logQuickMeal(meal)"
                class="w-full p-3 bg-gray-50 rounded-xl hover:bg-primary-50 transition-colors text-left flex items-center justify-between"
              >
                <div class="flex items-center gap-3">
                  <span>{{ getMealIcon(meal.type) }}</span>
                  <div>
                    <p class="font-medium text-gray-900 text-sm">{{ meal.name }}</p>
                    <p class="text-xs text-gray-500">{{ meal.macros.calories }} kcal</p>
                  </div>
                </div>
                <span class="text-primary-600">+</span>
              </button>
            }
          </div>
        </div>
      }

      <!-- Success Toast -->
      @if (showSuccess()) {
        <div class="fixed bottom-24 left-4 right-4 bg-green-600 text-white p-4 rounded-xl shadow-lg animate-fade-in z-50">
          <div class="flex items-center gap-3">
            <span class="text-xl">✅</span>
            <div>
              <p class="font-medium">Pasto registrato!</p>
              <p class="text-sm text-green-100">{{ lastLoggedMeal() }}</p>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class MealLogComponent {
  private storage = inject(StorageService);

  mealTypes = [
    { value: 'breakfast' as const, label: 'Colazione', icon: '🌅' },
    { value: 'lunch' as const, label: 'Pranzo', icon: '☀️' },
    { value: 'dinner' as const, label: 'Cena', icon: '🌙' },
    { value: 'snack' as const, label: 'Spuntino', icon: '🍎' },
  ];

  // Meal type labels in Italian
  mealTypeLabels: Record<string, string> = {
    'breakfast': 'COLAZIONE',
    'lunch': 'PRANZO', 
    'dinner': 'CENA',
    'snack': 'SPUNTINO'
  };

  manualMeal = {
    name: '',
    type: 'lunch' as 'breakfast' | 'lunch' | 'dinner' | 'snack',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  };

  isListening = signal(false);
  showSuccess = signal(false);
  lastLoggedMeal = signal('');
  voiceSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  // Get planned meals for today with logged status
  todayPlannedMeals = computed(() => {
    const plan = this.storage.dietPlan();
    if (!plan) return [];
    
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const dayPlan = plan.days.find(d => d.day === today);
    const todayLogs = this.storage.todayLogs();
    
    return (dayPlan?.meals || []).map(meal => ({
      ...meal,
      isLogged: todayLogs.some(log => log.plannedMealId === meal.id)
    }));
  });

  // Get Italian meal type label
  getMealTypeLabel(type: string): string {
    return this.mealTypeLabels[type.toLowerCase()] || type.toUpperCase();
  }

  // Get unique recent meals (last 7 days, deduplicated by name)
  recentMeals = computed((): QuickMeal[] => {
    const logs = this.storage.mealLogs();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    const recent = logs
      .filter(l => l.timestamp > sevenDaysAgo)
      .reduce((acc, log) => {
        if (!acc.find(m => m.name.toLowerCase() === log.name.toLowerCase())) {
          acc.push({
            name: log.name,
            type: log.type,
            macros: log.macros
          });
        }
        return acc;
      }, [] as QuickMeal[])
      .slice(0, 5);
    
    return recent;
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

  logPlannedMeal(meal: PlannedMeal): void {
    const today = new Date().toISOString().split('T')[0];
    
    this.storage.logMeal({
      date: today,
      plannedMealId: meal.id,
      name: meal.name,
      type: meal.displayType, // Use displayType for log compatibility
      macros: meal.macros,
    });
    
    this.showSuccessMessage(`${meal.name} - ${meal.macros.calories} kcal`);
  }

  logQuickMeal(meal: QuickMeal): void {
    const today = new Date().toISOString().split('T')[0];
    
    this.storage.logMeal({
      date: today,
      name: meal.name,
      type: meal.type,
      macros: meal.macros,
    });
    
    this.showSuccessMessage(`${meal.name} - ${meal.macros.calories} kcal`);
  }

  submitManualMeal(): void {
    if (!this.manualMeal.name || !this.manualMeal.calories) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    this.storage.logMeal({
      date: today,
      name: this.manualMeal.name,
      type: this.manualMeal.type,
      macros: {
        calories: this.manualMeal.calories || 0,
        protein: this.manualMeal.protein || 0,
        carbs: this.manualMeal.carbs || 0,
        fat: this.manualMeal.fat || 0,
      },
    });
    
    this.showSuccessMessage(`${this.manualMeal.name} - ${this.manualMeal.calories} kcal`);
    
    // Reset form
    this.manualMeal = {
      name: '',
      type: 'lunch',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    };
  }

  startVoiceInput(): void {
    if (!this.voiceSupported) return;
    
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    
    recognition.onstart = () => {
      this.isListening.set(true);
    };
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      this.manualMeal.name = transcript;
      this.isListening.set(false);
    };
    
    recognition.onerror = () => {
      this.isListening.set(false);
    };
    
    recognition.onend = () => {
      this.isListening.set(false);
    };
    
    recognition.start();
  }

  private showSuccessMessage(text: string): void {
    this.lastLoggedMeal.set(text);
    this.showSuccess.set(true);
    
    setTimeout(() => {
      this.showSuccess.set(false);
    }, 2500);
  }
}
