import { Component, signal, computed, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

interface ParsedMeal {
  name: string;
  items: { name: string; quantity: string; macros: { calories: number; protein: number; carbs: number; fat: number } }[];
  totalMacros: { calories: number; protein: number; carbs: number; fat: number };
  confidence: number;
}

@Component({
  selector: 'app-meal-log',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <!-- Header -->
      <div class="flex items-center gap-4">
        <button routerLink="/dashboard" class="p-2 hover:bg-gray-100 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-2xl font-bold text-gray-900">Log Meal</h1>
      </div>
      
      <!-- Meal Type Selection -->
      <div class="card">
        <label class="label">Meal Type</label>
        <div class="grid grid-cols-4 gap-2">
          @for (type of mealTypes; track type.value) {
            <button
              (click)="selectedMealType.set(type.value)"
              class="p-3 rounded-xl border-2 transition-colors text-center"
              [class.border-primary-500]="selectedMealType() === type.value"
              [class.bg-primary-50]="selectedMealType() === type.value"
              [class.border-gray-200]="selectedMealType() !== type.value"
            >
              <span class="text-2xl">{{ type.icon }}</span>
              <p class="text-sm mt-1" [class.text-primary-700]="selectedMealType() === type.value">{{ type.label }}</p>
            </button>
          }
        </div>
      </div>
      
      <!-- Input Method -->
      <div class="card">
        <label class="label">How would you like to log?</label>
        <div class="flex gap-2">
          <button
            (click)="inputMethod.set('text')"
            class="flex-1 p-3 rounded-xl border-2 transition-colors flex items-center justify-center gap-2"
            [class.border-primary-500]="inputMethod() === 'text'"
            [class.bg-primary-50]="inputMethod() === 'text'"
            [class.border-gray-200]="inputMethod() !== 'text'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Text</span>
          </button>
          <button
            (click)="inputMethod.set('voice')"
            class="flex-1 p-3 rounded-xl border-2 transition-colors flex items-center justify-center gap-2"
            [class.border-primary-500]="inputMethod() === 'voice'"
            [class.bg-primary-50]="inputMethod() === 'voice'"
            [class.border-gray-200]="inputMethod() !== 'voice'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <span>Voice</span>
          </button>
        </div>
      </div>
      
      <!-- Text Input -->
      @if (inputMethod() === 'text') {
        <div class="card">
          <label class="label">What did you eat?</label>
          <textarea
            [(ngModel)]="mealInput"
            placeholder="E.g., 2 eggs with toast and a glass of orange juice"
            class="input min-h-[120px] resize-none"
            (keydown.control.enter)="parseMeal()"
          ></textarea>
          <p class="text-xs text-gray-500 mt-2">Tip: Be specific with quantities for better macro estimates</p>
        </div>
      }
      
      <!-- Voice Input -->
      @if (inputMethod() === 'voice') {
        <div class="card">
          <div class="text-center py-8">
            @if (!isRecording()) {
              <button
                (click)="startRecording()"
                class="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center mx-auto hover:bg-primary-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
              <p class="mt-4 text-gray-600">Tap to start recording</p>
            } @else {
              <button
                (click)="stopRecording()"
                class="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto hover:bg-red-600 transition-colors relative"
              >
                <div class="absolute inset-0 bg-red-400 rounded-full animate-pulse-ring"></div>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              </button>
              <p class="mt-4 text-red-600 font-medium">Recording... Tap to stop</p>
            }
            
            @if (voiceTranscript()) {
              <div class="mt-6 p-4 bg-gray-50 rounded-xl text-left">
                <p class="text-sm text-gray-500 mb-1">Transcription:</p>
                <p class="text-gray-900">{{ voiceTranscript() }}</p>
              </div>
            }
          </div>
        </div>
      }
      
      <!-- Parse Button -->
      @if (mealInput() || voiceTranscript()) {
        <button
          (click)="parseMeal()"
          [disabled]="isParsing()"
          class="btn btn-primary w-full py-3"
        >
          @if (isParsing()) {
            <svg class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Analyzing...
          } @else {
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Analyze Meal
          }
        </button>
      }
      
      <!-- Parsed Result Preview -->
      @if (parsedMeal()) {
        <div class="card border-2 border-primary-200 bg-primary-50">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-900">{{ parsedMeal()!.name }}</h3>
            <span class="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full">
              {{ Math.round(parsedMeal()!.confidence * 100) }}% confident
            </span>
          </div>
          
          <!-- Items breakdown -->
          <div class="space-y-2 mb-4">
            @for (item of parsedMeal()!.items; track item.name) {
              <div class="flex justify-between text-sm">
                <span class="text-gray-700">{{ item.name }} ({{ item.quantity }})</span>
                <span class="text-gray-500">{{ item.macros.calories }} kcal</span>
              </div>
            }
          </div>
          
          <!-- Total macros -->
          <div class="border-t border-primary-200 pt-4">
            <div class="grid grid-cols-4 gap-4 text-center">
              <div>
                <p class="text-2xl font-bold text-amber-600">{{ parsedMeal()!.totalMacros.calories }}</p>
                <p class="text-xs text-gray-500">kcal</p>
              </div>
              <div>
                <p class="text-2xl font-bold text-red-500">{{ parsedMeal()!.totalMacros.protein }}g</p>
                <p class="text-xs text-gray-500">protein</p>
              </div>
              <div>
                <p class="text-2xl font-bold text-blue-500">{{ parsedMeal()!.totalMacros.carbs }}g</p>
                <p class="text-xs text-gray-500">carbs</p>
              </div>
              <div>
                <p class="text-2xl font-bold text-yellow-600">{{ parsedMeal()!.totalMacros.fat }}g</p>
                <p class="text-xs text-gray-500">fat</p>
              </div>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="flex gap-3 mt-6">
            <button (click)="editMeal()" class="btn btn-outline flex-1">
              Edit
            </button>
            <button (click)="saveMeal()" class="btn btn-primary flex-1">
              Save Meal
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class MealLogComponent implements OnDestroy {
  private router = inject(Router);
  private recognition: any;
  
  mealTypes = [
    { value: 'breakfast', label: 'Breakfast', icon: '🌅' },
    { value: 'lunch', label: 'Lunch', icon: '☀️' },
    { value: 'dinner', label: 'Dinner', icon: '🌙' },
    { value: 'snack', label: 'Snack', icon: '🍎' }
  ];
  
  selectedMealType = signal('lunch');
  inputMethod = signal<'text' | 'voice'>('text');
  mealInput = signal('');
  voiceTranscript = signal('');
  isRecording = signal(false);
  isParsing = signal(false);
  parsedMeal = signal<ParsedMeal | null>(null);
  
  Math = Math; // Expose Math to template
  
  constructor() {
    this.initSpeechRecognition();
  }
  
  private initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      
      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.voiceTranscript.set(transcript);
      };
      
      this.recognition.onend = () => {
        this.isRecording.set(false);
      };
    }
  }
  
  startRecording() {
    if (this.recognition) {
      this.voiceTranscript.set('');
      this.isRecording.set(true);
      this.recognition.start();
    } else {
      alert('Speech recognition is not supported in your browser');
    }
  }
  
  stopRecording() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }
  
  async parseMeal() {
    const input = this.inputMethod() === 'text' ? this.mealInput() : this.voiceTranscript();
    if (!input) return;
    
    this.isParsing.set(true);
    
    // Simulate API call - will be replaced with real API
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock parsed result
    this.parsedMeal.set({
      name: this.getMealName(input),
      items: [
        { name: 'Eggs', quantity: '2 large', macros: { calories: 156, protein: 12, carbs: 1, fat: 11 } },
        { name: 'Toast', quantity: '2 slices', macros: { calories: 150, protein: 5, carbs: 28, fat: 2 } },
        { name: 'Orange Juice', quantity: '250ml', macros: { calories: 112, protein: 2, carbs: 26, fat: 0 } }
      ],
      totalMacros: { calories: 418, protein: 19, carbs: 55, fat: 13 },
      confidence: 0.87
    });
    
    this.isParsing.set(false);
  }
  
  private getMealName(input: string): string {
    // Simple logic to generate meal name from input
    const words = input.toLowerCase().split(' ').slice(0, 4);
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  
  editMeal() {
    // TODO: Open edit modal
  }
  
  saveMeal() {
    // TODO: Save to API
    this.router.navigate(['/dashboard']);
  }
  
  ngOnDestroy() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}
