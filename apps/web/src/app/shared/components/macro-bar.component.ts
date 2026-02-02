import { Component, Input, computed } from '@angular/core';

@Component({
  selector: 'app-macro-bar',
  standalone: true,
  template: `
    <div class="space-y-1">
      <div class="flex justify-between text-sm">
        <span class="font-medium" [class]="labelClass()">{{ label }}</span>
        <div class="flex items-center gap-2">
          <span class="text-gray-600">{{ current }} / {{ target }} {{ unit }}</span>
          @if (delta !== undefined) {
            <span 
              class="text-xs px-1.5 py-0.5 rounded-full font-medium"
              [class]="deltaClass()"
            >
              {{ deltaText() }}
            </span>
          }
        </div>
      </div>
      <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          class="h-full rounded-full transition-all duration-500"
          [class]="barClass()"
          [style.width.%]="percentage()"
        ></div>
      </div>
    </div>
  `
})
export class MacroBarComponent {
  @Input() label = '';
  @Input() current = 0;
  @Input() target = 0;
  @Input() unit = '';
  @Input() color: 'amber' | 'red' | 'blue' | 'yellow' | 'green' = 'green';
  @Input() delta?: number;
  
  percentage = computed(() => {
    if (this.target <= 0) return 0;
    return Math.min(100, Math.round((this.current / this.target) * 100));
  });
  
  barClass = computed(() => {
    const colors: Record<string, string> = {
      amber: 'bg-amber-500',
      red: 'bg-red-500',
      blue: 'bg-blue-500',
      yellow: 'bg-yellow-500',
      green: 'bg-green-500',
    };
    return colors[this.color] || 'bg-green-500';
  });
  
  labelClass = computed(() => {
    const colors: Record<string, string> = {
      amber: 'text-amber-700',
      red: 'text-red-700',
      blue: 'text-blue-700',
      yellow: 'text-yellow-700',
      green: 'text-green-700',
    };
    return colors[this.color] || 'text-green-700';
  });
  
  deltaText = computed(() => {
    if (this.delta === undefined) return '';
    if (this.delta > 0) return `+${this.delta}`;
    if (this.delta < 0) return `${this.delta}`;
    return '0';
  });
  
  deltaClass(): string {
    if (this.delta === undefined) return '';
    if (this.delta > 0) return 'bg-red-100 text-red-700';
    if (this.delta < 0) return 'bg-green-100 text-green-700';
    return 'bg-gray-100 text-gray-700';
  }
}
