import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface PlannedMeal {
  id: string;
  name: string;
  type: string;
  macros: { calories: number; protein: number; carbs: number; fat: number };
}

interface DayPlan {
  day: string;
  shortDay: string;
  meals: PlannedMeal[];
}

@Component({
  selector: 'app-diet-plan',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="space-y-6 animate-fade-in">
      <!-- Header -->
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ activePlan().name }}</h1>
          <p class="text-gray-500 mt-1">Weekly targets: {{ activePlan().weeklyTargets.calories }} kcal</p>
        </div>
        <div class="flex gap-2">
          <button routerLink="/diet-plan/new" class="btn btn-outline">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            New Plan
          </button>
          <button class="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Upload Photo
          </button>
        </div>
      </div>
      
      <!-- Weekly Targets Card -->
      <div class="card">
        <h3 class="font-semibold text-gray-900 mb-4">Weekly Macro Targets</h3>
        <div class="grid grid-cols-4 gap-4">
          <div class="text-center p-4 bg-amber-50 rounded-xl">
            <p class="text-2xl font-bold text-amber-600">{{ activePlan().weeklyTargets.calories }}</p>
            <p class="text-sm text-gray-600">kcal</p>
          </div>
          <div class="text-center p-4 bg-red-50 rounded-xl">
            <p class="text-2xl font-bold text-red-500">{{ activePlan().weeklyTargets.protein }}g</p>
            <p class="text-sm text-gray-600">protein</p>
          </div>
          <div class="text-center p-4 bg-blue-50 rounded-xl">
            <p class="text-2xl font-bold text-blue-500">{{ activePlan().weeklyTargets.carbs }}g</p>
            <p class="text-sm text-gray-600">carbs</p>
          </div>
          <div class="text-center p-4 bg-yellow-50 rounded-xl">
            <p class="text-2xl font-bold text-yellow-600">{{ activePlan().weeklyTargets.fat }}g</p>
            <p class="text-sm text-gray-600">fat</p>
          </div>
        </div>
      </div>
      
      <!-- Week Grid -->
      <div class="space-y-4">
        @for (day of weekPlan(); track day.day) {
          <div class="card">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold text-gray-900">{{ day.day }}</h3>
              <span class="text-sm text-gray-500">{{ getDayMacros(day) }} kcal</span>
            </div>
            
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              @for (meal of day.meals; track meal.id) {
                <div class="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-lg">{{ getMealIcon(meal.type) }}</span>
                    <span class="text-xs text-gray-500 uppercase">{{ meal.type }}</span>
                  </div>
                  <h4 class="font-medium text-gray-900 text-sm">{{ meal.name }}</h4>
                  <div class="flex gap-2 mt-2 text-xs text-gray-500">
                    <span>{{ meal.macros.calories }} kcal</span>
                    <span>·</span>
                    <span>{{ meal.macros.protein }}g P</span>
                  </div>
                </div>
              }
              
              @if (day.meals.length < 4) {
                <button class="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary-400 hover:bg-primary-50 transition-colors flex flex-col items-center justify-center text-gray-400 hover:text-primary-600">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span class="text-xs mt-1">Add meal</span>
                </button>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class DietPlanComponent {
  activePlan = signal({
    id: '1',
    name: 'My Diet Plan',
    weeklyTargets: {
      calories: 14000,
      protein: 700,
      carbs: 1750,
      fat: 490
    }
  });
  
  weekPlan = signal<DayPlan[]>([
    {
      day: 'Monday',
      shortDay: 'Mon',
      meals: [
        { id: '1', name: 'Oatmeal with Berries', type: 'Breakfast', macros: { calories: 420, protein: 15, carbs: 65, fat: 12 } },
        { id: '2', name: 'Grilled Chicken Salad', type: 'Lunch', macros: { calories: 580, protein: 45, carbs: 25, fat: 28 } },
        { id: '3', name: 'Salmon with Vegetables', type: 'Dinner', macros: { calories: 650, protein: 42, carbs: 35, fat: 35 } },
        { id: '4', name: 'Protein Shake', type: 'Snack', macros: { calories: 250, protein: 30, carbs: 15, fat: 8 } },
      ]
    },
    {
      day: 'Tuesday',
      shortDay: 'Tue',
      meals: [
        { id: '5', name: 'Eggs on Toast', type: 'Breakfast', macros: { calories: 380, protein: 22, carbs: 35, fat: 18 } },
        { id: '6', name: 'Turkey Wrap', type: 'Lunch', macros: { calories: 520, protein: 35, carbs: 45, fat: 22 } },
        { id: '7', name: 'Beef Stir Fry', type: 'Dinner', macros: { calories: 680, protein: 48, carbs: 40, fat: 32 } },
        { id: '8', name: 'Greek Yogurt', type: 'Snack', macros: { calories: 180, protein: 18, carbs: 12, fat: 6 } },
      ]
    },
    {
      day: 'Wednesday',
      shortDay: 'Wed',
      meals: [
        { id: '9', name: 'Smoothie Bowl', type: 'Breakfast', macros: { calories: 450, protein: 20, carbs: 60, fat: 15 } },
        { id: '10', name: 'Tuna Sandwich', type: 'Lunch', macros: { calories: 490, protein: 32, carbs: 42, fat: 20 } },
        { id: '11', name: 'Grilled Pork Chop', type: 'Dinner', macros: { calories: 620, protein: 45, carbs: 30, fat: 35 } },
      ]
    },
    {
      day: 'Thursday',
      shortDay: 'Thu',
      meals: [
        { id: '12', name: 'Avocado Toast', type: 'Breakfast', macros: { calories: 380, protein: 12, carbs: 35, fat: 24 } },
        { id: '13', name: 'Buddha Bowl', type: 'Lunch', macros: { calories: 550, protein: 28, carbs: 55, fat: 25 } },
        { id: '14', name: 'Chicken Curry', type: 'Dinner', macros: { calories: 680, protein: 42, carbs: 50, fat: 32 } },
        { id: '15', name: 'Almonds', type: 'Snack', macros: { calories: 160, protein: 6, carbs: 6, fat: 14 } },
      ]
    },
    {
      day: 'Friday',
      shortDay: 'Fri',
      meals: [
        { id: '16', name: 'Pancakes with Fruit', type: 'Breakfast', macros: { calories: 480, protein: 14, carbs: 70, fat: 16 } },
        { id: '17', name: 'Salmon Salad', type: 'Lunch', macros: { calories: 520, protein: 38, carbs: 22, fat: 32 } },
        { id: '18', name: 'Pizza Night', type: 'Dinner', macros: { calories: 750, protein: 32, carbs: 80, fat: 35 } },
      ]
    },
    {
      day: 'Saturday',
      shortDay: 'Sat',
      meals: [
        { id: '19', name: 'Full English', type: 'Breakfast', macros: { calories: 650, protein: 35, carbs: 40, fat: 42 } },
        { id: '20', name: 'Pasta Carbonara', type: 'Dinner', macros: { calories: 720, protein: 28, carbs: 75, fat: 38 } },
      ]
    },
    {
      day: 'Sunday',
      shortDay: 'Sun',
      meals: [
        { id: '21', name: 'Brunch Eggs Benedict', type: 'Breakfast', macros: { calories: 580, protein: 28, carbs: 35, fat: 38 } },
        { id: '22', name: 'Roast Chicken', type: 'Dinner', macros: { calories: 700, protein: 55, carbs: 35, fat: 38 } },
      ]
    }
  ]);
  
  getMealIcon(type: string): string {
    const icons: Record<string, string> = {
      'Breakfast': '🌅',
      'Lunch': '☀️',
      'Dinner': '🌙',
      'Snack': '🍎'
    };
    return icons[type] || '🍽️';
  }
  
  getDayMacros(day: DayPlan): number {
    return day.meals.reduce((sum, m) => sum + m.macros.calories, 0);
  }
}
