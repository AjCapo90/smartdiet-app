import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/shell.component').then(m => m.ShellComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'log',
        loadComponent: () => import('./features/meal-log/meal-log.component').then(m => m.MealLogComponent)
      },
      {
        path: 'recommendations',
        loadComponent: () => import('./features/recommendations/recommendations.component').then(m => m.RecommendationsComponent)
      },
      {
        path: 'diet-plan',
        loadComponent: () => import('./features/diet-plan/diet-plan.component').then(m => m.DietPlanComponent)
      },
      {
        path: 'diet-plan/new',
        loadComponent: () => import('./features/diet-plan/diet-plan-form.component').then(m => m.DietPlanFormComponent)
      }
    ]
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./features/onboarding/onboarding.component').then(m => m.OnboardingComponent)
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
