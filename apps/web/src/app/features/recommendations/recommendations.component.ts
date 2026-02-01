import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Recommendation {
  id: string;
  mealType: string;
  day: string;
  originalMeal: string;
  suggestedMeal: string;
  reason: string;
  macroImpact: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  priority: 'required' | 'suggested' | 'optional';
}

@Component({
  selector: 'app-recommendations',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="space-y-6 animate-fade-in">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Recommendations</h1>
        <p class="text-gray-500 mt-1">Suggested adjustments to hit your weekly targets</p>
      </div>
      
      <!-- Remaining Macros Summary -->
      <div class="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <h3 class="text-lg font-semibold mb-4">Remaining to Complete Week</h3>
        <div class="grid grid-cols-4 gap-4 text-center">
          <div>
            <p class="text-3xl font-bold">{{ remaining().calories }}</p>
            <p class="text-sm opacity-80">kcal</p>
          </div>
          <div>
            <p class="text-3xl font-bold">{{ remaining().protein }}g</p>
            <p class="text-sm opacity-80">protein</p>
          </div>
          <div>
            <p class="text-3xl font-bold">{{ remaining().carbs }}g</p>
            <p class="text-sm opacity-80">carbs</p>
          </div>
          <div>
            <p class="text-3xl font-bold">{{ remaining().fat }}g</p>
            <p class="text-sm opacity-80">fat</p>
          </div>
        </div>
        <p class="text-sm mt-4 opacity-80">Based on {{ mealsRemaining() }} remaining meals</p>
      </div>
      
      <!-- Priority Sections -->
      @if (requiredRecommendations().length > 0) {
        <div>
          <div class="flex items-center gap-2 mb-4">
            <span class="w-3 h-3 bg-red-500 rounded-full"></span>
            <h2 class="font-semibold text-gray-900">Required Changes</h2>
          </div>
          <div class="space-y-3">
            @for (rec of requiredRecommendations(); track rec.id) {
              <div class="card border-l-4 border-red-500">
                <ng-container *ngTemplateOutlet="recommendationCard; context: { $implicit: rec }" />
              </div>
            }
          </div>
        </div>
      }
      
      @if (suggestedRecommendations().length > 0) {
        <div>
          <div class="flex items-center gap-2 mb-4">
            <span class="w-3 h-3 bg-amber-500 rounded-full"></span>
            <h2 class="font-semibold text-gray-900">Suggested Adjustments</h2>
          </div>
          <div class="space-y-3">
            @for (rec of suggestedRecommendations(); track rec.id) {
              <div class="card border-l-4 border-amber-500">
                <ng-container *ngTemplateOutlet="recommendationCard; context: { $implicit: rec }" />
              </div>
            }
          </div>
        </div>
      }
      
      @if (optionalRecommendations().length > 0) {
        <div>
          <div class="flex items-center gap-2 mb-4">
            <span class="w-3 h-3 bg-blue-500 rounded-full"></span>
            <h2 class="font-semibold text-gray-900">Optional Tweaks</h2>
          </div>
          <div class="space-y-3">
            @for (rec of optionalRecommendations(); track rec.id) {
              <div class="card border-l-4 border-blue-500">
                <ng-container *ngTemplateOutlet="recommendationCard; context: { $implicit: rec }" />
              </div>
            }
          </div>
        </div>
      }
      
      <!-- Empty state -->
      @if (recommendations().length === 0) {
        <div class="card text-center py-12">
          <span class="text-6xl">🎉</span>
          <h3 class="mt-4 text-xl font-semibold text-gray-900">You're on track!</h3>
          <p class="mt-2 text-gray-500">No adjustments needed. Keep following your plan.</p>
        </div>
      }
      
      <!-- Template for recommendation card -->
      <ng-template #recommendationCard let-rec>
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="text-lg">{{ getMealIcon(rec.mealType) }}</span>
              <span class="text-sm text-gray-500">{{ rec.day }} · {{ rec.mealType }}</span>
            </div>
            <h4 class="font-medium text-gray-900 mt-1">{{ rec.suggestedMeal }}</h4>
            <p class="text-sm text-gray-600 mt-1">{{ rec.reason }}</p>
            
            <!-- Macro impact -->
            <div class="flex gap-4 mt-3 text-xs">
              <span class="text-amber-600">{{ formatImpact(rec.macroImpact.calories) }} kcal</span>
              <span class="text-red-500">{{ formatImpact(rec.macroImpact.protein) }}g protein</span>
              <span class="text-blue-500">{{ formatImpact(rec.macroImpact.carbs) }}g carbs</span>
              <span class="text-yellow-600">{{ formatImpact(rec.macroImpact.fat) }}g fat</span>
            </div>
          </div>
          
          <button class="btn btn-outline btn-sm">
            Apply
          </button>
        </div>
      </ng-template>
    </div>
  `
})
export class RecommendationsComponent {
  remaining = signal({
    calories: 5580,
    protein: 315,
    carbs: 770,
    fat: 195
  });
  
  mealsRemaining = signal(12);
  
  recommendations = signal<Recommendation[]>([
    {
      id: '1',
      mealType: 'Dinner',
      day: 'Saturday',
      originalMeal: 'Pasta Carbonara',
      suggestedMeal: 'Grilled Chicken with Quinoa',
      reason: 'Swap to boost protein intake for the week',
      macroImpact: { calories: -50, protein: +25, carbs: -30, fat: -15 },
      priority: 'required'
    },
    {
      id: '2',
      mealType: 'Snack',
      day: 'Saturday',
      originalMeal: 'Apple',
      suggestedMeal: 'Greek Yogurt with Nuts',
      reason: 'Add a protein-rich snack to balance macros',
      macroImpact: { calories: +120, protein: +15, carbs: -5, fat: +8 },
      priority: 'suggested'
    },
    {
      id: '3',
      mealType: 'Lunch',
      day: 'Sunday',
      originalMeal: 'Caesar Salad',
      suggestedMeal: 'Caesar Salad with Extra Chicken',
      reason: 'Increase portion size slightly for protein',
      macroImpact: { calories: +150, protein: +22, carbs: +5, fat: +6 },
      priority: 'suggested'
    },
    {
      id: '4',
      mealType: 'Breakfast',
      day: 'Sunday',
      originalMeal: 'Oatmeal',
      suggestedMeal: 'Oatmeal with Protein Powder',
      reason: 'Small tweak to maximize protein',
      macroImpact: { calories: +80, protein: +20, carbs: +2, fat: +1 },
      priority: 'optional'
    }
  ]);
  
  requiredRecommendations = signal(this.recommendations().filter(r => r.priority === 'required'));
  suggestedRecommendations = signal(this.recommendations().filter(r => r.priority === 'suggested'));
  optionalRecommendations = signal(this.recommendations().filter(r => r.priority === 'optional'));
  
  getMealIcon(type: string): string {
    const icons: Record<string, string> = {
      'Breakfast': '🌅',
      'Lunch': '☀️',
      'Dinner': '🌙',
      'Snack': '🍎'
    };
    return icons[type] || '🍽️';
  }
  
  formatImpact(value: number): string {
    return value >= 0 ? `+${value}` : `${value}`;
  }
}
