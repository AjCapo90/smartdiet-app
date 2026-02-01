import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-diet-plan-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <!-- Header -->
      <div class="flex items-center gap-4">
        <button routerLink="/diet-plan" class="p-2 hover:bg-gray-100 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-2xl font-bold text-gray-900">Create Diet Plan</h1>
      </div>
      
      <!-- Upload Option -->
      <div class="card">
        <h3 class="font-semibold text-gray-900 mb-4">Upload Diet Plan Photo</h3>
        <div 
          class="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-400 hover:bg-primary-50 transition-colors cursor-pointer"
          (click)="uploadInput.click()"
        >
          @if (!uploadedImage()) {
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p class="mt-4 text-gray-600">Drop your diet plan image here or click to upload</p>
            <p class="text-sm text-gray-500 mt-1">Our AI will extract meals and macros automatically</p>
          } @else {
            <img [src]="uploadedImage()" class="max-h-48 mx-auto rounded-lg" alt="Uploaded diet plan">
            <p class="mt-4 text-primary-600">Click to change image</p>
          }
        </div>
        <input 
          #uploadInput
          type="file" 
          accept="image/*" 
          class="hidden"
          (change)="onFileSelected($event)"
        >
        
        @if (uploadedImage()) {
          <button 
            (click)="analyzeImage()"
            [disabled]="isAnalyzing()"
            class="btn btn-primary w-full mt-4"
          >
            @if (isAnalyzing()) {
              <svg class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing with AI...
            } @else {
              Analyze Image
            }
          </button>
        }
      </div>
      
      <!-- Or Manual Entry -->
      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-4 bg-gray-50 text-gray-500">or create manually</span>
        </div>
      </div>
      
      <!-- Manual Form -->
      <div class="card">
        <h3 class="font-semibold text-gray-900 mb-4">Plan Details</h3>
        
        <div class="space-y-4">
          <div>
            <label class="label">Plan Name</label>
            <input 
              type="text" 
              [(ngModel)]="planName"
              class="input" 
              placeholder="e.g., My Weight Loss Plan"
            >
          </div>
          
          <div>
            <label class="label">Description (optional)</label>
            <textarea 
              [(ngModel)]="planDescription"
              class="input resize-none" 
              rows="2"
              placeholder="Notes about this plan..."
            ></textarea>
          </div>
        </div>
      </div>
      
      <!-- Weekly Targets -->
      <div class="card">
        <h3 class="font-semibold text-gray-900 mb-4">Weekly Macro Targets</h3>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Calories (kcal/week)</label>
            <input 
              type="number" 
              [(ngModel)]="targets.calories"
              class="input" 
              placeholder="14000"
            >
          </div>
          <div>
            <label class="label">Protein (g/week)</label>
            <input 
              type="number" 
              [(ngModel)]="targets.protein"
              class="input" 
              placeholder="700"
            >
          </div>
          <div>
            <label class="label">Carbs (g/week)</label>
            <input 
              type="number" 
              [(ngModel)]="targets.carbs"
              class="input" 
              placeholder="1750"
            >
          </div>
          <div>
            <label class="label">Fat (g/week)</label>
            <input 
              type="number" 
              [(ngModel)]="targets.fat"
              class="input" 
              placeholder="490"
            >
          </div>
        </div>
        
        <div class="mt-4 p-4 bg-blue-50 rounded-lg">
          <p class="text-sm text-blue-800">
            <strong>Tip:</strong> Daily averages would be ~{{ Math.round(targets.calories / 7) }} kcal, 
            {{ Math.round(targets.protein / 7) }}g protein, 
            {{ Math.round(targets.carbs / 7) }}g carbs, 
            {{ Math.round(targets.fat / 7) }}g fat.
          </p>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="flex gap-3">
        <button routerLink="/diet-plan" class="btn btn-secondary flex-1">
          Cancel
        </button>
        <button (click)="savePlan()" class="btn btn-primary flex-1">
          Create Plan
        </button>
      </div>
    </div>
  `
})
export class DietPlanFormComponent {
  private router = Router;
  
  uploadedImage = signal<string | null>(null);
  isAnalyzing = signal(false);
  
  planName = signal('');
  planDescription = signal('');
  targets = {
    calories: 14000,
    protein: 700,
    carbs: 1750,
    fat: 490
  };
  
  Math = Math;
  
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.uploadedImage.set(e.target?.result as string);
      };
      reader.readAsDataURL(input.files[0]);
    }
  }
  
  async analyzeImage() {
    this.isAnalyzing.set(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mock result - would come from OCR API
    this.planName.set('Nutritionist Plan - Week 1');
    this.targets = {
      calories: 14000,
      protein: 735,
      carbs: 1680,
      fat: 525
    };
    
    this.isAnalyzing.set(false);
  }
  
  savePlan() {
    // TODO: Save to API
    console.log('Saving plan:', {
      name: this.planName(),
      description: this.planDescription(),
      targets: this.targets
    });
  }
}
