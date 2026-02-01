import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { tap, catchError, of } from 'rxjs';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  private _user = signal<User | null>(null);
  private _token = signal<string | null>(null);
  private _loading = signal(false);

  user = this._user.asReadonly();
  token = this._token.asReadonly();
  loading = this._loading.asReadonly();
  isAuthenticated = computed(() => !!this._token());

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      this._token.set(token);
      this._user.set(JSON.parse(userStr));
    }
  }

  private saveToStorage(token: string, user: User) {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  private clearStorage() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  }

  register(email: string, password: string, name: string) {
    this._loading.set(true);
    return this.api.post<AuthResponse>('/auth/register', { email, password, name }).pipe(
      tap(response => {
        this._token.set(response.accessToken);
        this._user.set(response.user);
        this.saveToStorage(response.accessToken, response.user);
        this._loading.set(false);
      }),
      catchError(error => {
        this._loading.set(false);
        throw error;
      })
    );
  }

  login(email: string, password: string) {
    this._loading.set(true);
    return this.api.post<AuthResponse>('/auth/login', { email, password }).pipe(
      tap(response => {
        this._token.set(response.accessToken);
        this._user.set(response.user);
        this.saveToStorage(response.accessToken, response.user);
        this._loading.set(false);
      }),
      catchError(error => {
        this._loading.set(false);
        throw error;
      })
    );
  }

  logout() {
    this.api.post('/auth/logout').pipe(
      catchError(() => of(null))
    ).subscribe(() => {
      this._token.set(null);
      this._user.set(null);
      this.clearStorage();
      this.router.navigate(['/auth/login']);
    });
  }

  refreshToken() {
    return this.api.post<AuthResponse>('/auth/refresh').pipe(
      tap(response => {
        this._token.set(response.accessToken);
        this._user.set(response.user);
        this.saveToStorage(response.accessToken, response.user);
      }),
      catchError(error => {
        this.logout();
        throw error;
      })
    );
  }
}
