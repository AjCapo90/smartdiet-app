import { Component, Input } from '@angular/core';

interface MacroValues {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

@Component({
  selector: 'app-delta-display',
  standalone: true,
  template: `
    <div class="card border-2" [class]="borderClass">
      <div class="flex items-center gap-3 mb-4">
        <span class="text-2xl">{{ statusEmoji }}</span>
        <div>
          <h3 class="font-semibold text-gray-900">{{ statusTitle }}</h3>
          <p class="text-sm text-gray-600">{{ statusMessage }}</p>
        </div>
      </div>
      
      <div class="grid grid-cols-4 gap-4">
        <div class="text-center">
          <p class="text-sm text-gray-500">Calories</p>
          <p class="text-lg font-bold" [class]="getDeltaClass(remaining.calories, targets.calories)">
            {{ formatRemaining(remaining.calories) }}
          </p>
          <p class="text-xs text-gray-400">remaining</p>
        </div>
        <div class="text-center">
          <p class="text-sm text-gray-500">Protein</p>
          <p class="text-lg font-bold" [class]="getDeltaClass(remaining.protein, targets.protein)">
            {{ formatRemaining(remaining.protein) }}g
          </p>
          <p class="text-xs text-gray-400">remaining</p>
        </div>
        <div class="text-center">
          <p class="text-sm text-gray-500">Carbs</p>
          <p class="text-lg font-bold" [class]="getDeltaClass(remaining.carbs, targets.carbs)">
            {{ formatRemaining(remaining.carbs) }}g
          </p>
          <p class="text-xs text-gray-400">remaining</p>
        </div>
        <div class="text-center">
          <p class="text-sm text-gray-500">Fat</p>
          <p class="text-lg font-bold" [class]="getDeltaClass(remaining.fat, targets.fat)">
            {{ formatRemaining(remaining.fat) }}g
          </p>
          <p class="text-xs text-gray-400">remaining</p>
        </div>
      </div>
      
      <!-- Deficit/Surplus Alerts -->
      @if (alerts.length > 0) {
        <div class="mt-4 pt-4 border-t border-gray-200">
          <p class="text-sm font-medium text-gray-700 mb-2">Balance Alerts:</p>
          <div class="space-y-1">
            @for (alert of alerts; track alert) {
              <p class="text-sm" [class]="alert.class">{{ alert.message }}</p>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class DeltaDisplayComponent {
  @Input() consumed: MacroValues = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  @Input() targets: MacroValues = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  @Input() remaining: MacroValues = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  
  get overallProgress(): number {
    if (this.targets.calories === 0) return 0;
    return Math.round((this.consumed.calories / this.targets.calories) * 100);
  }
  
  get statusEmoji(): string {
    const progress = this.overallProgress;
    if (progress >= 90 && progress <= 110) return '🎯';
    if (progress > 110) return '⚠️';
    if (progress < 30) return '🚀';
    return '📊';
  }
  
  get statusTitle(): string {
    const progress = this.overallProgress;
    if (progress >= 90 && progress <= 110) return 'On Track!';
    if (progress > 110) return 'Over Target';
    if (progress < 30) return 'Just Getting Started';
    return 'Keep Going';
  }
  
  get statusMessage(): string {
    const progress = this.overallProgress;
    if (progress >= 90 && progress <= 110) return 'Great job maintaining your nutrition goals';
    if (progress > 110) return 'Consider lighter meals for remaining days';
    if (progress < 30) return `${this.remaining.calories} kcal left to hit your weekly target`;
    return `${this.remaining.calories} kcal remaining this week`;
  }
  
  get borderClass(): string {
    const progress = this.overallProgress;
    if (progress >= 90 && progress <= 110) return 'border-green-200 bg-green-50';
    if (progress > 110) return 'border-amber-200 bg-amber-50';
    return 'border-blue-200 bg-blue-50';
  }
  
  get alerts(): { message: string; class: string }[] {
    const alerts: { message: string; class: string }[] = [];
    
    const proteinPercent = this.targets.protein > 0 ? (this.consumed.protein / this.targets.protein) * 100 : 0;
    const fatPercent = this.targets.fat > 0 ? (this.consumed.fat / this.targets.fat) * 100 : 0;
    const carbsPercent = this.targets.carbs > 0 ? (this.consumed.carbs / this.targets.carbs) * 100 : 0;
    const caloriesPercent = this.overallProgress;
    
    // Check for imbalances
    if (proteinPercent < caloriesPercent - 15) {
      alerts.push({ 
        message: `⬇️ Protein behind by ${Math.round(caloriesPercent - proteinPercent)}% — add high-protein meals`,
        class: 'text-red-600'
      });
    }
    
    if (fatPercent > caloriesPercent + 15) {
      alerts.push({ 
        message: `⬆️ Fat ahead by ${Math.round(fatPercent - caloriesPercent)}% — choose leaner options`,
        class: 'text-amber-600'
      });
    }
    
    if (carbsPercent > caloriesPercent + 15) {
      alerts.push({ 
        message: `⬆️ Carbs ahead by ${Math.round(carbsPercent - caloriesPercent)}% — reduce carb-heavy meals`,
        class: 'text-amber-600'
      });
    }
    
    return alerts;
  }
  
  formatRemaining(value: number): string {
    if (value < 0) return `+${Math.abs(value)}`;
    return value.toString();
  }
  
  getDeltaClass(remaining: number, target: number): string {
    const percent = target > 0 ? (remaining / target) * 100 : 0;
    if (remaining < 0) return 'text-red-600'; // Over
    if (percent < 20) return 'text-green-600'; // Almost done
    return 'text-gray-900';
  }
}
