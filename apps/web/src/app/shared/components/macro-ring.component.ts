import { Component, Input, computed, signal } from '@angular/core';

@Component({
  selector: 'app-macro-ring',
  standalone: true,
  template: `
    <div class="relative" [style.width.px]="size" [style.height.px]="size">
      <svg class="progress-ring" [attr.width]="size" [attr.height]="size">
        <!-- Background circle -->
        <circle
          class="text-gray-200"
          stroke="currentColor"
          fill="transparent"
          [attr.stroke-width]="strokeWidth"
          [attr.r]="radius()"
          [attr.cx]="center()"
          [attr.cy]="center()"
        />
        <!-- Progress circle -->
        <circle
          class="progress-ring__circle text-primary-500"
          stroke="currentColor"
          fill="transparent"
          stroke-linecap="round"
          [attr.stroke-width]="strokeWidth"
          [attr.r]="radius()"
          [attr.cx]="center()"
          [attr.cy]="center()"
          [attr.stroke-dasharray]="circumference()"
          [attr.stroke-dashoffset]="dashOffset()"
        />
      </svg>
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <span class="text-3xl font-bold text-gray-900">{{ percentage }}%</span>
        <span class="text-sm text-gray-500">complete</span>
      </div>
    </div>
  `
})
export class MacroRingComponent {
  @Input() percentage = 0;
  @Input() size = 160;
  @Input() strokeWidth = 10;
  
  radius = computed(() => (this.size - this.strokeWidth) / 2);
  center = computed(() => this.size / 2);
  circumference = computed(() => 2 * Math.PI * this.radius());
  dashOffset = computed(() => {
    const progress = Math.min(100, Math.max(0, this.percentage)) / 100;
    return this.circumference() * (1 - progress);
  });
}
