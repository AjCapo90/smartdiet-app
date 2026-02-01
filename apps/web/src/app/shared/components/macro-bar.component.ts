import { Component, Input, computed } from '@angular/core';

@Component({
  selector: 'app-macro-bar',
  standalone: true,
  template: `
    <div class="space-y-1">
      <div class="flex justify-between text-sm">
        <span class="font-medium" [class]="labelClass()">{{ label }}</span>
        <span class="text-gray-600">{{ current }} / {{ target }} {{ unit }}</span>
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
}
