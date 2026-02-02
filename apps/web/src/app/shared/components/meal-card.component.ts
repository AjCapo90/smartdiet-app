import { Component, Input, Output, EventEmitter } from '@angular/core';

interface Meal {
  id: string;
  name: string;
  type: string;
  time: string;
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  logged: boolean;
}

@Component({
  selector: 'app-meal-card',
  standalone: true,
  template: `
    <div 
      class="flex items-center gap-4 p-4 rounded-xl transition-colors"
      [class.bg-gray-50]="meal.logged"
      [class.bg-white]="!meal.logged"
      [class.border]="!meal.logged"
      [class.border-dashed]="!meal.logged"
      [class.border-gray-300]="!meal.logged"
    >
      <!-- Status indicator -->
      <div 
        class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        [class.bg-primary-100]="meal.logged"
        [class.bg-gray-100]="!meal.logged"
      >
        @if (meal.logged) {
          <svg class="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        } @else {
          <span class="text-gray-400">{{ getMealIcon(meal.type) }}</span>
        }
      </div>
      
      <!-- Meal info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <h4 class="font-medium text-gray-900 truncate">{{ meal.name }}</h4>
          @if (!meal.logged) {
            <span class="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">Planned</span>
          }
        </div>
        <p class="text-sm text-gray-500">{{ meal.type }} · {{ meal.time }}</p>
      </div>
      
      <!-- Macros -->
      <div class="hidden sm:flex items-center gap-4 text-sm">
        <div class="text-center">
          <p class="font-semibold text-amber-600">{{ meal.macros.calories }}</p>
          <p class="text-xs text-gray-500">kcal</p>
        </div>
        <div class="text-center">
          <p class="font-semibold text-red-500">{{ meal.macros.protein }}g</p>
          <p class="text-xs text-gray-500">protein</p>
        </div>
        <div class="text-center">
          <p class="font-semibold text-blue-500">{{ meal.macros.carbs }}g</p>
          <p class="text-xs text-gray-500">carbs</p>
        </div>
        <div class="text-center">
          <p class="font-semibold text-yellow-600">{{ meal.macros.fat }}g</p>
          <p class="text-xs text-gray-500">fat</p>
        </div>
      </div>
      
      <!-- Action -->
      @if (!meal.logged) {
        <button class="btn btn-primary btn-sm px-3 py-1.5 text-sm">
          Log
        </button>
      }
      @if (showDelete && meal.logged) {
        <button 
          (click)="delete.emit()"
          class="p-2 text-gray-400 hover:text-red-500 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      }
    </div>
  `
})
export class MealCardComponent {
  @Input() meal!: Meal;
  @Input() showDelete = false;
  @Output() delete = new EventEmitter<void>();
  
  getMealIcon(type: string): string {
    const icons: Record<string, string> = {
      'Breakfast': '🌅',
      'Lunch': '☀️',
      'Dinner': '🌙',
      'Snack': '🍎'
    };
    return icons[type] || '🍽️';
  }
}
