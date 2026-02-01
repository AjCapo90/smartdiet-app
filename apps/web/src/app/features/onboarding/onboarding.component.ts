import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex flex-col">
      <!-- Progress bar -->
      <div class="p-4">
        <div class="h-1 bg-white/20 rounded-full overflow-hidden">
          <div 
            class="h-full bg-white rounded-full transition-all duration-500"
            [style.width.%]="progress()"
          ></div>
        </div>
        <p class="text-white/80 text-sm mt-2">Step {{ currentStep() }} of {{ totalSteps }}</p>
      </div>
      
      <!-- Content -->
      <div class="flex-1 flex items-center justify-center p-4">
        <div class="w-full max-w-lg">
          <!-- Step 1: Welcome -->
          @if (currentStep() === 1) {
            <div class="text-center text-white animate-fade-in">
              <div class="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8">
                <span class="text-primary-500 font-bold text-5xl">C</span>
              </div>
              <h1 class="text-4xl font-bold mb-4">Welcome to Calo</h1>
              <p class="text-xl text-white/90 mb-8">
                Complete your perfect nutrition week with smart, adaptive meal planning.
              </p>
              <button (click)="nextStep()" class="btn bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 text-lg">
                Get Started
              </button>
            </div>
          }
          
          <!-- Step 2: Upload or Create -->
          @if (currentStep() === 2) {
            <div class="bg-white rounded-2xl p-8 animate-fade-in">
              <h2 class="text-2xl font-bold text-gray-900 mb-2">Set up your diet plan</h2>
              <p class="text-gray-600 mb-6">How would you like to get started?</p>
              
              <div class="space-y-4">
                <button 
                  (click)="setupMethod.set('upload'); nextStep()"
                  class="w-full p-6 border-2 rounded-xl text-left hover:border-primary-500 hover:bg-primary-50 transition-colors"
                >
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 class="font-semibold text-gray-900">Upload diet plan photo</h3>
                      <p class="text-sm text-gray-500">AI will extract meals and macros automatically</p>
                    </div>
                  </div>
                </button>
                
                <button 
                  (click)="setupMethod.set('manual'); nextStep()"
                  class="w-full p-6 border-2 rounded-xl text-left hover:border-primary-500 hover:bg-primary-50 transition-colors"
                >
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div>
                      <h3 class="font-semibold text-gray-900">Create manually</h3>
                      <p class="text-sm text-gray-500">Set your own weekly macro targets</p>
                    </div>
                  </div>
                </button>
                
                <button 
                  (click)="setupMethod.set('skip'); currentStep.set(4)"
                  class="w-full p-4 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </div>
          }
          
          <!-- Step 3: Setup (based on method) -->
          @if (currentStep() === 3) {
            <div class="bg-white rounded-2xl p-8 animate-fade-in">
              @if (setupMethod() === 'upload') {
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Upload your diet plan</h2>
                <div 
                  class="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
                  (click)="fileInput.click()"
                >
                  @if (!uploadedImage()) {
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p class="mt-4 text-gray-600">Click or drop image here</p>
                  } @else {
                    <img [src]="uploadedImage()" class="max-h-48 mx-auto rounded-lg" alt="Diet plan">
                  }
                </div>
                <input #fileInput type="file" accept="image/*" class="hidden" (change)="onImageSelected($event)">
              } @else {
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Set your weekly targets</h2>
                <div class="space-y-4">
                  <div>
                    <label class="label">Weekly Calories (kcal)</label>
                    <input type="number" [(ngModel)]="targets.calories" class="input" placeholder="14000">
                  </div>
                  <div class="grid grid-cols-3 gap-4">
                    <div>
                      <label class="label">Protein (g)</label>
                      <input type="number" [(ngModel)]="targets.protein" class="input" placeholder="700">
                    </div>
                    <div>
                      <label class="label">Carbs (g)</label>
                      <input type="number" [(ngModel)]="targets.carbs" class="input" placeholder="1750">
                    </div>
                    <div>
                      <label class="label">Fat (g)</label>
                      <input type="number" [(ngModel)]="targets.fat" class="input" placeholder="490">
                    </div>
                  </div>
                </div>
              }
              
              <div class="flex gap-4 mt-8">
                <button (click)="prevStep()" class="btn btn-secondary flex-1">Back</button>
                <button (click)="nextStep()" class="btn btn-primary flex-1">Continue</button>
              </div>
            </div>
          }
          
          <!-- Step 4: Ready -->
          @if (currentStep() === 4) {
            <div class="text-center text-white animate-fade-in">
              <div class="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 class="text-4xl font-bold mb-4">You're all set!</h1>
              <p class="text-xl text-white/90 mb-8">
                Start logging your meals and watch Calo help you complete your perfect week.
              </p>
              <button (click)="complete()" class="btn bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 text-lg">
                Go to Dashboard
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class OnboardingComponent {
  totalSteps = 4;
  currentStep = signal(1);
  progress = computed(() => (this.currentStep() / this.totalSteps) * 100);
  
  setupMethod = signal<'upload' | 'manual' | 'skip'>('manual');
  uploadedImage = signal<string | null>(null);
  
  targets = {
    calories: 14000,
    protein: 700,
    carbs: 1750,
    fat: 490
  };
  
  constructor(private router: Router) {}
  
  nextStep() {
    if (this.currentStep() < this.totalSteps) {
      this.currentStep.update(s => s + 1);
    }
  }
  
  prevStep() {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
    }
  }
  
  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.uploadedImage.set(e.target?.result as string);
      };
      reader.readAsDataURL(input.files[0]);
    }
  }
  
  complete() {
    // TODO: Save preferences
    this.router.navigate(['/dashboard']);
  }
}
