import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen flex flex-col">
      <!-- Header -->
      <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-lg">C</span>
              </div>
              <span class="text-xl font-semibold text-gray-900">Calo</span>
            </div>
            
            <!-- Desktop nav -->
            <nav class="hidden md:flex items-center gap-1">
              @for (item of navItems; track item.path) {
                <a 
                  [routerLink]="item.path"
                  routerLinkActive="bg-primary-50 text-primary-700"
                  [routerLinkActiveOptions]="{ exact: item.path === '/dashboard' }"
                  class="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  {{ item.label }}
                </a>
              }
            </nav>
            
            <div class="flex items-center gap-4">
              <button class="p-2 text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <div class="w-8 h-8 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>
      </header>
      
      <!-- Main content -->
      <main class="flex-1">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 md:pb-8">
          <router-outlet />
        </div>
      </main>
      
      <!-- Mobile bottom nav -->
      <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb">
        <div class="flex justify-around py-2">
          @for (item of navItems; track item.path) {
            <a 
              [routerLink]="item.path"
              routerLinkActive="text-primary-600"
              class="flex flex-col items-center gap-1 px-3 py-2 text-gray-500"
            >
              <span class="text-2xl">{{ item.icon }}</span>
              <span class="text-xs">{{ item.label }}</span>
            </a>
          }
        </div>
      </nav>
      
      <!-- FAB for quick meal log -->
      <button 
        routerLink="/log"
        class="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-primary-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-600 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  `,
  styles: [`
    .safe-area-pb {
      padding-bottom: env(safe-area-inset-bottom, 0);
    }
  `]
})
export class ShellComponent {
  navItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/log', label: 'Log Meal', icon: '🍽️' },
    { path: '/recommendations', label: 'Suggestions', icon: '💡' },
    { path: '/diet-plan', label: 'Diet Plan', icon: '📋' }
  ];
}
