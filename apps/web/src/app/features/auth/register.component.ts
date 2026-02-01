import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <!-- Logo -->
        <div class="text-center">
          <div class="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto">
            <span class="text-white font-bold text-3xl">C</span>
          </div>
          <h2 class="mt-6 text-3xl font-bold text-gray-900">Create your account</h2>
          <p class="mt-2 text-gray-600">Start your nutrition journey with Calo</p>
        </div>
        
        <!-- Form -->
        <form class="mt-8 space-y-6" (ngSubmit)="register()">
          <div class="space-y-4">
            <div>
              <label for="name" class="label">Full name</label>
              <input 
                id="name"
                type="text" 
                [(ngModel)]="name"
                name="name"
                required
                class="input"
                placeholder="John Doe"
              >
            </div>
            
            <div>
              <label for="email" class="label">Email address</label>
              <input 
                id="email"
                type="email" 
                [(ngModel)]="email"
                name="email"
                required
                class="input"
                placeholder="you@example.com"
              >
            </div>
            
            <div>
              <label for="password" class="label">Password</label>
              <input 
                id="password"
                type="password" 
                [(ngModel)]="password"
                name="password"
                required
                class="input"
                placeholder="••••••••"
              >
              <p class="text-xs text-gray-500 mt-1">At least 8 characters</p>
            </div>
            
            <div>
              <label for="confirmPassword" class="label">Confirm password</label>
              <input 
                id="confirmPassword"
                type="password" 
                [(ngModel)]="confirmPassword"
                name="confirmPassword"
                required
                class="input"
                placeholder="••••••••"
              >
            </div>
          </div>
          
          <div class="flex items-center">
            <input 
              id="terms" 
              type="checkbox" 
              [(ngModel)]="acceptTerms"
              name="terms"
              class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            >
            <label for="terms" class="ml-2 block text-sm text-gray-700">
              I agree to the 
              <a href="#" class="text-primary-600 hover:text-primary-500">Terms of Service</a>
              and
              <a href="#" class="text-primary-600 hover:text-primary-500">Privacy Policy</a>
            </label>
          </div>
          
          @if (error()) {
            <div class="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
              {{ error() }}
            </div>
          }
          
          <button 
            type="submit"
            [disabled]="isLoading()"
            class="btn btn-primary w-full py-3"
          >
            @if (isLoading()) {
              <svg class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating account...
            } @else {
              Create account
            }
          </button>
        </form>
        
        <p class="text-center text-gray-600">
          Already have an account?
          <a routerLink="/auth/login" class="text-primary-600 hover:text-primary-500 font-medium">
            Sign in
          </a>
        </p>
      </div>
    </div>
  `
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  acceptTerms = false;
  
  isLoading = signal(false);
  error = signal<string | null>(null);
  
  constructor(private router: Router) {}
  
  async register() {
    this.isLoading.set(true);
    this.error.set(null);
    
    try {
      // Validation
      if (!this.name || !this.email || !this.password) {
        throw new Error('Please fill in all fields');
      }
      
      if (this.password !== this.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      if (this.password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }
      
      if (!this.acceptTerms) {
        throw new Error('Please accept the terms and conditions');
      }
      
      // TODO: Call auth API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.router.navigate(['/onboarding']);
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.isLoading.set(false);
    }
  }
}
